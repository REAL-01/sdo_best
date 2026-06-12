import datetime
from typing import List
from sqlalchemy import ForeignKey, String, Text, Float, Boolean, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Test(Base, TimestampMixin):
    __tablename__ = "tests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    passing_score: Mapped[float] = mapped_column(Float, default=70.0, nullable=False)
    max_attempts: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timer_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    deadline: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="test")
    questions: Mapped[List["Question"]] = relationship(
        "Question", 
        back_populates="test", 
        cascade="all, delete-orphan",
        order_by="Question.order"
    )
    results: Mapped[List["TestResult"]] = relationship(
        "TestResult", 
        back_populates="test", 
        cascade="all, delete-orphan"
    )

class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    test_id: Mapped[int] = mapped_column(ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    order: Mapped[int] = mapped_column(default=0, nullable=False)
    qtype: Mapped[str] = mapped_column(String(50), default="multiple_choice", nullable=False)

    test: Mapped["Test"] = relationship("Test", back_populates="questions")
    answers: Mapped[List["Answer"]] = relationship(
        "Answer", 
        back_populates="question", 
        cascade="all, delete-orphan"
    )

class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    match_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    tolerance: Mapped[float | None] = mapped_column(Float, nullable=True)

    question: Mapped["Question"] = relationship("Question", back_populates="answers")

class TestResult(Base, TimestampMixin):
    __tablename__ = "test_results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    test_id: Mapped[int] = mapped_column(ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    started_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_graded: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    test: Mapped["Test"] = relationship("Test", back_populates="results")
    student: Mapped["User"] = relationship("User", back_populates="test_results")
    student_answers: Mapped[List["StudentAnswer"]] = relationship(
        "StudentAnswer",
        back_populates="test_result",
        cascade="all, delete-orphan"
    )

class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    test_result_id: Mapped[int] = mapped_column(ForeignKey("test_results.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    selected_answer_id: Mapped[int | None] = mapped_column(ForeignKey("answers.id", ondelete="SET NULL"), nullable=True)
    selected_answer_ids: Mapped[str | None] = mapped_column(Text, nullable=True)
    text_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    matching_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    test_result: Mapped["TestResult"] = relationship("TestResult", back_populates="student_answers")
    question: Mapped["Question"] = relationship("Question")
