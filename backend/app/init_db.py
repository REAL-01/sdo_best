import asyncio
import sys
from sqlalchemy import select
from app.core.database import engine, SessionLocal
from app.models.base import Base
import app.models
from app.models.user import User, UserRole, Enrollment
from app.models.course import Course, Module, Lesson
from app.models.test import Test, Question, Answer
from app.models.resource import Resource
from app.core.security import get_password_hash

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        admin_pwd = get_password_hash("adminpassword")
        db_admin = User(
            email="admin@admin.com",
            hashed_password=admin_pwd,
            first_name="DRACHOFF",
            last_name="Администратор",
            role=UserRole.ADMIN
        )
        db.add(db_admin)
        
        teacher_pwd = get_password_hash("teacherpassword")
        db_teacher = User(
            email="teacher@example.com",
            hashed_password=teacher_pwd,
            first_name="DRACHOFF",
            last_name="Преподаватель",
            role=UserRole.TEACHER
        )
        db.add(db_teacher)
        
        student_pwd = get_password_hash("studentpassword")
        db_student = User(
            email="student@example.com",
            hashed_password=student_pwd,
            first_name="Иван",
            last_name="Иванов",
            role=UserRole.STUDENT
        )
        db.add(db_student)
        
        await db.flush()
        
        course1 = Course(
            title="Разработка веб-приложений на FastAPI",
            description="Изучение современного асинхронного Python-фреймворка FastAPI с нуля. Мы разберем маршрутизацию, внедрение зависимостей, интеграцию с БД и аутентификацию.",
            teacher_id=db_teacher.id
        )
        db.add(course1)
        
        course2 = Course(
            title="Основы библиотеки React.js",
            description="Базовый курс по React для разработки современных интерактивных веб-интерфейсов. Компоненты, состояния, хуки и рендеринг списков.",
            teacher_id=db_teacher.id
        )
        db.add(course2)
        
        await db.flush()
        
        enroll = Enrollment(
            student_id=db_student.id,
            course_id=course1.id
        )
        db.add(enroll)
        
        mod1 = Module(
            course_id=course1.id,
            title="Введение в FastAPI",
            description="Основы асинхронного веб-программирования и первый запуск приложения.",
            order=1
        )
        db.add(mod1)
        
        mod2 = Module(
            course_id=course2.id,
            title="Компоненты и состояния",
            description="Изучение функциональных компонентов и хука useState.",
            order=1
        )
        db.add(mod2)
        
        await db.flush()
        
        lesson1 = Lesson(
            module_id=mod1.id,
            title="Установка и первый Hello World",
            content="FastAPI — это современный, быстрый (высокопроизводительный) веб-фреймворк для создания API с помощью Python. В этом уроке мы научимся настраивать виртуальное окружение и запускать базовый сервер. Для этого создадим файл main.py и пропишем в нем простейший декоратор @app.get('/').",
            video_url="https://rutube.ru/play/embed/0a5ce52627e7f6e0b3687352345598ba",
            order=1
        )
        db.add(lesson1)
        
        lesson2 = Lesson(
            module_id=mod2.id,
            title="Состояние компонента (useState)",
            content="Состояние (state) позволяет компонентам React отслеживать изменяющиеся данные. В этом уроке мы разберем использование хука useState на примере счетчика.",
            video_url="https://rutube.ru/play/embed/0a5ce52627e7f6e0b3687352345598ba",
            order=1
        )
        db.add(lesson2)
        
        await db.flush()
        
        test1 = Test(
            lesson_id=lesson1.id,
            title="Проверочный тест по основам FastAPI",
            description="Пройдите этот тест, чтобы закрепить изученный материал по установке и возможностям FastAPI.",
            passing_score=70.0,
            max_attempts=3,
            timer_minutes=15
        )
        db.add(test1)
        
        await db.flush()
        
        q1 = Question(
            test_id=test1.id,
            text="Что из перечисленного является ключевым преимуществом FastAPI?",
            order=1,
            qtype="multiple_choice"
        )
        db.add(q1)
        
        q2 = Question(
            test_id=test1.id,
            text="FastAPI работает быстрее, чем традиционные синхронные фреймворки вроде Flask.",
            order=2,
            qtype="true_false"
        )
        db.add(q2)
        
        q3 = Question(
            test_id=test1.id,
            text="Какая библиотека валидации данных используется в FastAPI?",
            order=3,
            qtype="short_answer"
        )
        db.add(q3)
        
        q4 = Question(
            test_id=test1.id,
            text="Какую версию HTTP-статуса успешного выполнения запроса возвращает сервер по умолчанию?",
            order=4,
            qtype="numerical"
        )
        db.add(q4)
        
        q5 = Question(
            test_id=test1.id,
            text="Сопоставьте библиотеки с их основным назначением.",
            order=5,
            qtype="matching"
        )
        db.add(q5)
        
        q6 = Question(
            test_id=test1.id,
            text="Опишите своими словами преимущества использования асинхронности в высоконагруженных веб-сервисах.",
            order=6,
            qtype="essay"
        )
        db.add(q6)
        
        await db.flush()
        
        ans1_1 = Answer(question_id=q1.id, text="Асинхронность из коробки (async/await)", is_correct=True)
        ans1_2 = Answer(question_id=q1.id, text="Автогенерация OpenAPI-документации", is_correct=True)
        ans1_3 = Answer(question_id=q1.id, text="Отсутствие типизации переменных", is_correct=False)
        db.add(ans1_1)
        db.add(ans1_2)
        db.add(ans1_3)
        
        ans2_1 = Answer(question_id=q2.id, text="Верно", is_correct=True)
        ans2_2 = Answer(question_id=q2.id, text="Неверно", is_correct=False)
        db.add(ans2_1)
        db.add(ans2_2)
        
        ans3_1 = Answer(question_id=q3.id, text="Pydantic", is_correct=True)
        db.add(ans3_1)
        
        ans4_1 = Answer(question_id=q4.id, text="200", is_correct=True, tolerance=0.0)
        db.add(ans4_1)
        
        ans5_1 = Answer(question_id=q5.id, text="Pydantic", is_correct=True, match_text="Валидация данных")
        ans5_2 = Answer(question_id=q5.id, text="SQLAlchemy", is_correct=True, match_text="ORM для работы с БД")
        ans5_3 = Answer(question_id=q5.id, text="Uvicorn", is_correct=True, match_text="ASGI веб-сервер")
        db.add(ans5_1)
        db.add(ans5_2)
        db.add(ans5_3)
        
        ans6_1 = Answer(question_id=q6.id, text="Эссе (ручная проверка)", is_correct=True)
        db.add(ans6_1)
        
        res1 = Resource(
            title="Официальная документация FastAPI",
            description="Руководство пользователя и примеры кода на официальном сайте фреймворка.",
            url="https://fastapi.tiangolo.com/",
            owner_id=db_teacher.id
        )
        res2 = Resource(
            title="Документация Pydantic v2",
            description="Описание моделей, валидаторов и настроек типов данных Pydantic.",
            url="https://docs.pydantic.dev/",
            owner_id=db_teacher.id
        )
        db.add(res1)
        db.add(res2)
        
        await db.commit()
        print("База данных успешно инициализирована!")

if __name__ == "__main__":
    asyncio.run(init_db())
