from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud import resource as crud_resource
from app.models.user import User, UserRole
from app.schemas.resource import ResourceCreate, ResourceResponse

router = APIRouter()

@router.get("/", response_model=list[ResourceResponse])
async def list_all_resources(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return await crud_resource.get_resources(db)

@router.post("/", response_model=ResourceResponse)
async def create_new_resource(
    resource_in: ResourceCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return await crud_resource.create_resource(db, resource_in=resource_in, owner_id=current_user.id)

@router.delete("/{id}")
async def delete_existing_resource(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    db_resource = await crud_resource.get_resource(db, id)
    if not db_resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ресурс не найден"
        )
    if current_user.role != UserRole.ADMIN and db_resource.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете удалить чужой ресурс"
        )
    await crud_resource.delete_resource(db, id)
    return {"message": "Ресурс успешно удален"}
