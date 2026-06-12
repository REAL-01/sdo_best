from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate

async def get_resources(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Resource]:
    result = await db.execute(select(Resource).offset(skip).limit(limit))
    return list(result.scalars().all())

async def get_resource(db: AsyncSession, resource_id: int) -> Resource | None:
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    return result.scalar_one_or_none()

async def create_resource(db: AsyncSession, resource_in: ResourceCreate, owner_id: int) -> Resource:
    db_resource = Resource(
        title=resource_in.title,
        description=resource_in.description,
        url=resource_in.url,
        owner_id=owner_id
    )
    db.add(db_resource)
    await db.commit()
    await db.refresh(db_resource)
    return db_resource

async def delete_resource(db: AsyncSession, resource_id: int) -> bool:
    db_resource = await get_resource(db, resource_id)
    if not db_resource:
        return False
    await db.delete(db_resource)
    await db.commit()
    return True
