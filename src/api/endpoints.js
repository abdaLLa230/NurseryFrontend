import api from './index';

// ============== AUTH API ==============
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ============== DASHBOARD API ==============
export const dashboardAPI = {
  getDashboard: (month, year) => api.get('/reports/dashboard', { params: { month, year } }),
  getStudentCounts: () => api.get('/reports/student-counts'),
  getProfitSummary: () => api.get('/reports/profit-summary'),
  getProfitTrend: (params) => api.get('/reports/profit-trend', { params }),
  getMonthlyProfit: (month, year) => api.get('/reports/monthly-profit', { params: { month, year } }),
  calculateProfit: (month, year) => api.post('/reports/calculate-profit', null, { params: { month, year } }),
};

// ============== STUDENTS API ==============
export const studentsAPI = {
  getAll: () => api.get('/children'),
  getById: (id) => api.get(`/children/${id}`),
  getNursery: () => api.get('/children/nursery'),
  getCourse: () => api.get('/children/course'),
  create: (data) => api.post('/children', data),
  update: (id, data) => api.put(`/children/${id}`, data),
  delete: (id) => api.delete(`/children/${id}`),
  getUnpaidNursery: (month, year) => api.get('/reports/nursery-unpaid', { params: { month, year } }),
  getUnpaidCourse: (month, year) => api.get('/reports/course-unpaid', { params: { month, year } }),
};

// ============== EMPLOYEES API ==============
export const employeesAPI = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  getSalaryStatus: () => api.get('/employees/salary-status'),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

// ============== FEES API ==============
export const feesAPI = {
  getAll: () => api.get('/fees'),
  getById: (id) => api.get(`/fees/${id}`),
  getUnpaid: (month, year) => api.get('/fees/unpaid', { params: { month, year } }),
  create: (data) => api.post('/fees', data),
  update: (id, data) => api.put(`/fees/${id}`, data),
  delete: (id) => api.delete(`/fees/${id}`),
  pay: (data) => api.post('/fees/pay', data),
};

// ============== SALARIES API ==============
export const salariesAPI = {
  getAll: () => api.get('/salaries'),
  getById: (id) => api.get(`/salaries/${id}`),
  getUnpaid: (month, year) => api.get('/salaries/unpaid', { params: { month, year } }),
  create: (data) => api.post('/salaries', data),
  update: (id, data) => api.put(`/salaries/${id}`, data),
  delete: (id) => api.delete(`/salaries/${id}`),
  pay: (data) => api.post('/salaries/pay', data),
};

// ============== SUPPLIES API ==============
export const suppliesAPI = {
  getAll: () => api.get('/supplies'),
  getById: (id) => api.get(`/supplies/${id}`),
  getMonthly: (month, year) => api.get('/supplies/monthly', { params: { month, year } }),
  create: (data) => api.post('/supplies', data),
  update: (id, data) => api.put(`/supplies/${id}`, data),
  delete: (id) => api.delete(`/supplies/${id}`),
};

// ============== CLASSES API ==============
export const classesAPI = {
  getAll: () => api.get('/classes'),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
};

// ============== REPORTS API ==============
export const reportsAPI = {
  getDashboard: (month, year) => api.get('/reports/dashboard', { params: { month, year } }),
  getStudentCounts: () => api.get('/reports/student-counts'),
  getProfitSummary: () => api.get('/reports/profit-summary'),
  getProfitTrend: (params) => api.get('/reports/profit-trend', { params }),
  getSuppliesMonthly: (month, year) => api.get('/supplies/monthly', { params: { month, year } }),
};
