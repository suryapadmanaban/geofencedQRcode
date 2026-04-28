from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import os
import openpyxl

import models, schemas, auth_utils, utils, kafka_producer
from database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Geo-Fenced QR Attendance System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

@app.post("/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    print(f"DEBUG: Registering user {user.email}")
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth_utils.get_password_hash(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role,
        register_number=user.register_number,
        roll_number=user.roll_number
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if user.role == 'student':
        try:
            excel_file = "registered_students.xlsx"
            if not os.path.exists(excel_file):
                wb = openpyxl.Workbook()
                ws = wb.active
                ws.title = "Students"
                ws.append(["Name", "Register Number", "Roll Number", "Email"])
                wb.save(excel_file)
            
            wb = openpyxl.load_workbook(excel_file)
            ws = wb.active
            ws.append([user.name, user.register_number, user.roll_number, user.email])
            wb.save(excel_file)
            print(f"DEBUG: Successfully added {user.email} to Excel")
        except Exception as e:
            print(f"ERROR: Failed to save to Excel: {e}")
            # We don't raise an exception here because the user is already created in the DB

    return new_user

@app.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    # Note: schemas.UserCreate is used here for convenience, 
    # but only email and password are required for login.
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth_utils.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = auth_utils.create_access_token(
        data={"sub": db_user.email, "role": db_user.role, "user_id": db_user.id}
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": db_user.role,
        "name": db_user.name
    }

from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = auth_utils.decode_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    email: str = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def get_faculty_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role != 'faculty':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return current_user

@app.post("/faculty/create-session", response_model=schemas.SessionResponse)
def create_session(session_data: schemas.SessionCreate, faculty: models.User = Depends(get_faculty_user), db: Session = Depends(get_db)):
    now_utc = datetime.utcnow()
    expiry_time = now_utc + timedelta(minutes=session_data.duration_minutes)
    new_session = models.Session(
        faculty_id=faculty.id,
        class_name=session_data.class_name,
        start_time=now_utc,
        expiry_time=expiry_time,
        latitude=session_data.latitude,
        longitude=session_data.longitude
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@app.get("/faculty/sessions", response_model=List[schemas.SessionResponse])
def get_sessions(faculty: models.User = Depends(get_faculty_user), db: Session = Depends(get_db)):
    return db.query(models.Session).filter(models.Session.faculty_id == faculty.id).all()

@app.post("/student/mark-attendance", response_model=schemas.AttendanceResponse)
def mark_attendance(data: schemas.AttendanceMark, student: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    print(f"DEBUG: Mark attendance request from student {student.id} ({student.name}) for session {data.session_id}")
    if student.role != 'student':
        raise HTTPException(status_code=403, detail="Only students can mark attendance")

    session = db.query(models.Session).filter(models.Session.id == data.session_id).first()
    if not session:
        print(f"DEBUG: Session {data.session_id} not found")
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check expiration with a 1-minute grace period for clock skew
    current_time = datetime.utcnow()
    is_expired = current_time > (session.expiry_time + timedelta(minutes=1))
    
    print(f"DEBUG: Session check - Now (UTC): {current_time}, Expiry (UTC): {session.expiry_time}")
    
    if is_expired:
        print(f"DEBUG: Session {data.session_id} EXPIRED. Now: {current_time}, Expiry: {session.expiry_time}")
        raise HTTPException(status_code=400, detail="Session expired")
    
    # Verify Distance (Geo-fencing)
    distance = utils.calculate_distance(data.latitude, data.longitude, session.latitude, session.longitude)
    if distance > 500: # 500 meters radius
        print(f"DEBUG: Student too far: {distance}m. Student: ({data.latitude}, {data.longitude}), Session: ({session.latitude}, {session.longitude})")
        raise HTTPException(status_code=400, detail=f"Too far from location. Distance: {int(distance)}m")

    # Check duplicate
    existing = db.query(models.Attendance).filter(
        models.Attendance.session_id == data.session_id,
        models.Attendance.student_id == student.id
    ).first()
    if existing:
        print(f"DEBUG: Attendance already exists for student {student.id} and session {data.session_id}")
        raise HTTPException(status_code=400, detail="Attendance already marked")

    print(f"DEBUG: Success! Marking attendance for student {student.id}")
    new_attendance = models.Attendance(
        session_id=data.session_id,
        student_id=student.id,
        status="present"
    )
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)

    # Send to Kafka
    kafka_producer.send_attendance_event({
        "session_id": new_attendance.session_id,
        "student_id": new_attendance.student_id,
        "student_name": student.name,
        "timestamp": str(new_attendance.timestamp),
        "status": new_attendance.status
    })

    return new_attendance

@app.get("/faculty/attendance/{session_id}", response_model=List[schemas.AttendanceResponse])
def get_attendance(session_id: int, faculty: models.User = Depends(get_faculty_user), db: Session = Depends(get_db)):
    results = db.query(models.Attendance, models.User.name, models.User.register_number, models.User.roll_number).join(
        models.User, models.Attendance.student_id == models.User.id
    ).filter(models.Attendance.session_id == session_id).all()
    
    attendance_list = []
    for att, name, reg, roll in results:
        att_dict = schemas.AttendanceResponse.from_orm(att)
        att_dict.student_name = name
        att_dict.register_number = reg
        att_dict.roll_number = roll
        attendance_list.append(att_dict)
    
    return attendance_list

from fastapi.responses import StreamingResponse
import pandas as pd
import io

@app.get("/faculty/export/{session_id}")
def export_attendance(session_id: int, faculty: models.User = Depends(get_faculty_user), db: Session = Depends(get_db)):
    # Verify session belongs to faculty
    session = db.query(models.Session).filter(models.Session.id == session_id, models.Session.faculty_id == faculty.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or unauthorized")

    results = db.query(
        models.User.name, 
        models.User.register_number, 
        models.User.roll_number, 
        models.User.email, 
        models.Attendance.timestamp, 
        models.Attendance.status
    ).join(
        models.Attendance, models.Attendance.student_id == models.User.id
    ).filter(models.Attendance.session_id == session_id).all()

    df = pd.DataFrame(results, columns=["Student Name", "Register Number", "Roll Number", "Email", "Timestamp", "Status"])
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Attendance')
    
    headers = {
        'Content-Disposition': f'attachment; filename="attendance_{session.class_name}_{session_id}.xlsx"'
    }
    output.seek(0)
    return StreamingResponse(
        output, 
        headers=headers, 
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
