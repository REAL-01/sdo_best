from app.schemas.user import UserCreate, UserResponse, Token, TokenPayload
from app.schemas.course import (
    LessonCreate, LessonUpdate, LessonResponse,
    ModuleCreate, ModuleUpdate, ModuleResponse,
    CourseCreate, CourseUpdate, CourseResponse,
    CourseDetailResponse
)
from app.schemas.test import (
    AnswerCreate, AnswerResponse, AnswerStudentResponse,
    QuestionCreate, QuestionResponse, QuestionStudentResponse,
    TestCreate, TestResponse, TestStudentResponse,
    AnswerSubmit, QuestionSubmit, TestSubmit, TestResultResponse, TestResultDetailResponse,
    EssayGradeSubmit, TestResultGradeUpdate,
    EnrolledCourseDetail, StudentProfileResponse
)
