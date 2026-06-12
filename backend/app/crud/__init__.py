from app.crud.user import get_user_by_email, create_user
from app.crud.course import (
    get_courses, get_course, create_course, update_course, delete_course,
    get_module, create_module, update_module, delete_module,
    get_lesson, create_lesson, update_lesson, delete_lesson,
    enroll_student, is_student_enrolled
)
from app.crud.test import (
    get_test, get_test_by_lesson, create_test,
    get_student_results, get_test_results_by_test, create_test_result
)
