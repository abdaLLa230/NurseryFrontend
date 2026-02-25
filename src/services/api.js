import axios from 'axios';

// في التطوير: استخدم /api ليعمل مع Vite proxy (يتحول إلى https://localhost:7001)
// في الإنتاج: استخدم متغير البيئة أو رابط الـ API
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://localhost:7001/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Dashboard APIs
export const dashboardAPI = {
  getDashboard: (month, year) => api.get('/reports/dashboard', { params: { month, year } }),
  getStudentCounts: () => api.get('/reports/student-counts'),
  getProfitSummary: () => api.get('/reports/profit-summary'),
  getProfitTrend: (params) => api.get('/reports/profit-trend', { params }),
  calculateProfit: (month, year) => api.post('/reports/calculate-profit', null, { params: { month, year } }),
};

// Children APIs
export const childrenAPI = {
  getAll: () => api.get('/children'),
  getById: (id) => api.get(`/children/${id}`),
  getNursery: () => api.get('/children/nursery'),
  getCourse: () => api.get('/children/course'),
  create: (data) => api.post('/children', data),
  update: (id, data) => api.put(`/children/${id}`, data),
  delete: (id) => api.delete(`/children/${id}`),
};

// Employees APIs
export const employeesAPI = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  getSalaryStatus: () => api.get('/employees/salary-status'),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

// Fees APIs
export const feesAPI = {
  getAll: () => api.get('/fees'),
  getById: (id) => api.get(`/fees/${id}`),
  getUnpaid: (month, year) => api.get('/fees/unpaid', { params: { month, year } }),
  create: (data) => api.post('/fees', data),
  pay: (data) => api.post('/fees/pay', data),
  update: (id, data) => api.put(`/fees/${id}`, data),
  delete: (id) => api.delete(`/fees/${id}`),
  
  // الوظائف الجديدة
  generateInvoice: (studentId, month, year) => api.get(`/fees/invoice/${studentId}/${month}/${year}`),
  getAnnualRevenue: (year) => api.get(`/fees/annual-revenue/${year}`),
  getStudentsWhoPaid: (month, year) => api.get(`/fees/students-paid/${month}/${year}`),
};

// Salaries APIs
export const salariesAPI = {
  getAll: () => api.get('/salaries'),
  getById: (id) => api.get(`/salaries/${id}`),
  getUnpaid: (month, year) => api.get('/salaries/unpaid', { params: { month, year } }),
  create: (data) => api.post('/salaries', data),
  pay: (data) => api.post('/salaries/pay', data),
  update: (id, data) => api.put(`/salaries/${id}`, data),
  delete: (id) => api.delete(`/salaries/${id}`),
};

// Classes APIs
export const classesAPI = {
  getAll: () => api.get('/classes'),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
};

// Supplies APIs
export const suppliesAPI = {
  getAll: () => api.get('/supplies'),
  getMonthly: (month, year) => api.get('/supplies/monthly', { params: { month, year } }),
  create: (data) => api.post('/supplies', data),
  update: (id, data) => api.put(`/supplies/${id}`, data),
  delete: (id) => api.delete(`/supplies/${id}`),
};

export default api;
