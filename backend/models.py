from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, DECIMAL, TIMESTAMP, func, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum('faculty', 'student'), nullable=False)
    register_number = Column(String(50), nullable=True)
    roll_number = Column(String(50), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    sessions = relationship("Session", back_populates="faculty")
    attendances = relationship("Attendance", back_populates="student")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_name = Column(String(255), nullable=False)
    start_time = Column(TIMESTAMP, server_default=func.now())
    expiry_time = Column(TIMESTAMP, nullable=False)
    latitude = Column(DECIMAL(10, 8), nullable=False)
    longitude = Column(DECIMAL(11, 8), nullable=False)

    faculty = relationship("User", back_populates="sessions")
    attendances = relationship("Attendance", back_populates="session")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(TIMESTAMP, server_default=func.now())
    status = Column(String(50), default="present")

    session = relationship("Session", back_populates="attendances")
    student = relationship("User", back_populates="attendances")

    __table_args__ = (UniqueConstraint('session_id', 'student_id', name='unique_attendance'),)
