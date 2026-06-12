import { useState, useEffect } from "react";
import { 
  LogOut, User, BookOpen, GraduationCap, Plus, Trash2, 
  Check, X, ChevronRight, AlertCircle, PlayCircle, ClipboardList, BookOpenCheck,
  Clock, FileText, Users, Edit, Shield, Menu, Sun, Moon, Calendar, ChevronDown, CheckCircle2, Circle, Link
} from "lucide-react";
import * as api from "./api";

function renderVideoPlayer(url) {
  if (!url) return null;
  let embedUrl = "";
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("youtube.com/watch")) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get("v") || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1]?.split("?")[0] || "";
    }
    if (videoId) {
      embedUrl = "https://www.youtube.com/embed/" + videoId;
    }
  } else if (url.includes("rutube.ru")) {
    let videoId = "";
    if (url.includes("rutube.ru/video/")) {
      const parts = url.split("rutube.ru/video/");
      videoId = parts[1]?.split("/")[0] || "";
    } else if (url.includes("rutube.ru/play/embed/")) {
      const parts = url.split("rutube.ru/play/embed/");
      videoId = parts[1]?.split("/")[0] || "";
    }
    if (videoId) {
      embedUrl = "https://rutube.ru/play/embed/" + videoId;
    }
  }
  if (!embedUrl) {
    embedUrl = url;
  }
  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
      <iframe
        src={embedUrl}
        frameBorder="0"
        allow="clipboard-write; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      ></iframe>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(api.getToken());
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("courses");
  const [authMode, setAuthMode] = useState("login");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("student");
  
  const [coursesList, setCoursesList] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentTest, setCurrentTest] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [profileData, setProfileData] = useState(null);
  
  const [resourcesList, setResourcesList] = useState([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceDesc, setNewResourceDesc] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");

  const [usersList, setUsersList] = useState([]);
  const [showUserEditModal, setShowUserEditModal] = useState(null);
  const [editUserRole, setEditUserRole] = useState("student");
  const [editUserIsActive, setEditUserIsActive] = useState(true);

  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [testAttempts, setTestAttempts] = useState([]);
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [showEssayGradingModal, setShowEssayGradingModal] = useState(null);
  const [essayGrades, setEssayGrades] = useState({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDesc, setNewModuleDesc] = useState("");

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonContent, setNewLessonContent] = useState("");
  const [newLessonVideo, setNewLessonVideo] = useState("");

  const [showTestModal, setShowTestModal] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState("");
  const [newTestDesc, setNewTestDesc] = useState("");
  const [newTestScore, setNewTestScore] = useState(70);
  const [newTestMaxAttempts, setNewTestMaxAttempts] = useState("");
  const [newTestTimerMinutes, setNewTestTimerMinutes] = useState("");
  const [newTestDeadline, setNewTestDeadline] = useState("");
  const [deadlinesList, setDeadlinesList] = useState([]);
  const [newTestQuestions, setNewTestQuestions] = useState([
    { text: "", order: 1, qtype: "multiple_choice", answers: [{ text: "", is_correct: true, match_text: "", tolerance: "" }, { text: "", is_correct: false, match_text: "", tolerance: "" }] }
  ]);

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("lms_dark") === "true");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    localStorage.setItem("lms_dark", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 10000);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 10000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      loadDeadlines();
      if (page === "courses") loadCourses();
      if (page === "profile") loadProfile();
      if (page === "resources") loadResources();
      if (page === "users" && user.role === "admin") loadUsers();
    }
  }, [user, page]);

  useEffect(() => {
    let interval = null;
    if (isTestRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleTestSubmit(null, true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (remainingSeconds <= 0 && isTestRunning) {
      handleTestSubmit(null, true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTestRunning, remainingSeconds]);

  async function loadUser() {
    try {
      const u = await api.auth.me();
      setUser(u);
    } catch (err) {
      handleLogout();
    }
  }

  async function handleAuth(e) {
    e.preventDefault();
    setError("");
    try {
      if (authMode === "login") {
        await api.auth.login(email, password);
        setToken(api.getToken());
        setPage("courses");
      } else {
        await api.auth.register(email, password, firstName, lastName, role);
        setSuccess("Регистрация успешна! Теперь вы можете войти.");
        setAuthMode("login");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    api.removeToken();
    setToken(null);
    setUser(null);
    setPage("courses");
  }

  async function loadDeadlines() {
    try {
      const data = await api.tests.getDeadlines();
      setDeadlinesList(data);
    } catch (err) {
      console.error("Ошибка загрузки дедлайнов:", err.message);
    }
  }

  async function handleDeadlineClick(lessonId) {
    try {
      const lessonDetail = await api.lessons.get(lessonId);
      const course = coursesList.find(c => c.id === lessonDetail.module.course_id);
      if (course) {
        setCurrentCourse(course);
        const fullCourse = await api.courses.get(course.id);
        setCurrentCourse(fullCourse);
        setCurrentLesson(lessonDetail);
        setPage("course_detail");
      }
    } catch (err) {
      setError("Не удалось открыть занятие с тестом: " + err.message);
    }
  }

  async function loadCourses() {
    try {
      const list = await api.courses.getAll();
      setCoursesList(list);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadCourseDetail(courseId) {
    try {
      const detail = await api.courses.get(courseId);
      setCurrentCourse(detail);
      const initialExpanded = {};
      detail.modules?.forEach(m => {
        initialExpanded[m.id] = true;
      });
      setExpandedModules(initialExpanded);

      if (user.role === "admin" || user.role === "teacher") {
        const uList = await api.users.getAll();
        setUsersList(uList);
      }
      setPage("course_detail");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEnrollStudent(e, courseId) {
    e.preventDefault();
    if (!enrollStudentId) return;
    try {
      await api.courses.enroll(courseId, Number(enrollStudentId));
      setSuccess("Студент успешно записан на курс!");
      setEnrollStudentId("");
      loadCourseDetail(courseId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateCourse(e) {
    e.preventDefault();
    try {
      await api.courses.create(newCourseTitle, newCourseDesc);
      setSuccess("Курс успешно создан!");
      setShowCourseModal(false);
      setNewCourseTitle("");
      setNewCourseDesc("");
      loadCourses();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteCourse(courseId) {
    if (!confirm("Вы уверены, что хотите удалить этот курс?")) return;
    try {
      await api.courses.delete(courseId);
      setSuccess("Курс удален.");
      loadCourses();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateModule(e) {
    e.preventDefault();
    try {
      await api.courses.createModule(currentCourse.id, newModuleTitle, newModuleDesc);
      setSuccess("Модуль создан!");
      setShowModuleModal(false);
      setNewModuleTitle("");
      setNewModuleDesc("");
      loadCourseDetail(currentCourse.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateLesson(e, moduleId) {
    e.preventDefault();
    try {
      await api.lessons.create(moduleId, newLessonTitle, newLessonContent, newLessonVideo);
      setSuccess("Урок создан!");
      setShowLessonModal(false);
      setNewLessonTitle("");
      setNewLessonContent("");
      setNewLessonVideo("");
      loadCourseDetail(currentCourse.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadLesson(lessonId) {
    try {
      const data = await api.lessons.get(lessonId);
      setCurrentLesson(data);
      if (data.test) {
        const results = await api.tests.getResults(data.test.id);
        setTestAttempts(results);
      } else {
        setTestAttempts([]);
      }
      setPage("lesson");
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadTest(testId) {
    try {
      const data = await api.tests.get(testId);
      setCurrentTest(data);
      const results = await api.tests.getResults(testId);
      setTestAttempts(results);
      setSelectedAnswers({});
      setTestResult(null);
      setActiveAttempt(null);
      setIsTestRunning(false);
      setPage("test");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStartTest() {
    try {
      const attempt = await api.tests.start(currentTest.id);
      setActiveAttempt(attempt);
      setSelectedAnswers({});
      setTestResult(null);
      if (currentTest.timer_minutes) {
        const startedTime = new Date(attempt.started_at).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startedTime) / 1000);
        const remaining = currentTest.timer_minutes * 60 - elapsed;
        setRemainingSeconds(remaining > 0 ? remaining : 0);
        setIsTestRunning(true);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTestSubmit(e, isAutoSubmit = false) {
    if (e) e.preventDefault();
    setIsTestRunning(false);

    const answersList = currentTest.questions.map((q) => {
      const val = selectedAnswers[q.id];
      let selected_answer_id = null;
      let selected_answer_ids = null;
      let text_response = null;
      let matching_response = null;

      if (q.qtype === "multiple_choice" || q.qtype === "select_missing_words") {
        selected_answer_ids = Array.isArray(val) ? val.map(Number) : [];
      } else if (q.qtype === "true_false") {
        selected_answer_id = val ? Number(val) : null;
      } else if (q.qtype === "short_answer" || q.qtype === "numerical" || q.qtype === "essay") {
        text_response = String(val || "");
      } else if (q.qtype === "matching") {
        matching_response = val || {};
      }

      return {
        question_id: q.id,
        selected_answer_id,
        selected_answer_ids,
        text_response,
        matching_response
      };
    });

    try {
      const res = await api.tests.submit(currentTest.id, answersList);
      setTestResult(res);
      setActiveAttempt(null);
      setSuccess(isAutoSubmit ? "Время вышло! Ответы автоматически отправлены." : "Ответы успешно приняты!");
      const results = await api.tests.getResults(currentTest.id);
      setTestAttempts(results);
      loadProfile();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleVoidAttempt(resultId) {
    if (!confirm("Вы уверены, что хотите аннулировать эту попытку?")) return;
    try {
      await api.tests.deleteAttempt(resultId);
      setSuccess("Попытка аннулирована.");
      if (currentLesson && currentLesson.test) {
        const results = await api.tests.getResults(currentLesson.test.id);
        setTestAttempts(results);
      }
      loadProfile();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleOverrideScore(resultId) {
    const val = prompt("Введите новую оценку (0-100):");
    if (val === null || val === "") return;
    const score = parseFloat(val);
    if (isNaN(score) || score < 0 || score > 100) {
      alert("Некорректная оценка");
      return;
    }
    try {
      await api.tests.overrideScore(resultId, score);
      setSuccess("Оценка обновлена!");
      if (currentLesson && currentLesson.test) {
        const results = await api.tests.getResults(currentLesson.test.id);
        setTestAttempts(results);
      }
      loadProfile();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleOpenEssayGrading(result) {
    try {
      const details = await api.tests.getAttemptDetails(result.id);
      setShowEssayGradingModal(details);
      const grades = {};
      details.student_answers.forEach((sa) => {
        grades[sa.question_id] = sa.score;
      });
      setEssayGrades(grades);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveEssayGrades(e) {
    e.preventDefault();
    try {
      const gradesPayload = Object.entries(essayGrades).map(([qId, score]) => ({
        question_id: parseInt(qId),
        score: parseFloat(score)
      }));
      await api.tests.gradeEssay(showEssayGradingModal.id, gradesPayload);
      setSuccess("Результат проверки эссе сохранен!");
      setShowEssayGradingModal(null);
      if (currentLesson && currentLesson.test) {
        const results = await api.tests.getResults(currentLesson.test.id);
        setTestAttempts(results);
      }
      loadProfile();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateTest(e) {
    e.preventDefault();
    const payloadQuestions = newTestQuestions.map((q) => {
      const answers = q.answers.map((a) => ({
        text: a.text,
        is_correct: a.is_correct,
        match_text: q.qtype === "matching" ? a.match_text : null,
        tolerance: q.qtype === "numerical" && a.tolerance ? parseFloat(a.tolerance) : null
      }));
      return {
        text: q.text,
        order: q.order,
        qtype: q.qtype,
        answers
      };
    });

    try {
      await api.tests.create(
        currentLesson.id,
        newTestTitle,
        newTestDesc,
        parseFloat(newTestScore),
        newTestMaxAttempts ? parseInt(newTestMaxAttempts) : null,
        newTestTimerMinutes ? parseInt(newTestTimerMinutes) : null,
        payloadQuestions,
        newTestDeadline ? new Date(newTestDeadline).toISOString() : null
      );
      setSuccess("Тест успешно создан!");
      setShowTestModal(false);
      setNewTestDeadline("");
      loadLesson(currentLesson.id);
      loadDeadlines();
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadResources() {
    try {
      const data = await api.resources.getAll();
      setResourcesList(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateResource(e) {
    e.preventDefault();
    try {
      await api.resources.create(newResourceTitle, newResourceDesc, newResourceUrl);
      setSuccess("Ресурс успешно добавлен!");
      setShowResourceModal(false);
      setNewResourceTitle("");
      setNewResourceDesc("");
      setNewResourceUrl("");
      loadResources();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteResource(id) {
    if (!confirm("Удалить этот ресурс?")) return;
    try {
      await api.resources.delete(id);
      setSuccess("Ресурс удален.");
      loadResources();
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadUsers() {
    try {
      const data = await api.users.getAll();
      setUsersList(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    try {
      await api.users.update(showUserEditModal.id, {
        role: editUserRole,
        is_active: editUserIsActive
      });
      setSuccess("Данные пользователя обновлены!");
      setShowUserEditModal(null);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteUser(id) {
    if (!confirm("Вы действительно хотите удалить этого пользователя?")) return;
    try {
      await api.users.delete(id);
      setSuccess("Пользователь удален.");
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadProfile() {
    try {
      const data = await api.profile.get();
      setProfileData(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function getLessonStatus(lessonId) {
    if (!profileData || !profileData.test_results) return "not_started";
    const lesson = currentCourse?.modules?.flatMap(m => m.lessons || []).find(l => l.id === lessonId);
    if (!lesson || !lesson.test) return "not_started";
    
    const results = profileData.test_results.filter(r => r.test_id === lesson.test.id);
    if (results.length === 0) return "not_started";
    const passed = results.some(r => r.passed);
    return passed ? "completed" : "in_progress";
  }

  function toggleModuleExpanded(moduleId) {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  }

  if (!token || !user) {
    return (
      <div className={darkMode ? "dark min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100" : "min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-900"}>
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
              <GraduationCap className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center mb-2 tracking-tight">
            {authMode === "login" ? "Вход в систему" : "Регистрация аккаунта"}
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 text-xs mb-6">
            {authMode === "login" ? "Введите ваши учетные данные" : "Создайте новый профиль СДО"}
          </p>

          {error && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-2 text-xs">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === "register" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Имя</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Фамилия</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
              {authMode === "register" && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Не менее 8 символов, заглавная и строчная буквы, цифра и спецсимвол.
                </p>
              )}
            </div>

            {authMode === "register" && (
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-2">Роль</label>
                <div className="grid grid-cols-3 gap-2">
                  {["student", "teacher", "admin"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-1.5 rounded border text-[11px] font-medium transition ${
                        role === r 
                          ? "bg-blue-50 dark:bg-blue-950/35 border-blue-500 text-blue-600 dark:text-blue-400 font-bold" 
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {r === "student" ? "Студент" : r === "teacher" ? "Преподаватель" : "Админ"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-md font-semibold text-xs transition">
              {authMode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs">
            <span className="text-slate-400 dark:text-slate-500">
              {authMode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            </span>
            <button
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setError("");
                setSuccess("");
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              {authMode === "login" ? "Создать" : "Войти"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? "dark min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" : "min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans"}>
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage("courses")}>
            <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-base tracking-tight text-slate-800 dark:text-white">
              LightLMS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-700 dark:text-white">
                {user.first_name || ""} {user.last_name || ""}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                {user.role === "student" ? "Студент" : user.role === "teacher" ? "Преподаватель" : "Админ"}
              </span>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-red-500/20 rounded transition">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`${sidebarCollapsed ? "w-16" : "w-64"} sidebar-bg border-r border-slate-900 text-slate-300 flex flex-col transition-all duration-200 shrink-0`}>
          <div className="flex-1 py-4 overflow-y-auto custom-scrollbar">
            <div className="px-3 mb-4 space-y-1">
              <button 
                onClick={() => {
                  setPage("courses");
                  setCurrentCourse(null);
                  setCurrentLesson(null);
                }} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition ${page === "courses" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-300"}`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Курсы</span>}
              </button>
              <button 
                onClick={() => setPage("resources")} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition ${page === "resources" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-300"}`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Ресурсы</span>}
              </button>
              {user.role === "admin" && (
                <button 
                  onClick={() => setPage("users")} 
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition ${page === "users" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-300"}`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Пользователи</span>}
                </button>
              )}
              {user.role === "student" && (
                <button 
                  onClick={() => setPage("profile")} 
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition ${page === "profile" ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-300"}`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Личный кабинет</span>}
                </button>
              )}
            </div>

            {!sidebarCollapsed && currentCourse && (
              <div className="border-t border-slate-800 pt-4 px-4 space-y-3">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <span>Структура курса</span>
                </div>
                <div className="font-semibold text-xs text-white truncate mb-2">{currentCourse.title}</div>
                <div className="space-y-3 pl-1">
                  {currentCourse.modules?.map((module) => (
                    <div key={module.id} className="space-y-1">
                      <button 
                        onClick={() => toggleModuleExpanded(module.id)}
                        className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-white transition"
                      >
                        <span className="truncate">{module.title}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedModules[module.id] ? "" : "transform -rotate-90"}`} />
                      </button>
                      
                      {expandedModules[module.id] && (
                        <div className="space-y-1.5 pl-2 pt-1 border-l border-slate-800">
                          {module.lessons?.map((lesson) => {
                            const status = getLessonStatus(lesson.id);
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => loadLesson(lesson.id)}
                                className={`w-full flex items-center gap-2 text-left text-[11px] py-1 px-1.5 rounded transition ${currentLesson?.id === lesson.id ? "bg-slate-800 text-white font-medium" : "text-slate-400 hover:text-slate-200"}`}
                              >
                                {status === "completed" ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                ) : status === "in_progress" ? (
                                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                ) : (
                                  <Circle className="w-3 h-3 text-slate-600 shrink-0" />
                                )}
                                <span className="truncate">{lesson.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="p-5 border-t border-slate-800/60 bg-slate-950/25 text-[10px] text-slate-400 leading-normal shrink-0">
              <div className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[8px] mb-1">Разработка:</div>
              <div className="text-slate-200 font-semibold text-xs">Драчев Никита Сергеевич</div>
              <div className="mt-1 text-[9px] text-slate-400">Студент 2 курса ЮРГПУ(НПИ)</div>
              <div className="text-[9px] text-slate-400">Группа 100502-УБТа-о24</div>
            </div>
          )}
        </aside>

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-grow overflow-y-auto custom-scrollbar p-6">
            {page === "courses" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Каталог курсов</h1>
                    <p className="text-xs text-slate-400 mt-1">Список доступных направлений и курсов обучения</p>
                  </div>
                  {(user.role === "teacher" || user.role === "admin") && (
                    <button onClick={() => setShowCourseModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white rounded transition">
                      <Plus className="w-3.5 h-3.5" /> Создать курс
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {coursesList.map((course) => (
                    <div key={course.id} className="card-bg rounded-lg p-5 flex flex-col transition hover:shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        {(user.role === "admin" || (user.role === "teacher" && course.teacher_id === user.id)) && (
                          <button onClick={() => handleDeleteCourse(course.id)} className="p-1 text-slate-400 hover:text-red-500 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 line-clamp-1">{course.title}</h3>
                      <p className="text-slate-400 text-xs line-clamp-3 mb-6 flex-1">{course.description || "Описание отсутствует"}</p>
                      
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button onClick={() => loadCourseDetail(course.id)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                          Подробнее <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {page === "course_detail" && currentCourse && (
              <div>
                <div className="mb-6">
                  <button onClick={() => setPage("courses")} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white mb-4">
                    &larr; Назад к каталогу
                  </button>
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{currentCourse.title}</h1>
                      <p className="text-xs text-slate-400 mt-2 max-w-3xl">{currentCourse.description || "Без описания"}</p>
                    </div>
                    {(user.role === "admin" || (user.role === "teacher" && currentCourse.teacher_id === user.id)) && (
                      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <form onSubmit={(e) => handleEnrollStudent(e, currentCourse.id)} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded">
                          <select 
                            required 
                            value={enrollStudentId} 
                            onChange={(e) => setEnrollStudentId(e.target.value)}
                            className="bg-transparent border-0 text-slate-600 dark:text-slate-300 text-xs px-2 focus:outline-none max-w-[180px] dark:bg-slate-900"
                          >
                            <option value="" disabled>Записать студента...</option>
                            {usersList.filter(u => u.role === "student").map(u => (
                              <option key={u.id} value={u.id}>
                                {u.first_name} {u.last_name} ({u.email})
                              </option>
                            ))}
                          </select>
                          <button type="submit" className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold text-white">
                            Записать
                          </button>
                        </form>
                        <button onClick={() => setShowModuleModal(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold text-white">
                          <Plus className="w-3.5 h-3.5" /> Создать модуль
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {currentCourse.modules?.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <p className="text-slate-400 text-xs">Модулей еще нет.</p>
                    </div>
                  ) : (
                    currentCourse.modules?.map((module) => (
                      <div key={module.id} className="card-bg rounded-lg p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{module.title}</h3>
                            <p className="text-slate-400 text-[11px] mt-1">{module.description}</p>
                          </div>
                          {(user.role === "admin" || (user.role === "teacher" && currentCourse.teacher_id === user.id)) && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setShowLessonModal(module.id);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                              >
                                <Plus className="w-3 h-3" /> Урок
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm("Удалить модуль?")) {
                                    await api.courses.deleteModule(module.id);
                                    loadCourseDetail(currentCourse.id);
                                  }
                                }}
                                className="p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-500 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 pl-4 border-l border-slate-200 dark:border-slate-800">
                          {module.lessons?.length === 0 ? (
                            <p className="text-slate-400 text-[11px] p-2">Уроки не добавлены.</p>
                          ) : (
                            module.lessons?.map((lesson) => {
                              const status = getLessonStatus(lesson.id);
                              return (
                                <div key={lesson.id} onClick={() => loadLesson(lesson.id)} className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded cursor-pointer transition">
                                  <div className="flex items-center gap-2">
                                    {lesson.video_url ? (
                                      <PlayCircle className="text-blue-500 w-4 h-4" />
                                    ) : (
                                      <FileText className="text-slate-400 w-4 h-4" />
                                    )}
                                    <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                      status === "completed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                      status === "in_progress" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                      "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                                    }`}>
                                      {status === "completed" ? "Выполнено" : status === "in_progress" ? "В процессе" : "Не начато"}
                                    </span>
                                    <ChevronRight className="text-slate-400 w-3.5 h-3.5" />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {page === "lesson" && currentLesson && (
              <div>
                <div className="mb-6">
                  <button onClick={() => loadCourseDetail(currentLesson.module?.course_id)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white mb-4">
                    &larr; Назад к структуре курса
                  </button>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{currentLesson.title}</h1>
                  <p className="text-xs text-slate-400">
                    Модуль: {currentLesson.module?.title || ""} | Курс: {currentLesson.module?.course?.title || ""}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {currentLesson.video_url && renderVideoPlayer(currentLesson.video_url)}

                    <div className="card-bg rounded-lg p-5">
                      <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">Материал урока</h3>
                      <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {currentLesson.content || "Урок не содержит текстового материала."}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="card-bg rounded-lg p-5">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Проверочный тест</h3>
                      
                      {currentLesson.test ? (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-400">{currentLesson.test.description || "Сдайте этот тест, чтобы проверить знания по теме."}</p>
                          <div className="flex flex-col gap-1.5 text-xs text-slate-400 border-y border-slate-100 dark:border-slate-800 py-3">
                            <div className="flex justify-between">
                              <span>Проходной порог:</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">{currentLesson.test.passing_score}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Лимит попыток:</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {currentLesson.test.max_attempts ? currentLesson.test.max_attempts : "Без ограничений"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Лимит времени:</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {currentLesson.test.timer_minutes ? `${currentLesson.test.timer_minutes} мин` : "Без таймера"}
                              </span>
                            </div>
                            {currentLesson.test.deadline && (
                              <div className="flex justify-between">
                                <span>Срок выполнения:</span>
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  {new Date(currentLesson.test.deadline).toLocaleString("ru-RU", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                          <button onClick={() => loadTest(currentLesson.test.id)} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-2 transition">
                            <BookOpenCheck className="w-3.5 h-3.5" /> Начать тестирование
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-400">Для этого урока тест не создан.</p>
                          {(user.role === "admin" || (user.role === "teacher" && currentLesson.module?.course?.teacher_id === user.id)) && (
                            <button 
                              onClick={() => {
                                setNewTestTitle("");
                                setNewTestDesc("");
                                setNewTestScore(70);
                                setNewTestMaxAttempts("");
                                setNewTestTimerMinutes("");
                                setNewTestDeadline("");
                                setNewTestQuestions([
                                  { text: "", order: 1, qtype: "multiple_choice", answers: [{ text: "", is_correct: true, match_text: "", tolerance: "" }, { text: "", is_correct: false, match_text: "", tolerance: "" }] }
                                ]);
                                setShowTestModal(true);
                              }} 
                              className="w-full py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-blue-600 dark:text-blue-400 font-semibold rounded text-xs flex items-center justify-center gap-1.5 transition"
                            >
                              <Plus className="w-3.5 h-3.5" /> Создать тест
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {(user.role === "admin" || (user.role === "teacher" && currentLesson.module?.course?.teacher_id === user.id)) && currentLesson.test && (
                      <div className="card-bg rounded-lg p-5">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Результаты студентов</h3>
                        {testAttempts.length === 0 ? (
                          <p className="text-xs text-slate-450">Попыток прохождения еще не было.</p>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                            {testAttempts.map((res) => (
                              <div key={res.id} className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded space-y-2 text-xs">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                      {res.student?.first_name || ""} {res.student?.last_name || "Студент"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">{res.student?.email}</span>
                                  </div>
                                  <span className={`font-bold ${res.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-650"}`}>
                                    {res.score}%
                                  </span>
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                  <span>{!res.is_graded ? "На проверке" : res.passed ? "Сдано" : "Не сдал"}</span>
                                  <span>{new Date(res.created_at).toLocaleDateString()}</span>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                  {!res.is_graded && (
                                    <button onClick={() => handleOpenEssayGrading(res)} className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded text-[10px] font-semibold transition">
                                      Оценить
                                    </button>
                                  )}
                                  <button onClick={() => handleOverrideScore(res.id)} className="p-1 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-800 transition">
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => handleVoidAttempt(res.id)} className="p-1 bg-white dark:bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded border border-slate-200 dark:border-slate-800 transition">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {(user.role === "admin" || (user.role === "teacher" && currentLesson.module?.course?.teacher_id === user.id)) && (
                      <button
                        onClick={async () => {
                          if (confirm("Вы действительно хотите удалить этот урок?")) {
                            await api.lessons.delete(currentLesson.id);
                            loadCourseDetail(currentLesson.module?.course_id);
                          }
                        }}
                        className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-650 font-semibold rounded text-xs flex items-center justify-center gap-2 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Удалить урок
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {page === "test" && currentTest && (
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <button onClick={() => loadLesson(currentTest.lesson_id)} className="text-xs text-slate-400 hover:text-slate-650 dark:hover:text-white mb-4">
                    &larr; Назад к уроку
                  </button>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{currentTest.title}</h1>
                  <p className="text-xs text-slate-400">{currentTest.description}</p>
                </div>

                {!activeAttempt && !testResult ? (
                  <div className="card-bg rounded-lg p-8 text-center space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/35 text-blue-600 dark:text-blue-400 rounded-full w-fit mx-auto">
                      <ClipboardList className="w-12 h-12" />
                    </div>
                    
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white">Готовы начать тестирование?</h3>
                      <p className="text-xs text-slate-450 mt-2 max-w-md mx-auto">
                        {currentTest.timer_minutes ? `На прохождение теста отводится ${currentTest.timer_minutes} минут. ` : ""}
                        {currentTest.max_attempts ? `Доступно попыток: ${testAttempts.length} из ${currentTest.max_attempts}.` : "Количество попыток не ограничено."}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                      {currentTest.max_attempts && testAttempts.length >= currentTest.max_attempts ? (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-lg text-xs flex items-center justify-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Вы исчерпали лимит попыток для этого теста.</span>
                        </div>
                      ) : (
                        <button onClick={handleStartTest} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition">
                          Начать попытку №{testAttempts.length + 1}
                        </button>
                      )}
                    </div>
                  </div>
                ) : activeAttempt && !testResult ? (
                  <form onSubmit={handleTestSubmit} className="space-y-6">
                    {currentTest.timer_minutes && (
                      <div className="sticky top-16 z-25 flex items-center justify-between p-3.5 bg-blue-50 dark:bg-blue-950/80 border border-blue-150 dark:border-blue-900/40 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Оставшееся время</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                          {Math.floor(remainingSeconds / 60)}:
                          {String(remainingSeconds % 60).padStart(2, "0")}
                        </span>
                      </div>
                    )}

                    {currentTest.questions?.map((question, qIdx) => (
                      <div key={question.id} className="card-bg rounded-lg p-5 space-y-4">
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          Вопрос {qIdx + 1}: {question.text}
                        </p>
                        
                        <div className="space-y-2">
                          {question.qtype === "multiple_choice" && (
                            question.answers?.map((answer) => (
                              <label key={answer.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-100/55 cursor-pointer transition">
                                <input
                                  type="checkbox"
                                  name={`q_${question.id}`}
                                  checked={Array.isArray(selectedAnswers[question.id]) && selectedAnswers[question.id].includes(String(answer.id))}
                                  onChange={(e) => {
                                    const current = selectedAnswers[question.id] || [];
                                    if (e.target.checked) {
                                      setSelectedAnswers({ ...selectedAnswers, [question.id]: [...current, String(answer.id)] });
                                    } else {
                                      setSelectedAnswers({ ...selectedAnswers, [question.id]: current.filter(id => id !== String(answer.id)) });
                                    }
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 rounded border-slate-300 dark:border-slate-700 bg-transparent"
                                />
                                <span className="text-xs text-slate-600 dark:text-slate-300">{answer.text}</span>
                              </label>
                            ))
                          )}

                          {question.qtype === "true_false" && (
                            question.answers?.map((answer) => (
                              <label key={answer.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-100/55 cursor-pointer transition">
                                <input
                                  type="radio"
                                  required
                                  name={`q_${question.id}`}
                                  value={answer.id}
                                  checked={selectedAnswers[question.id] === String(answer.id)}
                                  onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [question.id]: e.target.value })}
                                  className="text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 bg-transparent"
                                />
                                <span className="text-xs text-slate-600 dark:text-slate-300">{answer.text}</span>
                              </label>
                            ))
                          )}

                          {question.qtype === "short_answer" && (
                            <input
                              type="text"
                              required
                              value={selectedAnswers[question.id] || ""}
                              onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [question.id]: e.target.value })}
                              placeholder="Введите ваш ответ..."
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                            />
                          )}

                          {question.qtype === "numerical" && (
                            <input
                              type="number"
                              step="any"
                              required
                              value={selectedAnswers[question.id] || ""}
                              onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [question.id]: e.target.value })}
                              placeholder="Введите числовой ответ..."
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                            />
                          )}

                          {question.qtype === "essay" && (
                            <textarea
                              required
                              value={selectedAnswers[question.id] || ""}
                              onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [question.id]: e.target.value })}
                              placeholder="Напишите развернутый ответ на вопрос..."
                              className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 resize-none"
                            />
                          )}

                          {question.qtype === "matching" && (
                            <div className="space-y-2">
                              {question.answers?.map((answer) => (
                                <div key={answer.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded">
                                  <span className="text-xs text-slate-650 dark:text-slate-300">{answer.text}</span>
                                  <select
                                    required
                                    value={(selectedAnswers[question.id] || {})[answer.id] || ""}
                                    onChange={(e) => {
                                      const current = selectedAnswers[question.id] || {};
                                      setSelectedAnswers({
                                        ...selectedAnswers,
                                        [question.id]: { ...current, [answer.id]: e.target.value }
                                      });
                                    }}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                                  >
                                    <option value="">Выберите соответствие...</option>
                                    {question.matching_options?.map((opt, idx) => (
                                      <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.qtype === "select_missing_words" && (
                            <div className="space-y-2">
                              <div className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded border border-slate-200 dark:border-slate-800 select-none">
                                Выберите правильные варианты ответов для заполнения пропусков в тексте.
                              </div>
                              {question.answers?.map((answer) => (
                                <label key={answer.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-100/55 cursor-pointer transition">
                                  <input
                                    type="checkbox"
                                    name={`q_${question.id}`}
                                    checked={Array.isArray(selectedAnswers[question.id]) && selectedAnswers[question.id].includes(String(answer.id))}
                                    onChange={(e) => {
                                      const current = selectedAnswers[question.id] || [];
                                      if (e.target.checked) {
                                        setSelectedAnswers({ ...selectedAnswers, [question.id]: [...current, String(answer.id)] });
                                      } else {
                                        setSelectedAnswers({ ...selectedAnswers, [question.id]: current.filter(id => id !== String(answer.id)) });
                                      }
                                    }}
                                    className="text-blue-600 focus:ring-blue-500 rounded border-slate-300 dark:border-slate-700 bg-transparent"
                                  />
                                  <span className="text-xs text-slate-600 dark:text-slate-300">{answer.text}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition">
                      Отправить ответы на проверку
                    </button>
                  </form>
                ) : (
                  <div className="card-bg rounded-lg p-8 text-center">
                    <div className="flex justify-center mb-6">
                      {testResult.passed ? (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full">
                          <Check className="w-12 h-12" />
                        </div>
                      ) : (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full">
                          <X className="w-12 h-12" />
                        </div>
                      )}
                    </div>

                    <h2 className="text-lg font-bold mb-2">
                      {!testResult.is_graded ? "Ответы сохранены" : testResult.passed ? "Тест успешно пройден!" : "Тест не пройден"}
                    </h2>
                    
                    <p className="text-slate-400 text-xs mb-6 font-medium">
                      {!testResult.is_graded 
                        ? "Ваши ответы на эссе отправлены преподавателю на ручную проверку." 
                        : `Ваш результат: ${testResult.score}% (Необходимо для прохождения: ${currentTest.passing_score}%)`}
                    </p>

                    <button onClick={() => loadLesson(currentTest.lesson_id)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition">
                      Вернуться к уроку
                    </button>
                  </div>
                )}
              </div>
            )}

            {page === "resources" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">База ресурсов</h1>
                    <p className="text-xs text-slate-400 mt-1">Дополнительные материалы, учебные пособия и внешние ссылки</p>
                  </div>
                  <button onClick={() => setShowResourceModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white rounded transition">
                    <Plus className="w-3.5 h-3.5" /> Добавить ресурс
                  </button>
                </div>

                {resourcesList.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-450 text-xs">Список ресурсов пуст.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resourcesList.map((res) => (
                      <div key={res.id} className="card-bg rounded-lg p-5 flex flex-col transition hover:shadow-md">
                        <div className="flex justify-between items-start mb-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          {(user.role === "admin" || res.owner_id === user.id) && (
                            <button onClick={() => handleDeleteResource(res.id)} className="p-1 text-slate-400 hover:text-red-500 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 line-clamp-1">{res.title}</h3>
                        <p className="text-slate-400 text-xs line-clamp-3 mb-6 flex-1">{res.description || "Без описания"}</p>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                          <a href={res.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                            Открыть ресурс <Link className="w-3 h-3" />
                          </a>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">ID: {res.owner_id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {page === "users" && user.role === "admin" && (
              <div>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Управление пользователями</h1>
                  <p className="text-xs text-slate-400 mt-1">Просмотр и изменение ролей пользователей платформы</p>
                </div>

                <div className="card-bg rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                          <th className="px-6 py-3.5">Имя / Фамилия</th>
                          <th className="px-6 py-3.5">Email</th>
                          <th className="px-6 py-3.5">Роль</th>
                          <th className="px-6 py-3.5">Статус</th>
                          <th className="px-6 py-3.5 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                        {usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition">
                            <td className="px-6 py-3.5 font-medium text-slate-800 dark:text-white">{u.first_name || "—"} {u.last_name || "—"}</td>
                            <td className="px-6 py-3.5">{u.email}</td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                u.role === "admin" ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20" : 
                                u.role === "teacher" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" : 
                                "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              }`}>
                                {u.role === "admin" ? "Админ" : u.role === "teacher" ? "Преподаватель" : "Студент"}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className={`flex items-center gap-1.5 font-medium ${u.is_active ? "text-emerald-600 dark:text-emerald-455" : "text-red-600"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                                {u.is_active ? "Активен" : "Заблокирован"}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-right space-x-2">
                              <button 
                                onClick={() => {
                                  setShowUserEditModal(u);
                                  setEditUserRole(u.role);
                                  setEditUserIsActive(u.is_active);
                                }} 
                                className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-500 hover:text-slate-700 dark:hover:text-white rounded transition inline-flex"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-500 transition inline-flex"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {page === "profile" && profileData && (
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Личный кабинет</h1>
                <p className="text-xs text-slate-400 mb-8">Управляйте вашими курсами и отслеживайте успеваемость</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="card-bg rounded-lg p-5 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Курсы</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-white">{profileData.enrollments?.length || 0}</span>
                    </div>
                  </div>

                  <div className="card-bg rounded-lg p-5 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Сдано тестов</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-white">{profileData.test_results?.length || 0}</span>
                    </div>
                  </div>

                  <div className="card-bg rounded-lg p-5 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Успешные сдачи</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-white">
                        {profileData.test_results?.filter(r => r.passed).length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 card-bg rounded-lg p-5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Мои курсы</h3>
                    {profileData.enrollments?.length === 0 ? (
                      <p className="text-slate-400 text-xs">Вы еще не записаны на курсы.</p>
                    ) : (
                      <div className="space-y-3">
                        {profileData.enrollments?.map((enroll) => (
                          <div key={enroll.id} className="p-3.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 dark:text-white">{enroll.title}</h4>
                              <span className="text-[10px] text-slate-400">Запись: {new Date(enroll.enrolled_at).toLocaleDateString()}</span>
                            </div>
                            <button onClick={() => loadCourseDetail(enroll.id)} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-750 text-white rounded text-xs font-semibold transition">
                              Открыть
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card-bg rounded-lg p-5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">История тестов</h3>
                    {profileData.test_results?.length === 0 ? (
                      <p className="text-slate-400 text-xs">Попыток тестирования не зафиксировано.</p>
                    ) : (
                      <div className="space-y-3">
                        {profileData.test_results?.map((res) => (
                          <div key={res.id} className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded flex items-center justify-between text-xs">
                            <div>
                              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Попытка #{res.id}</span>
                              <span className="text-[10px] text-slate-400">{new Date(res.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="text-right">
                              <span className={`font-bold block ${res.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"}`}>
                                {res.score}%
                              </span>
                              <span className={`text-[9px] font-bold uppercase ${res.passed ? "text-emerald-500" : "text-red-500"}`}>
                                {!res.is_graded ? "На проверке" : res.passed ? "Сдано" : "Не сдал"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>

          <aside className="w-[350px] shrink-0 border-l border-slate-200 dark:border-slate-800 hidden xl:flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
            <div className="card-bg rounded-lg p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Прогресс обучения</h3>
              {user.role === "student" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500 dark:text-slate-400">Пройдено тестов:</span>
                        <span className="text-slate-800 dark:text-white font-extrabold">
                          {profileData?.test_results?.filter(r => r.passed).length || 0}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(
                              ((profileData?.test_results?.filter(r => r.passed).length || 0) / (coursesList.length * 3 || 1)) * 100, 
                              100
                            )}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-xl transition hover:border-slate-250 dark:hover:border-slate-700">
                    <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold block">Всего курсов</span>
                      <span className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5 block">{coursesList.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-xl transition hover:border-slate-250 dark:hover:border-slate-700">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold block">Активные студенты</span>
                      <span className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5 block">
                        {usersList.filter(u => u.role === "student").length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card-bg rounded-lg p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" /> Календарь дедлайнов
              </h3>
              <div className="space-y-3 text-xs">
                {deadlinesList.length === 0 ? (
                  <span className="text-slate-450 dark:text-slate-500 text-xs italic block">Нет активных дедлайнов</span>
                ) : (
                  deadlinesList.map((dl) => {
                    const dateStr = new Date(dl.deadline).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    return (
                      <div 
                        key={dl.id} 
                        onClick={() => handleDeadlineClick(dl.lesson_id)}
                        className="flex gap-3 items-start cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/30 p-1.5 -m-1.5 rounded transition-all"
                        title="Нажмите, чтобы перейти к уроку"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block leading-tight hover:text-blue-600 dark:hover:text-blue-450">
                            {dl.title}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">{dl.course_title}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">до {dateStr}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="card-bg rounded-lg p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Последние события</h3>
              <div className="space-y-3 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Вход в систему выполнен</span>
                  <span className="text-[10px] text-slate-400">Только что</span>
                </div>
                {profileData?.test_results?.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-800 dark:text-slate-200 font-medium">Сдача теста с оценкой {profileData.test_results[0].score}%</span>
                    <span className="text-[10px] text-slate-400">Недавно</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-md relative">
            <button onClick={() => setShowCourseModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-white"><X className="w-4 h-4" /></button>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Создание курса</h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Название курса</label>
                <input
                  type="text"
                  required
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Описание</label>
                <textarea
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition">
                Создать
              </button>
            </form>
          </div>
        </div>
      )}

      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-md relative">
            <button onClick={() => setShowModuleModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-white"><X className="w-4 h-4" /></button>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Добавить модуль</h3>
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Название модуля</label>
                <input
                  type="text"
                  required
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Описание</label>
                <textarea
                  value={newModuleDesc}
                  onChange={(e) => setNewModuleDesc(e.target.value)}
                  className="w-full h-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition">
                Создать
              </button>
            </form>
          </div>
        </div>
      )}

      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-md relative">
            <button onClick={() => setShowLessonModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-white"><X className="w-4 h-4" /></button>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Создание нового урока</h3>
            <form onSubmit={(e) => handleCreateLesson(e, showLessonModal)} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Название урока</label>
                <input
                  type="text"
                  required
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Ссылка на видео (YouTube / Rutube)</label>
                <input
                  type="url"
                  value={newLessonVideo}
                  onChange={(e) => setNewLessonVideo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Текстовое содержание урока</label>
                <textarea
                  value={newLessonContent}
                  onChange={(e) => setNewLessonContent(e.target.value)}
                  className="w-full h-28 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition">
                Создать
              </button>
            </form>
          </div>
        </div>
      )}

      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-md relative my-8">
            <button onClick={() => setShowTestModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-white"><X className="w-4 h-4" /></button>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Создание теста</h3>
            
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Название теста</label>
                  <input
                    type="text"
                    required
                    value={newTestTitle}
                    onChange={(e) => setNewTestTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Порог прохождения (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newTestScore}
                    onChange={(e) => setNewTestScore(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Лимит попыток (пусто — безлимитно)</label>
                  <input
                    type="number"
                    min="1"
                    value={newTestMaxAttempts}
                    onChange={(e) => setNewTestMaxAttempts(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Таймер (в минутах)</label>
                  <input
                    type="number"
                    min="1"
                    value={newTestTimerMinutes}
                    onChange={(e) => setNewTestTimerMinutes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Срок выполнения (дедлайн)</label>
                  <input
                    type="datetime-local"
                    value={newTestDeadline}
                    onChange={(e) => setNewTestDeadline(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Описание</label>
                <input
                  type="text"
                  value={newTestDesc}
                  onChange={(e) => setNewTestDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Вопросы</span>
                  <button
                    type="button"
                    onClick={() => setNewTestQuestions([
                      ...newTestQuestions,
                      { 
                        text: "", 
                        order: newTestQuestions.length + 1, 
                        qtype: "multiple_choice",
                        answers: [{ text: "", is_correct: true, match_text: "", tolerance: "" }, { text: "", is_correct: false, match_text: "", tolerance: "" }] 
                      }
                    ])}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-450 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Добавить вопрос
                  </button>
                </div>

                {newTestQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">{qIdx + 1}.</span>
                      <input
                        type="text"
                        placeholder="Текст вопроса"
                        required
                        value={q.text}
                        onChange={(e) => {
                          const updated = [...newTestQuestions];
                          updated[qIdx].text = e.target.value;
                          setNewTestQuestions(updated);
                        }}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                      />
                      <select
                        value={q.qtype}
                        onChange={(e) => {
                          const updated = [...newTestQuestions];
                          updated[qIdx].qtype = e.target.value;
                          
                          if (e.target.value === "true_false") {
                            updated[qIdx].answers = [
                              { text: "Верно", is_correct: true, match_text: "", tolerance: "" },
                              { text: "Неверно", is_correct: false, match_text: "", tolerance: "" }
                            ];
                          } else if (e.target.value === "essay") {
                            updated[qIdx].answers = [{ text: "Эссе (ручная проверка)", is_correct: true, match_text: "", tolerance: "" }];
                          } else if (e.target.value === "short_answer" || e.target.value === "numerical") {
                            updated[qIdx].answers = [{ text: "", is_correct: true, match_text: "", tolerance: "" }];
                          } else {
                            updated[qIdx].answers = [
                              { text: "", is_correct: true, match_text: "", tolerance: "" },
                              { text: "", is_correct: false, match_text: "", tolerance: "" }
                            ];
                          }
                          setNewTestQuestions(updated);
                        }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs px-2 py-1 text-slate-700 dark:text-slate-300"
                      >
                        <option value="multiple_choice">Множественный выбор</option>
                        <option value="true_false">Верно/Неверно</option>
                        <option value="short_answer">Короткий ответ</option>
                        <option value="matching">На соответствие</option>
                        <option value="numerical">Числовой</option>
                        <option value="essay">Эссе</option>
                        <option value="select_missing_words">Выбор пропущенных слов</option>
                      </select>
                    </div>

                    {q.qtype !== "essay" && (
                      <div className="space-y-2 pl-6">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>Варианты ответов / правила оценки</span>
                          {q.qtype !== "true_false" && q.qtype !== "short_answer" && q.qtype !== "numerical" && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...newTestQuestions];
                                updated[qIdx].answers.push({ text: "", is_correct: false, match_text: "", tolerance: "" });
                                setNewTestQuestions(updated);
                              }}
                              className="text-blue-600 dark:text-blue-450 hover:underline"
                            >
                              + Вариант
                            </button>
                          )}
                        </div>

                        {q.answers.map((a, aIdx) => (
                          <div key={aIdx} className="space-y-1 bg-white dark:bg-slate-900/60 p-2.5 rounded border border-slate-200 dark:border-slate-850">
                            <div className="flex items-center gap-2">
                              {q.qtype === "multiple_choice" || q.qtype === "select_missing_words" ? (
                                <input
                                  type="checkbox"
                                  checked={a.is_correct}
                                  onChange={(e) => {
                                    const updated = [...newTestQuestions];
                                    updated[qIdx].answers[aIdx].is_correct = e.target.checked;
                                    setNewTestQuestions(updated);
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 rounded border-slate-350 bg-transparent"
                                />
                              ) : q.qtype === "true_false" ? (
                                <input
                                  type="radio"
                                  name={`q_setup_${qIdx}`}
                                  checked={a.is_correct}
                                  onChange={() => {
                                    const updated = [...newTestQuestions];
                                    updated[qIdx].answers = updated[qIdx].answers.map((ans, idx) => ({
                                      ...ans,
                                      is_correct: idx === aIdx
                                    }));
                                    setNewTestQuestions(updated);
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 border-slate-350 bg-transparent"
                                />
                              ) : null}

                              <input
                                type="text"
                                placeholder={
                                  q.qtype === "numerical" ? "Правильное число" : 
                                  q.qtype === "short_answer" ? "Правильная фраза" : 
                                  `Вариант ${aIdx + 1}`
                                }
                                required
                                value={a.text}
                                disabled={q.qtype === "true_false"}
                                onChange={(e) => {
                                  const updated = [...newTestQuestions];
                                  updated[qIdx].answers[aIdx].text = e.target.value;
                                  setNewTestQuestions(updated);
                                }}
                                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px] text-slate-800 dark:text-slate-100"
                              />

                              {q.qtype !== "true_false" && q.qtype !== "short_answer" && q.qtype !== "numerical" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...newTestQuestions];
                                    updated[qIdx].answers = updated[qIdx].answers.filter((_, idx) => idx !== aIdx);
                                    setNewTestQuestions(updated);
                                  }}
                                  className="text-red-500 hover:text-red-400 text-[10px]"
                                >
                                  Удалить
                                </button>
                              )}
                            </div>

                            {q.qtype === "matching" && (
                              <div className="pl-6 pt-1">
                                <input
                                  type="text"
                                  placeholder="Соответствующий правый элемент"
                                  required
                                  value={a.match_text || ""}
                                  onChange={(e) => {
                                    const updated = [...newTestQuestions];
                                    updated[qIdx].answers[aIdx].match_text = e.target.value;
                                    setNewTestQuestions(updated);
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[10px] text-indigo-500 dark:text-indigo-400 focus:outline-none"
                                />
                              </div>
                            )}

                            {q.qtype === "numerical" && (
                              <div className="pl-6 pt-1">
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="Допустимая погрешность (tolerance, например 0.1)"
                                  value={a.tolerance || ""}
                                  onChange={(e) => {
                                    const updated = [...newTestQuestions];
                                    updated[qIdx].answers[aIdx].tolerance = e.target.value;
                                    setNewTestQuestions(updated);
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[10px] text-slate-500 focus:outline-none"
                                />
                              </div>
                            )}

                            {q.qtype === "select_missing_words" && (
                              <div className="pl-6 pt-1">
                                <input
                                  type="text"
                                  placeholder="Индекс пропуска (например: 1)"
                                  required
                                  value={a.match_text || ""}
                                  onChange={(e) => {
                                    const updated = [...newTestQuestions];
                                    updated[qIdx].answers[aIdx].match_text = e.target.value;
                                    setNewTestQuestions(updated);
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[10px] text-indigo-500 dark:text-indigo-400 focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition">
                Создать тест
              </button>
            </form>
          </div>
        </div>
      )}

      {showResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-md relative">
            <button onClick={() => setShowResourceModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-white"><X className="w-4 h-4" /></button>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Добавление ресурса</h3>
            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Название ресурса</label>
                <input
                  type="text"
                  required
                  value={newResourceTitle}
                  onChange={(e) => setNewResourceTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">URL-ссылка</label>
                <input
                  type="url"
                  required
                  value={newResourceUrl}
                  onChange={(e) => setNewResourceUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Описание</label>
                <textarea
                  value={newResourceDesc}
                  onChange={(e) => setNewResourceDesc(e.target.value)}
                  className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs focus:outline-none resize-none"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition">
                Добавить
              </button>
            </form>
          </div>
        </div>
      )}

      {showUserEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-md relative">
            <button onClick={() => setShowUserEditModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-white"><X className="w-4 h-4" /></button>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Редактирование пользователя</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Email</label>
                <input
                  type="text"
                  disabled
                  value={showUserEditModal.email}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-2">Роль пользователя</label>
                <div className="grid grid-cols-3 gap-2">
                  {["student", "teacher", "admin"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditUserRole(r)}
                      className={`py-1.5 rounded border text-[11px] font-semibold transition ${
                        editUserRole === r 
                          ? "bg-blue-50 dark:bg-blue-950/20 border-blue-500 text-blue-600 dark:text-blue-400 font-bold" 
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-350"
                      }`}
                    >
                      {r === "student" ? "Студент" : r === "teacher" ? "Преподаватель" : "Админ"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 dark:text-slate-400 mt-2 select-none">
                  <input
                    type="checkbox"
                    checked={editUserIsActive}
                    onChange={(e) => setEditUserIsActive(e.target.checked)}
                    className="text-blue-650 focus:ring-blue-500 rounded border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                  <span>Пользователь активен (разблокирован)</span>
                </label>
              </div>

              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition">
                Сохранить изменения
              </button>
            </form>
          </div>
        </div>
      )}

      {showEssayGradingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-md relative my-8">
            <button onClick={() => setShowEssayGradingModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-white"><X className="w-4 h-4" /></button>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Оценивание эссе</h3>
            
            <form onSubmit={handleSaveEssayGrades} className="space-y-4">
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                {showEssayGradingModal.student_answers?.map((sa) => {
                  const question = showEssayGradingModal.test?.questions?.find(q => q.id === sa.question_id);
                  if (!question || question.qtype !== "essay") return null;
                  
                  return (
                    <div key={sa.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Вопрос</span>
                        <p className="text-xs text-slate-800 dark:text-white font-medium">{question.text}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Ответ студента</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                          {sa.text_response || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Оценка за вопрос (0.0 - 1.0):</span>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="1"
                          required
                          value={essayGrades[sa.question_id] !== undefined ? essayGrades[sa.question_id] : 0}
                          onChange={(e) => {
                            setEssayGrades({
                              ...essayGrades,
                              [sa.question_id]: parseFloat(e.target.value) || 0
                            });
                          }}
                          className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition">
                Сохранить результаты проверки
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
