import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models.base import Base
from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.schemas.course import CourseCreate, ModuleCreate, LessonCreate
from app.crud.user import create_user
from app.crud.course import (
    create_course, create_module, create_lesson, 
    is_student_enrolled, enroll_student
)

async def test_courses_flow():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with SessionLocal() as db:
        teacher_in = UserCreate(
            email="teacher@example.com",
            password="SecurePass_1!",
            first_name="Jane",
            last_name="Smith",
            role=UserRole.TEACHER
        )
        teacher = await create_user(db, teacher_in)
        
        student_in = UserCreate(
            email="student@example.com",
            password="SecurePass_2!",
            first_name="Bob",
            last_name="Jones",
            role=UserRole.STUDENT
        )
        student = await create_user(db, student_in)
        
        course_in = CourseCreate(
            title="FastAPI Web Development",
            description="Learn how to build production APIs"
        )
        course = await create_course(db, course_in, teacher_id=teacher.id)
        assert course.title == "FastAPI Web Development"
        assert course.teacher_id == teacher.id
        
        module_in = ModuleCreate(
            title="Introduction to FastAPI",
            description="Getting started with your first API",
            course_id=course.id,
            order=1
        )
        module = await create_module(db, module_in)
        assert module.title == "Introduction to FastAPI"
        assert module.course_id == course.id
        
        lesson_in = LessonCreate(
            title="Hello World Endpoint",
            content="Markdown code...",
            video_url="https://youtube.com/something",
            order=1,
            module_id=module.id
        )
        lesson = await create_lesson(db, lesson_in)
        assert lesson.title == "Hello World Endpoint"
        assert lesson.module_id == module.id
        
        enrolled_before = await is_student_enrolled(db, student_id=student.id, course_id=course.id)
        assert enrolled_before is False
        
        await enroll_student(db, student_id=student.id, course_id=course.id)
        enrolled_after = await is_student_enrolled(db, student_id=student.id, course_id=course.id)
        assert enrolled_after is True
        
        print("Course and Lesson CRUD verification successful!")

if __name__ == "__main__":
    asyncio.run(test_courses_flow())
