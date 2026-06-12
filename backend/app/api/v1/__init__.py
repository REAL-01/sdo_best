from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.courses import router as courses_router
from app.api.v1.lessons import router as lessons_router
from app.api.v1.tests import router as tests_router
from app.api.v1.profile import router as profile_router
from app.api.v1.users import router as users_router
from app.api.v1.resources import router as resources_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(courses_router, prefix="/courses", tags=["courses"])
api_router.include_router(lessons_router, prefix="/lessons", tags=["lessons"])
api_router.include_router(tests_router, prefix="/tests", tags=["tests"])
api_router.include_router(profile_router, prefix="/profile", tags=["profile"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(resources_router, prefix="/resources", tags=["resources"])
