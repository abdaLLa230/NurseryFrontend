import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const Employees = lazy(() => import('./pages/Employees'));
const Fees = lazy(() => import('./pages/Fees'));
const Salaries = lazy(() => import('./pages/Salaries'));
const Supplies = lazy(() => import('./pages/Supplies'));
const Classes = lazy(() => import('./pages/Classes'));
const Reports = lazy(() => import('./pages/Reports'));
const Register = lazy(() => import('./pages/Register')); // Hidden admin page

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
);

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter future={routerFutureFlags}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              {/* Hidden admin route - abdallah */}
              <Route path="/abdallah" element={<Register />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="students" element={<Students />} />
                <Route path="employees" element={<Employees />} />
                <Route path="fees" element={<Fees />} />
                <Route path="salaries" element={<Salaries />} />
                <Route path="supplies" element={<Supplies />} />
                <Route path="classes" element={<Classes />} />
                <Route path="reports" element={<Reports />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
