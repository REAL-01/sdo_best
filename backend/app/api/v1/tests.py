import datetime
import json
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.api import deps
from app.crud import test as crud_test
from app.crud import course as crud_course
from app.models.user import User, UserRole
from app.models.test import Test, StudentAnswer
from app.schemas.test import (
    TestCreate, TestResponse, TestStudentResponse,
    TestSubmit, TestResultResponse, TestResultDetailResponse,
    EssayGradeSubmit, TestResultGradeUpdate
)

router = APIRouter()

@router.post("/", response_model=TestResponse)
async def create_new_test(
    test_in: TestCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    lesson = await crud_course.get_lesson(db, lesson_id=test_in.lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Урок не найден"
        )
    if current_user.role != UserRole.ADMIN and lesson.module.course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете добавлять тесты в чужой курс"
        )
    existing_test = await crud_test.get_test_by_lesson(db, lesson_id=test_in.lesson_id)
    if existing_test:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Тест для этого урока уже существует"
        )
    return await crud_test.create_test(db, test_in=test_in)

from app.models.course import Lesson, Module, Course

@router.get("/deadlines")
async def get_test_deadlines(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    query = (
        select(Test)
        .where(Test.deadline.isnot(None))
        .options(
            selectinload(Test.lesson)
            .selectinload(Lesson.module)
            .selectinload(Module.course)
        )
        .order_by(Test.deadline.asc())
    )
    result = await db.execute(query)
    tests_list = result.scalars().all()
    
    deadlines = []
    for t in tests_list:
        deadlines.append({
            "id": t.id,
            "title": t.title,
            "deadline": t.deadline.isoformat() if t.deadline else None,
            "lesson_id": t.lesson_id,
            "course_title": t.lesson.module.course.title if t.lesson and t.lesson.module and t.lesson.module.course else "Курс"
        })
    return deadlines

@router.get("/{id}")
async def get_test_details(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    test = await crud_test.get_test(db, test_id=id)
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тест не найден"
        )
    
    lesson = await crud_course.get_lesson(db, lesson_id=test.lesson_id)
    if not lesson:
         raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Урок не найден"
        )
         
    if current_user.role == UserRole.STUDENT:
        is_enrolled = await crud_course.is_student_enrolled(db, student_id=current_user.id, course_id=lesson.module.course_id)
        if not is_enrolled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Вы не записаны на этот курс"
            )
        
        questions_data = []
        for q in test.questions:
            answers_data = [{"id": a.id, "question_id": a.question_id, "text": a.text} for a in q.answers]
            if q.qtype in ["short_answer", "numerical", "essay"]:
                answers_data = []
                
            matching_options = None
            if q.qtype == "matching":
                matching_options = list(set([a.match_text for a in q.answers if a.match_text]))
                random.shuffle(matching_options)
                
            questions_data.append({
                "id": q.id,
                "test_id": q.test_id,
                "text": q.text,
                "order": q.order,
                "qtype": q.qtype,
                "answers": answers_data,
                "matching_options": matching_options
            })
        return {
            "id": test.id,
            "title": test.title,
            "description": test.description,
            "passing_score": test.passing_score,
            "lesson_id": test.lesson_id,
            "max_attempts": test.max_attempts,
            "timer_minutes": test.timer_minutes,
            "questions": questions_data
        }
        
    return TestResponse.model_validate(test)

@router.post("/{id}/start", response_model=TestResultResponse)
async def start_test_attempt(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.STUDENT]))
):
    test = await crud_test.get_test(db, test_id=id)
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тест не найден"
        )
    
    results = await crud_test.get_student_results(db, student_id=current_user.id)
    test_attempts = [r for r in results if r.test_id == id]
    
    active_attempt = None
    for attempt in test_attempts:
        if attempt.completed_at is None:
            active_attempt = attempt
            break
            
    if active_attempt:
        if test.timer_minutes:
            elapsed = (datetime.datetime.now(datetime.timezone.utc) - active_attempt.started_at.replace(tzinfo=datetime.timezone.utc)).total_seconds()
            if elapsed > (test.timer_minutes * 60 + 30):
                active_attempt.completed_at = active_attempt.started_at + datetime.timedelta(minutes=test.timer_minutes)
                active_attempt.score = 0.0
                active_attempt.passed = False
                db.add(active_attempt)
                await db.commit()
                active_attempt = None
                
    if active_attempt:
        return active_attempt
        
    if test.max_attempts and len(test_attempts) >= test.max_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы превысили максимальное число попыток для этого теста"
        )
        
    return await crud_test.start_test_result(db, test_id=id, student_id=current_user.id)

