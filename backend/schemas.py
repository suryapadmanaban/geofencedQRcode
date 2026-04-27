from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

# Auth Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    register_number: Optional[str] = None
    roll_number: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

# Session Schemas
class SessionCreate(BaseModel):
    class_name: str
    duration_minutes: int
    latitude: Decimal
    longitude: Decimal

class SessionResponse(BaseModel):
    id: int
    faculty_id: int
    class_name: str
    start_time: datetime
    expiry_time: datetime
    latitude: Decimal
    longitude: Decimal

    class Config:
        from_attributes = True

# Attendance Schemas
class AttendanceMark(BaseModel):
    session_id: int
    latitude: Decimal
    longitude: Decimal

class AttendanceResponse(BaseModel):
    id: int
    session_id: int
    student_id: int
    student_name: Optional[str] = None
    register_number: Optional[str] = None
    roll_number: Optional[str] = None
    timestamp: datetime
    status: str

    class Config:
        from_attributes = True
