from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api import deps
from app.schemas.test import StudentProfileResponse, EnrolledCourseDetail, TestResultResponse
from app.models.user import User, Enrollment

router = APIRouter()

@router.get("/", response_model=StudentProfileResponse)
async def get_profile(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(
        select(User)
        .where(User.id == current_user.id)
        .options(
            selectinload(User.enrollments).selectinload(Enrollment.course),
            selectinload(User.test_results)
        )
    )
    user = result.scalar_one()

    enrollments_detail = []
    for enroll in user.enrollments:
        enrollments_detail.append(
            EnrolledCourseDetail(
                id=enroll.course.id,
                title=enroll.course.title,
                description=enroll.course.description,
                enrolled_at=enroll.enrolled_at
            )
        )

    results_detail = [TestResultResponse.model_validate(res) for res in user.test_results]

    return StudentProfileResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role.value,
        enrollments=enrollments_detail,
        test_results=results_detail
    )
