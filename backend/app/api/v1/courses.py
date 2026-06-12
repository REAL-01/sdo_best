from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud import course as crud_course
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseResponse, CourseDetailResponse,
    ModuleCreate, ModuleUpdate, ModuleResponse
)
from app.models.user import User, UserRole

router = APIRouter()

@router.get("/", response_model=list[CourseResponse])
async def get_all_courses(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return await crud_course.get_courses(db, skip=skip, limit=limit)

@router.post("/", response_model=CourseResponse)
async def create_new_course(
    course_in: CourseCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    return await crud_course.create_course(db, course_in=course_in, teacher_id=current_user.id)

@router.get("/{id}", response_model=CourseDetailResponse)
async def get_course_details(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    course = await crud_course.get_course(db, course_id=id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )
    return course

@router.put("/{id}", response_model=CourseResponse)
async def update_existing_course(
    id: int,
    course_in: CourseUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    course = await crud_course.get_course(db, course_id=id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )
    if current_user.role != UserRole.ADMIN and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не являетесь преподавателем этого курса"
        )
    return await crud_course.update_course(db, db_course=course, course_in=course_in)

@router.delete("/{id}")
async def delete_existing_course(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    course = await crud_course.get_course(db, course_id=id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )
    if current_user.role != UserRole.ADMIN and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не являетесь преподавателем этого курса"
        )
    await crud_course.delete_course(db, course_id=id)
    return {"message": "Курс успешно удален"}

@router.post("/{id}/enroll")
async def enroll_student_in_course(
    id: int,
    student_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    course = await crud_course.get_course(db, course_id=id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )
    if current_user.role != UserRole.ADMIN and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете записывать студентов на чужой курс"
        )
    
    from sqlalchemy import select
    from app.models.user import User as UserModel
    student_result = await db.execute(select(UserModel).where(UserModel.id == student_id))
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Студент не найден"
        )
        
    already_enrolled = await crud_course.is_student_enrolled(db, student_id=student_id, course_id=id)
    if already_enrolled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Студент уже записан на этот курс"
        )
    await crud_course.enroll_student(db, student_id=student_id, course_id=id)
    return {"message": "Студент успешно записан на курс"}

@router.post("/modules", response_model=ModuleResponse)
async def create_new_module(
    module_in: ModuleCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    course = await crud_course.get_course(db, course_id=module_in.course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )
    if current_user.role != UserRole.ADMIN and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете добавлять модули в чужой курс"
        )
    return await crud_course.create_module(db, module_in=module_in)

@router.put("/modules/{id}", response_model=ModuleResponse)
async def update_existing_module(
    id: int,
    module_in: ModuleUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    module = await crud_course.get_module(db, module_id=id)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Модуль не найден"
        )
    if current_user.role != UserRole.ADMIN and module.course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете редактировать модули чужого курса"
        )
    return await crud_course.update_module(db, db_module=module, module_in=module_in)

@router.delete("/modules/{id}")
async def delete_existing_module(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    module = await crud_course.get_module(db, module_id=id)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Модуль не найден"
        )
    if current_user.role != UserRole.ADMIN and module.course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете удалять модули чужого курса"
        )
    await crud_course.delete_module(db, module_id=id)
    return {"message": "Модуль успешно удален"}
