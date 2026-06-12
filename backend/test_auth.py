import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models.base import Base
from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.crud.user import create_user, get_user_by_email
from app.core.security import verify_password, create_access_token

async def test_all():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with SessionLocal() as db:
        user_in = UserCreate(
            email="test@example.com",
            password="SecurePass_1!",
            first_name="John",
            last_name="Doe",
            role=UserRole.STUDENT
        )
        
        created = await create_user(db, user_in)
        assert created.email == "test@example.com"
        assert verify_password("SecurePass_1!", created.hashed_password)
        assert not verify_password("wrongpassword", created.hashed_password)
        
        fetched = await get_user_by_email(db, "test@example.com")
        assert fetched is not None
        assert fetched.id == created.id
        
        token = create_access_token(fetched.email)
        assert token is not None
        
        print("All local unit tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_all())
