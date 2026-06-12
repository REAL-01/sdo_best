const API_URL = "/api/v1";

export function getToken() {
  return localStorage.getItem("lms_token");
}

export function setToken(token) {
  localStorage.setItem("lms_token", token);
}

export function removeToken() {
  localStorage.removeItem("lms_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };
  
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Произошла ошибка при запросе");
  }

  return response.json().catch(() => ({}));
}

export const auth = {
  async login(email, password) {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);
    const data = await request("/auth/login", {
      method: "POST",
      body: formData,
    });
    setToken(data.access_token);
    return data;
  },
  
  async register(email, password, firstName, lastName, role) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
      }),
    });
  },

  async me() {
    return request("/auth/me");
  },
};

export const courses = {
  async getAll() {
    return request("/courses/");
  },

  async get(id) {
    return request(`/courses/${id}`);
  },

  async create(title, description) {
    return request("/courses/", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    });
  },

  async delete(id) {
    return request(`/courses/${id}`, {
      method: "DELETE",
    });
  },

  async enroll(id, studentId) {
    return request(`/courses/${id}/enroll?student_id=${studentId}`, {
      method: "POST",
    });
  },

  async createModule(courseId, title, description, order = 0) {
    return request("/courses/modules", {
      method: "POST",
      body: JSON.stringify({
        course_id: courseId,
        title,
        description,
        order,
      }),
    });
  },

  async deleteModule(id) {
    return request(`/courses/modules/${id}`, {
      method: "DELETE",
    });
  },
};

export const lessons = {
  async get(id) {
    return request(`/lessons/${id}`);
  },

  async create(moduleId, title, content, videoUrl, order = 0) {
    return request("/lessons/", {
      method: "POST",
      body: JSON.stringify({
        module_id: moduleId,
        title,
        content,
        video_url: videoUrl,
        order,
      }),
    });
  },

  async delete(id) {
    return request(`/lessons/${id}`, {
      method: "DELETE",
    });
  },
};

export const tests = {
  async getDeadlines() {
    return request("/tests/deadlines");
  },

  async get(id) {
    return request(`/tests/${id}`);
  },

  async create(lessonId, title, description, passingScore, maxAttempts, timerMinutes, questions, deadline = null) {
    return request("/tests/", {
      method: "POST",
      body: JSON.stringify({
        lesson_id: lessonId,
        title,
        description,
        passing_score: passingScore,
        max_attempts: maxAttempts,
        timer_minutes: timerMinutes,
        deadline,
        questions,
      }),
    });
  },

  async start(id) {
    return request(`/tests/${id}/start`, {
      method: "POST",
    });
  },

  async submit(id, answers) {
    return request(`/tests/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  },

  async getResults(id) {
    return request(`/tests/${id}/results`);
  },

  async getAttemptDetails(resultId) {
    return request(`/tests/results/${resultId}`);
  },

  async gradeEssay(resultId, grades) {
    return request(`/tests/results/${resultId}/grade`, {
      method: "PUT",
      body: JSON.stringify(grades),
    });
  },

  async overrideScore(resultId, score, passed = null) {
    return request(`/tests/results/${resultId}/score`, {
      method: "PUT",
      body: JSON.stringify({ score, passed }),
    });
  },

  async deleteAttempt(resultId) {
    return request(`/tests/results/${resultId}`, {
      method: "DELETE",
    });
  },
};

export const users = {
  async getAll() {
    return request("/users/");
  },
  async update(id, data) {
    return request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  async delete(id) {
    return request(`/users/${id}`, {
      method: "DELETE",
    });
  },
};

export const resources = {
  async getAll() {
    return request("/resources/");
  },
  async create(title, description, url) {
    return request("/resources/", {
      method: "POST",
      body: JSON.stringify({ title, description, url }),
    });
  },
  async delete(id) {
    return request(`/resources/${id}`, {
      method: "DELETE",
    });
  },
};

export const profile = {
  async get() {
    return request("/profile/");
  },
};
