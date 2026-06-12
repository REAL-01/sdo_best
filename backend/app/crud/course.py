from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.course import Course, Module, Lesson
from app.models.user import Enrollment
from app.schemas.course import (
    CourseCreate, CourseUpdate,
    ModuleCreate, ModuleUpdate,
    LessonCreate, LessonUpdate
)

async def get_courses(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Course]:
    result = await db.execute(select(Course).offset(skip).limit(limit))
    return list(result.scalars().all())

async def get_course(db: AsyncSession, course_id: int) -> Course | None:
    result = await db.execute(
        select(Course)
        .where(Course.id == course_id)
        .options(
            selectinload(Course.modules).selectinload(Module.lessons)
        )
    )
    return result.scalar_one_or_none()

async def create_course(db: AsyncSession, course_in: CourseCreate, teacher_id: int) -> Course:
    db_course = Course(
        title=course_in.title,
        description=course_in.description,
        teacher_id=teacher_id
    )
    db.add(db_course)
    await db.commit()
    await db.refresh(db_course)
    return db_course

async def update_course(db: AsyncSession, db_course: Course, course_in: CourseUpdate) -> Course:
    if course_in.title is not None:
        db_course.title = course_in.title
    if course_in.description is not None:
        db_course.description = course_in.description
    db.add(db_course)
    await db.commit()
    await db.refresh(db_course)
    return db_course

async def delete_course(db: AsyncSession, course_id: int) -> bool:
    result = await db.execute(select(Course).where(Course.id == course_id))
    db_course = result.scalar_one_or_none()
    if not db_course:
        return False
    await db.delete(db_course)
    await db.commit()
    return True

async def get_module(db: AsyncSession, module_id: int) -> Module | None:
    result = await db.execute(
        select(Module)
        .where(Module.id == module_id)
        .options(selectinload(Module.course))
    )
    return result.scalar_one_or_none()

async def create_module(db: AsyncSession, module_in: ModuleCreate) -> Module:
    db_module = Module(
        title=module_in.title,
        description=module_in.description,
        order=module_in.order,
        course_id=module_in.course_id
    )
    db.add(db_module)
    await db.commit()
    await db.refresh(db_module)
    return db_module

async def update_module(db: AsyncSession, db_module: Module, module_in: ModuleUpdate) -> Module:
    if module_in.title is not None:
        db_module.title = module_in.title
    if module_in.description is not None:
        db_module.description = module_in.description
    if module_in.order is not None:
        db_module.order = module_in.order
    db.add(db_module)
    await db.commit()
    await db.refresh(db_module)
    return db_module

async def delete_module(db: AsyncSession, module_id: int) -> bool:
    result = await db.execute(select(Module).where(Module.id == module_id))
    db_module = result.scalar_one_or_none()
    if not db_module:
        return False
    await db.delete(db_module)
    await db.commit()
    return True

async def get_lesson(db: AsyncSession, lesson_id: int) -> Lesson | None:
    result = await db.execute(
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(
            selectinload(Lesson.module).selectinload(Module.course),
            selectinload(Lesson.test)
        )
    )
    return result.scalar_one_or_none()

async def create_lesson(db: AsyncSession, lesson_in: LessonCreate) -> Lesson:
    db_lesson = Lesson(
        title=lesson_in.title,
        content=lesson_in.content,
        video_url=lesson_in.video_url,
        order=lesson_in.order,
        module_id=lesson_in.module_id
    )
    db.add(db_lesson)
    await db.commit()
    await db.refresh(db_lesson)
    return db_lesson

async def update_lesson(db: AsyncSession, db_lesson: Lesson, lesson_in: LessonUpdate) -> Lesson:
    if lesson_in.title is not None:
        db_lesson.title = lesson_in.title
    if lesson_in.content is not None:
        db_lesson.content = lesson_in.content
    if lesson_in.video_url is not None:
        db_lesson.video_url = lesson_in.video_url
    if lesson_in.order is not None:
        db_lesson.order = lesson_in.order
    db.add(db_lesson)
    await db.commit()
    await db.refresh(db_lesson)
    return db_lesson

async def delete_lesson(db: AsyncSession, lesson_id: int) -> bool:
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    db_lesson = result.scalar_one_or_none()
    if not db_lesson:
        return False
    await db.delete(db_lesson)
    await db.commit()
    return True

async def enroll_student(db: AsyncSession, student_id: int, course_id: int) -> Enrollment:
    db_enrollment = Enrollment(student_id=student_id, course_id=course_id)
    db.add(db_enrollment)
    await db.commit()
    await db.refresh(db_enrollment)
    return db_enrollment

async def is_student_enrolled(db: AsyncSession, student_id: int, course_id: int) -> bool:
    result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.student_id == student_id,
                Enrollment.course_id == course_id
            )
        )
    )
    return result.scalar_one_or_none() is not None
