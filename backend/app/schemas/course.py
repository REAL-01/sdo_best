from pydantic import BaseModel, ConfigDict
from datetime import datetime

class LessonCreate(BaseModel):
    title: str
    content: str | None = None
    video_url: str | None = None
    order: int = 0
    module_id: int

class LessonUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    video_url: str | None = None
    order: int | None = None

class LessonResponse(BaseModel):
    id: int
    title: str
    content: str | None = None
    video_url: str | None = None
    order: int
    module_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ModuleCreate(BaseModel):
    title: str
    description: str | None = None
    order: int = 0
    course_id: int

class ModuleUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    order: int | None = None

class ModuleResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    order: int
    course_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CourseCreate(BaseModel):
    title: str
    description: str | None = None

class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None

class CourseResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    teacher_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LessonShortResponse(BaseModel):
    id: int
    title: str
    order: int

    model_config = ConfigDict(from_attributes=True)

class ModuleWithLessonsResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    order: int
    lessons: list[LessonShortResponse]

    model_config = ConfigDict(from_attributes=True)

class CourseDetailResponse(CourseResponse):
    modules: list[ModuleWithLessonsResponse]

class LessonCourseResponse(BaseModel):
    id: int
    title: str
    teacher_id: int

    model_config = ConfigDict(from_attributes=True)

class LessonModuleResponse(BaseModel):
    id: int
    title: str
    course_id: int
    course: LessonCourseResponse

    model_config = ConfigDict(from_attributes=True)

class LessonTestResponse(BaseModel):
    id: int
    description: str | None = None
    passing_score: float
    deadline: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class LessonDetailResponse(LessonResponse):
    module: LessonModuleResponse
    test: LessonTestResponse | None = None