@router.post("/{id}/submit", response_model=TestResultResponse)
async def submit_test(
    id: int,
    submission: TestSubmit,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.STUDENT]))
):
    test = await crud_test.get_test(db, test_id=id)
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тест не найден"
        )
        
    results = await crud_test.get_student_results(db, student_id=current_user.id)
    test_attempts = [r for r in results if r.test_id == id]
    
    active_attempt = None
    for attempt in test_attempts:
        if attempt.completed_at is None:
            active_attempt = attempt
            break
            
    if not active_attempt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Тестирование не было начато"
        )
        
    if test.timer_minutes:
        elapsed = (datetime.datetime.now(datetime.timezone.utc) - active_attempt.started_at.replace(tzinfo=datetime.timezone.utc)).total_seconds()
        if elapsed > (test.timer_minutes * 60 + 30):
            active_attempt.completed_at = active_attempt.started_at + datetime.timedelta(minutes=test.timer_minutes)
            active_attempt.score = 0.0
            active_attempt.passed = False
            db.add(active_attempt)
            await db.commit()
            return active_attempt

    sub_map = {ans.question_id: ans for ans in submission.answers}
    total_score = 0.0
    has_essay = False
    
    for question in test.questions:
        q_sub = sub_map.get(question.id)
        q_score = 0.0
        
        sel_ans_id = None
        sel_ans_ids = None
        text_resp = None
        match_resp = None
        
        if q_sub:
            sel_ans_id = q_sub.selected_answer_id
            if q_sub.selected_answer_ids:
                sel_ans_ids = json.dumps(q_sub.selected_answer_ids)
            text_resp = q_sub.text_response
            if q_sub.matching_response:
                match_resp = json.dumps(q_sub.matching_response)
                
            if question.qtype == "multiple_choice":
                correct_ids = {a.id for a in question.answers if a.is_correct}
                selected_ids = set(q_sub.selected_answer_ids or [])
                if correct_ids == selected_ids:
                    q_score = 1.0
            elif question.qtype == "true_false":
                correct_id = next((a.id for a in question.answers if a.is_correct), None)
                if q_sub.selected_answer_id == correct_id:
                    q_score = 1.0
            elif question.qtype == "short_answer":
                if q_sub.text_response:
                    val = q_sub.text_response.strip().lower()
                    correct_texts = [a.text.strip().lower() for a in question.answers if a.is_correct]
                    if val in correct_texts:
                        q_score = 1.0
            elif question.qtype == "numerical":
                if q_sub.text_response:
                    try:
                        val = float(q_sub.text_response.strip())
                        for a in question.answers:
                            if a.is_correct:
                                target = float(a.text.strip())
                                tol = a.tolerance if a.tolerance is not None else 0.0
                                if abs(val - target) <= tol:
                                    q_score = 1.0
                                    break
                    except ValueError:
                        pass
            elif question.qtype == "matching":
                if q_sub.matching_response:
                    correct_matches = {str(a.id): a.match_text for a in question.answers if a.match_text}
                    correct_count = 0
                    total_pairs = len(correct_matches)
                    if total_pairs > 0:
                        for k, v in q_sub.matching_response.items():
                            if correct_matches.get(str(k)) == v:
                                correct_count += 1
                        q_score = correct_count / total_pairs
            elif question.qtype == "select_missing_words":
                correct_ids = {a.id for a in question.answers if a.is_correct}
                selected_ids = set(q_sub.selected_answer_ids or [])
                if correct_ids and selected_ids:
                    correct_selected = correct_ids.intersection(selected_ids)
                    incorrect_selected = selected_ids.difference(correct_ids)
                    if not incorrect_selected:
                        q_score = len(correct_selected) / len(correct_ids)
            elif question.qtype == "essay":
                has_essay = True
                q_score = 0.0
                
        total_score += q_score
        
        db_sa = StudentAnswer(
            test_result_id=active_attempt.id,
            question_id=question.id,
            selected_answer_id=sel_ans_id,
            selected_answer_ids=sel_ans_ids,
            text_response=text_resp,
            matching_response=match_resp,
            score=q_score
        )
        db.add(db_sa)
        
    num_questions = len(test.questions)
    final_score = (total_score / num_questions * 100.0) if num_questions > 0 else 100.0
    
    active_attempt.score = final_score
    active_attempt.passed = final_score >= test.passing_score
    active_attempt.completed_at = datetime.datetime.now(datetime.timezone.utc)
    active_attempt.is_graded = not has_essay
    
    db.add(active_attempt)
    await db.commit()
    await db.refresh(active_attempt)
    return active_attempt

