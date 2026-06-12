from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    result = await db.execute(select(User))
    return list(result.scalars().all())

@router.put("/{id}", response_model=UserResponse)
async def update_user(
    id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN]))
):
    result = await db.execute(select(User).where(User.id == id))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    if user_in.first_name is not None:
        db_user.first_name = user_in.first_name
    if user_in.last_name is not None:
        db_user.last_name = user_in.last_name
    if user_in.role is not None:
        db_user.role = user_in.role
    if user_in.is_active is not None:
        db_user.is_active = user_in.is_active

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.delete("/{id}")
async def delete_user(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN]))
):
    if current_user.id == id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы не можете удалить самого себя"
        )
    result = await db.execute(select(User).where(User.id == id))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    await db.delete(db_user)
    await db.commit()
    return {"message": "Пользователь успешно удален"}
