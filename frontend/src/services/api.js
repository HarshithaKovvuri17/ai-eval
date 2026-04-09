import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach access token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = localStorage.getItem('refreshToken');
        if (!refresh) throw new Error('no refresh token');
        const { data } = await axios.post(
          '/auth/refresh',
          { refreshToken: refresh }
        );
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        orig.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(orig);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       d => api.post('/auth/register', d),
  verifyOtp:      d => api.post('/auth/verify-otp', d),
  resendOtp:      d => api.post('/auth/resend-otp', d),
  login:          d => api.post('/auth/login', d),
  google:         d => api.post('/auth/google', d),
  forgotPassword: d => api.post('/auth/forgot-password', d),
  resetPassword:  (token, d) => api.post(`/auth/reset-password/${token}`, d),
  me:             () => api.get('/auth/me'),
  logout:         () => api.post('/auth/logout'),
};

// ── Courses ───────────────────────────────────────────────────────────────────
export const courseAPI = {
  getAll:           () => api.get('/courses'),
  getOne:           id => api.get(`/courses/${id}`),
  getQuestions:     (id, lvl) => api.get(`/courses/${id}/questions/${lvl}`),
};

// ── Test ──────────────────────────────────────────────────────────────────────
export const testAPI = {
  submit:    d => api.post('/test/submit', d),
  progress:  id => api.get(`/test/progress/${id}`),
  history:   () => api.get('/test/history'),
  restart:   id => api.post(`/test/restart/${id}`),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  stats:          () => api.get('/admin/stats'),
  users:          () => api.get('/admin/users'),
  courses:        () => api.get('/admin/courses'),
  course:         id => api.get(`/admin/courses/${id}`),
  createCourse:   d  => api.post('/admin/courses', d),
  updateCourse:   (id, d) => api.put(`/admin/courses/${id}`, d),
  deleteCourse:   id => api.delete(`/admin/courses/${id}`),
  addQuestion:    (id, d) => api.post(`/admin/courses/${id}/questions`, d),
  updateQuestion: (cId, qId, d) => api.put(`/admin/courses/${cId}/questions/${qId}`, d),
  deleteQuestion:    (cId, qId) => api.delete(`/admin/courses/${cId}/questions/${qId}`),
  generateQuestions: d => api.post('/admin/generate-questions', d),
  aiStatus:          () => api.get('/admin/ai-status'),
};

// ── Certificates ──────────────────────────────────────────────────────────────
export const certAPI = {
  my:       () => api.get('/certificate/my'),
  download: id => `/api/certificate/download/${id}`,
};
