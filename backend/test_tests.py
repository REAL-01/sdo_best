import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models.base import Base
from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.schemas.course import CourseCreate, ModuleCreate, LessonCreate
from app.schemas.test import TestCreate, QuestionCreate, AnswerCreate, TestSubmit, QuestionSubmit, TestStudentResponse
from app.crud.user import create_user
from app.crud.course import create_course, create_module, create_lesson, enroll_student
from app.crud.test import create_test, get_test, create_test_result, get_student_results

async def test_full_flow():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        teacher = await create_user(
            db, 
            UserCreate(email="teacher@example.com", password="SecurePass_1!", role=UserRole.TEACHER)
        )
        student = await create_user(
            db, 
            UserCreate(email="student@example.com", password="SecurePass_1!", role=UserRole.STUDENT)
        )

        course = await create_course(
            db, 
            CourseCreate(title="Course 1"), 
            teacher_id=teacher.id
        )
        module = await create_module(
            db, 
            ModuleCreate(title="Module 1", course_id=course.id)
        )
        lesson = await create_lesson(
            db, 
            LessonCreate(title="Lesson 1", module_id=module.id)
        )

        test_in = TestCreate(
            title="Final Test",
            description="Testing your knowledge",
            passing_score=70.0,
            lesson_id=lesson.id,
            questions=[
                QuestionCreate(
                    text="What is FastAPI?",
                    order=1,
                    answers=[
                        AnswerCreate(text="A framework", is_correct=True),
                        AnswerCreate(text="A database", is_correct=False)
                    ]
                ),
                QuestionCreate(
                    text="What is SQLAlchemy?",
                    order=2,
                    answers=[
                        AnswerCreate(text="An ORM", is_correct=True),
                        AnswerCreate(text="A language", is_correct=False)
                    ]
                )
            ]
        )

        created_test = await create_test(db, test_in)
        assert created_test.title == "Final Test"
        assert len(created_test.questions) == 2
        assert len(created_test.questions[0].answers) == 2

        student_repr = TestStudentResponse.model_validate(created_test)
        assert hasattr(student_repr.questions[0].answers[0], "is_correct") is False

        await enroll_student(db, student_id=student.id, course_id=course.id)

        q1 = created_test.questions[0]
        q2 = created_test.questions[1]
        
        correct_ans_q1 = [a.id for a in q1.answers if a.is_correct][0]
        correct_ans_q2 = [a.id for a in q2.answers if a.is_correct][0]
        
        submission_100 = TestSubmit(
            answers=[
                QuestionSubmit(question_id=q1.id, selected_answer_id=correct_ans_q1),
                QuestionSubmit(question_id=q2.id, selected_answer_id=correct_ans_q2)
            ]
        )
        
        correct_count = 0
        correct_map = {q1.id: correct_ans_q1, q2.id: correct_ans_q2}
        student_answers = {ans.question_id: ans.selected_answer_id for ans in submission_100.answers}
        for q_id, correct_aid in correct_map.items():
            if student_answers.get(q_id) == correct_aid:
                correct_count += 1
        score_100 = (correct_count / 2) * 100.0
        passed_100 = score_100 >= created_test.passing_score
        
        assert score_100 == 100.0
        assert passed_100 is True
        
        result_100 = await create_test_result(
            db, 
            test_id=created_test.id, 
            student_id=student.id, 
            score=score_100, 
            passed=passed_100
        )
        assert result_100.passed is True

        wrong_ans_q2 = [a.id for a in q2.answers if not a.is_correct][0]
        submission_50 = TestSubmit(
            answers=[
                QuestionSubmit(question_id=q1.id, selected_answer_id=correct_ans_q1),
                QuestionSubmit(question_id=q2.id, selected_answer_id=wrong_ans_q2)
            ]
        )
        
        correct_count = 0
        student_answers = {ans.question_id: ans.selected_answer_id for ans in submission_50.answers}
        for q_id, correct_aid in correct_map.items():
            if student_answers.get(q_id) == correct_aid:
                correct_count += 1
        score_50 = (correct_count / 2) * 100.0
        passed_50 = score_50 >= created_test.passing_score
        
        assert score_50 == 50.0
        assert passed_50 is False

        student_results = await get_student_results(db, student_id=student.id)
        assert len(student_results) == 1
        assert student_results[0].passed is True

        print("Tests system business logic flow validated successfully!")

if __name__ == "__main__":
    asyncio.run(test_full_flow())
