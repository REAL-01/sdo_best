from typing import List
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    teacher: Mapped["User"] = relationship("User", back_populates="taught_courses")
    modules: Mapped[List["Module"]] = relationship(
        "Module", 
        back_populates="course", 
        cascade="all, delete-orphan", 
        order_by="Module.order"
    )
    enrollments: Mapped[List["Enrollment"]] = relationship(
        "Enrollment", 
        back_populates="course", 
        cascade="all, delete-orphan"
    )

class Module(Base, TimestampMixin):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(default=0, nullable=False)

    course: Mapped["Course"] = relationship("Course", back_populates="modules")
    lessons: Mapped[List["Lesson"]] = relationship(
        "Lesson", 
        back_populates="module", 
        cascade="all, delete-orphan", 
        order_by="Lesson.order"
    )

class Lesson(Base, TimestampMixin):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    order: Mapped[int] = mapped_column(default=0, nullable=False)

    module: Mapped["Module"] = relationship("Module", back_populates="lessons")
    test: Mapped["Test | None"] = relationship(
        "Test", 
        back_populates="lesson", 
        uselist=False, 
        cascade="all, delete-orphan"
    )
