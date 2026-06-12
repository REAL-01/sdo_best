import json
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime

class AnswerCreate(BaseModel):
    text: str
    is_correct: bool = False
    match_text: str | None = None
    tolerance: float | None = None

class AnswerResponse(BaseModel):
    id: int
    question_id: int
    text: str
    is_correct: bool
    match_text: str | None = None
    tolerance: float | None = None

    model_config = ConfigDict(from_attributes=True)

class AnswerStudentResponse(BaseModel):
    id: int
    question_id: int
    text: str

    model_config = ConfigDict(from_attributes=True)

class QuestionCreate(BaseModel):
    text: str
    order: int = 0
    qtype: str = "multiple_choice"
    answers: list[AnswerCreate]

class QuestionResponse(BaseModel):
    id: int
    test_id: int
    text: str
    order: int
    qtype: str
    answers: list[AnswerResponse]

    model_config = ConfigDict(from_attributes=True)

class QuestionStudentResponse(BaseModel):
    id: int
    test_id: int
    text: str
    order: int
    qtype: str
    answers: list[AnswerStudentResponse]
    matching_options: list[str] | None = None

    model_config = ConfigDict(from_attributes=True)

class TestCreate(BaseModel):
    title: str
    description: str | None = None
    passing_score: float = 70.0
    lesson_id: int
    max_attempts: int | None = None
    timer_minutes: int | None = None
    deadline: datetime | None = None
    questions: list[QuestionCreate]

class TestResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    passing_score: float
    lesson_id: int
    max_attempts: int | None = None
    timer_minutes: int | None = None
    deadline: datetime | None = None
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionResponse]

    model_config = ConfigDict(from_attributes=True)

class TestStudentResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    passing_score: float
    lesson_id: int
    max_attempts: int | None = None
    timer_minutes: int | None = None
    deadline: datetime | None = None
    questions: list[QuestionStudentResponse]

    model_config = ConfigDict(from_attributes=True)

class QuestionSubmit(BaseModel):
    question_id: int
    selected_answer_id: int | None = None
    selected_answer_ids: list[int] | None = None
    text_response: str | None = None
    matching_response: dict[int, str] | None = None

class TestSubmit(BaseModel):
    answers: list[QuestionSubmit]

class TestResultResponse(BaseModel):
    id: int
    test_id: int
    student_id: int
    score: float
    passed: bool
    started_at: datetime
    completed_at: datetime | None = None
    is_graded: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StudentAnswerResponse(BaseModel):
    id: int
    question_id: int
    selected_answer_id: int | None = None
    selected_answer_ids: list[int] | None = None
    text_response: str | None = None
    matching_response: dict[int, str] | None = None
    score: float

    model_config = ConfigDict(from_attributes=True)

    @field_validator("selected_answer_ids", mode="before")
    @classmethod
    def parse_ids(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

    @field_validator("matching_response", mode="before")
    @classmethod
    def parse_matching(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return {}
        return v

class TestResultDetailResponse(TestResultResponse):
    student_answers: list[StudentAnswerResponse]
    test: TestResponse

    model_config = ConfigDict(from_attributes=True)

class EssayGradeSubmit(BaseModel):
    question_id: int
    score: float

class TestResultGradeUpdate(BaseModel):
    score: float
    passed: bool | None = None

class EnrolledCourseDetail(BaseModel):
    id: int
    title: str
    description: str | None = None
    enrolled_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StudentProfileResponse(BaseModel):
    id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None
    role: str
    enrollments: list[EnrolledCourseDetail]
    test_results: list[TestResultResponse]

    model_config = ConfigDict(from_attributes=True)

class AnswerSubmit(BaseModel):
    question_id: int
    answer_id: int
