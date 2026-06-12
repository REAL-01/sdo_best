from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.test import Test, Question, Answer, TestResult, StudentAnswer
from app.schemas.test import TestCreate

async def get_test(db: AsyncSession, test_id: int) -> Test | None:
    result = await db.execute(
        select(Test)
        .where(Test.id == test_id)
        .options(selectinload(Test.questions).selectinload(Question.answers))
    )
    return result.scalar_one_or_none()

async def get_test_by_lesson(db: AsyncSession, lesson_id: int) -> Test | None:
    result = await db.execute(
        select(Test)
        .where(Test.lesson_id == lesson_id)
        .options(selectinload(Test.questions).selectinload(Question.answers))
    )
    return result.scalar_one_or_none()

async def create_test(db: AsyncSession, test_in: TestCreate) -> Test:
    db_test = Test(
        title=test_in.title,
        description=test_in.description,
        passing_score=test_in.passing_score,
        lesson_id=test_in.lesson_id,
        max_attempts=test_in.max_attempts,
        timer_minutes=test_in.timer_minutes,
        deadline=test_in.deadline
    )
    db.add(db_test)
    await db.flush()

    for q_idx, q_in in enumerate(test_in.questions):
        db_question = Question(
            text=q_in.text,
            order=q_in.order or q_idx,
            qtype=q_in.qtype,
            test_id=db_test.id
        )
        db.add(db_question)
        await db.flush()

        for a_in in q_in.answers:
            db_answer = Answer(
                text=a_in.text,
                is_correct=a_in.is_correct,
                match_text=a_in.match_text,
                tolerance=a_in.tolerance,
                question_id=db_question.id
            )
            db.add(db_answer)

    await db.commit()
    return await get_test(db, db_test.id)

async def get_student_results(db: AsyncSession, student_id: int) -> list[TestResult]:
    result = await db.execute(
        select(TestResult)
        .where(TestResult.student_id == student_id)
        .options(selectinload(TestResult.test))
    )
    return list(result.scalars().all())

async def get_test_results_by_test(db: AsyncSession, test_id: int) -> list[TestResult]:
    result = await db.execute(
        select(TestResult)
        .where(TestResult.test_id == test_id)
        .options(selectinload(TestResult.student))
    )
    return list(result.scalars().all())

async def get_test_result(db: AsyncSession, result_id: int) -> TestResult | None:
    result = await db.execute(
        select(TestResult)
        .where(TestResult.id == result_id)
        .options(
            selectinload(TestResult.student_answers),
            selectinload(TestResult.test).selectinload(Test.questions),
            selectinload(TestResult.student)
        )
    )
    return result.scalar_one_or_none()

async def delete_test_result(db: AsyncSession, result_id: int) -> bool:
    db_result = await get_test_result(db, result_id)
    if not db_result:
        return False
    await db.delete(db_result)
    await db.commit()
    return True

async def start_test_result(db: AsyncSession, test_id: int, student_id: int) -> TestResult:
    db_result = TestResult(
        test_id=test_id,
        student_id=student_id,
        score=0.0,
        passed=False,
        completed_at=None,
        is_graded=True
    )
    db.add(db_result)
    await db.commit()
    await db.refresh(db_result)
    return db_result

async def create_test_result(
    db: AsyncSession, 
    test_id: int, 
    student_id: int, 
    score: float, 
    passed: bool
) -> TestResult:
    db_result = TestResult(
        test_id=test_id,
        student_id=student_id,
        score=score,
        passed=passed
    )
    db.add(db_result)
    await db.commit()
    await db.refresh(db_result)
    return db_result
