from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud import course as crud_course
from app.schemas.course import LessonCreate, LessonUpdate, LessonResponse, LessonDetailResponse
from app.models.user import User, UserRole

router = APIRouter()

@router.post("/", response_model=LessonResponse)
async def create_new_lesson(
    lesson_in: LessonCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    module = await crud_course.get_module(db, module_id=lesson_in.module_id)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Модуль не найден"
        )
    if current_user.role != UserRole.ADMIN and module.course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете добавлять уроки в чужой курс"
        )
    return await crud_course.create_lesson(db, lesson_in=lesson_in)

@router.get("/{id}", response_model=LessonDetailResponse)
async def get_lesson_content(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    lesson = await crud_course.get_lesson(db, lesson_id=id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Урок не найден"
        )
    
    if current_user.role == UserRole.STUDENT:
        course_id = lesson.module.course_id
        is_enrolled = await crud_course.is_student_enrolled(db, student_id=current_user.id, course_id=course_id)
        if not is_enrolled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Вы не записаны на этот курс"
            )
            
    return lesson

@router.put("/{id}", response_model=LessonResponse)
async def update_existing_lesson(
    id: int,
    lesson_in: LessonUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    lesson = await crud_course.get_lesson(db, lesson_id=id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Урок не найден"
        )
    if current_user.role != UserRole.ADMIN and lesson.module.course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете редактировать уроки чужого курса"
        )
    return await crud_course.update_lesson(db, db_lesson=lesson, lesson_in=lesson_in)

@router.delete("/{id}")
async def delete_existing_lesson(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    lesson = await crud_course.get_lesson(db, lesson_id=id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Урок не найден"
        )
    if current_user.role != UserRole.ADMIN and lesson.module.course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете удалять уроки чужого курса"
        )
    await crud_course.delete_lesson(db, lesson_id=id)
    return {"message": "Урок успешно удален"}
