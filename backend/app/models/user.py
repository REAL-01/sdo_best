import enum
import datetime
from typing import List
from sqlalchemy import String, Enum, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", create_type=True), 
        default=UserRole.STUDENT, 
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    taught_courses: Mapped[List["Course"]] = relationship(
        "Course", 
        back_populates="teacher", 
        cascade="all, delete-orphan"
    )
    enrollments: Mapped[List["Enrollment"]] = relationship(
        "Enrollment", 
        back_populates="student", 
        cascade="all, delete-orphan"
    )
    test_results: Mapped[List["TestResult"]] = relationship(
        "TestResult", 
        back_populates="student", 
        cascade="all, delete-orphan"
    )

class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    enrolled_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )

    student: Mapped["User"] = relationship("User", back_populates="enrollments")
    course: Mapped["Course"] = relationship("Course", back_populates="enrollments")