@router.get("/{id}/results", response_model=list[TestResultResponse])
async def get_test_results(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    test = await crud_test.get_test(db, test_id=id)
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тест не найден"
        )
        
    if current_user.role == UserRole.STUDENT:
        results = await crud_test.get_student_results(db, student_id=current_user.id)
        return [r for r in results if r.test_id == id]
        
    return await crud_test.get_test_results_by_test(db, test_id=id)

@router.get("/results/{result_id}", response_model=TestResultDetailResponse)
async def get_test_attempt_details(
    result_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    result = await crud_test.get_test_result(db, result_id=result_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Результат не найден"
        )
    if current_user.role == UserRole.STUDENT and result.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен"
        )
    return result

@router.put("/results/{result_id}/grade", response_model=TestResultResponse)
async def grade_essay_attempt(
    result_id: int,
    grades: list[EssayGradeSubmit],
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    result = await crud_test.get_test_result(db, result_id=result_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Результат теста не найден"
        )
        
    lesson = await crud_course.get_lesson(db, lesson_id=result.test.lesson_id)
    if current_user.role != UserRole.ADMIN and lesson.module.course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете оценивать тесты на чужом курсе"
        )
        
    grades_map = {g.question_id: g.score for g in grades}
    sa_result = await db.execute(select(StudentAnswer).where(StudentAnswer.test_result_id == result_id))
    db_answers = sa_result.scalars().all()
    
    for sa in db_answers:
        if sa.question_id in grades_map:
            sa.score = grades_map[sa.question_id]
            db.add(sa)
            
    await db.flush()
    
    total_score = sum(sa.score for sa in db_answers)
    num_questions = len(result.test.questions)
    final_score = (total_score / num_questions * 100.0) if num_questions > 0 else 100.0
    
    result.score = final_score
    result.passed = final_score >= result.test.passing_score
    result.is_graded = True
    
    db.add(result)
    await db.commit()
    await db.refresh(result)
    return result

@router.put("/results/{result_id}/score", response_model=TestResultResponse)
async def override_attempt_score(
    result_id: int,
    grade_in: TestResultGradeUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    result = await crud_test.get_test_result(db, result_id=result_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Результат теста не найден"
        )
    lesson = await crud_course.get_lesson(db, lesson_id=result.test.lesson_id)
    if current_user.role != UserRole.ADMIN and lesson.module.course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете изменять оценки на чужом курсе"
        )
    
    result.score = grade_in.score
    if grade_in.passed is not None:
        result.passed = grade_in.passed
    else:
        result.passed = grade_in.score >= result.test.passing_score
        
    db.add(result)
    await db.commit()
    await db.refresh(result)
    return result

@router.delete("/results/{result_id}")
async def delete_test_attempt(
    result_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMIN, UserRole.TEACHER]))
):
    result = await crud_test.get_test_result(db, result_id=result_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Результат теста не найден"
        )
    lesson = await crud_course.get_lesson(db, lesson_id=result.test.lesson_id)
    if current_user.role != UserRole.ADMIN and lesson.module.course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете удалять оценки на чужом курсе"
        )
    await crud_test.delete_test_result(db, result_id=result_id)
    return {"message": "Попытка успешно аннулирована"}
