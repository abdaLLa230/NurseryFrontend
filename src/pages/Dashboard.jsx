import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import StatsCards from '../components/StatsCards';
import { AlertTriangle, CheckCircle, RefreshCw, TrendingUp, BarChart as BarChartIcon, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [profitTrend, setProfitTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [error, setError] = useState(null);
  const [unpaidSearch, setUnpaidSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Memoize filtered students to avoid recalculation on every render
  const filteredUnpaidStudents = useMemo(() => {
    const nurseryStudents = dashboardData?.nurseryStudentsNotPaid || [];
    const courseStudents = dashboardData?.courseStudentsNotPaid || [];
    const students = [...nurseryStudents, ...courseStudents];
    
    const sortedStudents = students.sort((a, b) => 
      a.childName.localeCompare(b.childName, 'ar')
    );

    return sortedStudents.filter(s =>
      s.childName.toLowerCase().includes(unpaidSearch.toLowerCase()) ||
      (s.parentPhone && s.parentPhone.includes(unpaidSearch))
    );
  }, [dashboardData?.nurseryStudentsNotPaid, dashboardData?.courseStudentsNotPaid, unpaidSearch]);

  // Memoize filtered employees
  const filteredEmployees = useMemo(() => {
    const emps = dashboardData?.employeeSalaryStatus || [];
    return emps.filter(emp =>
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (emp.role && emp.role.toLowerCase().includes(employeeSearch.toLowerCase()))
    );
  }, [dashboardData?.employeeSalaryStatus, employeeSearch]);

  useEffect(() => {
    fetchDashboard();
    fetchProfitTrend();
  }, [selectedMonth, selectedYear]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardAPI.getDashboard(selectedMonth, selectedYear);
      setDashboardData(response.data);
    } catch (err) {
      setError(t('messages.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchProfitTrend = async () => {
    try {
      const toYear = selectedYear;
      const toMonth = selectedMonth;
      const fromYear = selectedMonth <= 6 ? selectedYear - 1 : selectedYear;
      const fromMonth = selectedMonth <= 6 ? selectedMonth + 6 : selectedMonth - 6;
      const response = await dashboardAPI.getProfitTrend({ fromYear, fromMonth, toYear, toMonth });
      const formattedData = response.data.map(item => ({
        ...item,
        monthName: t(`months.${item.profitMonth || item.ProfitMonth}`),
        fees: item.totalFees || item.TotalFees || 0,
        salaries: item.totalSalaries || item.TotalSalaries || 0,
        supplies: item.totalSupplies || item.TotalSupplies || 0,
        profit: item.netProfit || item.NetProfit || 0,
      }));
      setProfitTrend(formattedData);
    } catch (err) {
      console.error('Error fetching profit trend:', err);
    }
  };

  if (error) {
    return (
      <div className="card text-center py-12">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">{error}</p>
        <button onClick={() => { fetchDashboard(); fetchProfitTrend(); }} className="btn btn-primary">
          <RefreshCw className="w-4 h-4" />
          {t('dashboard.retry')}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="input w-28 !py-2 text-sm">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>{t(`months.${i + 1}`)}</option>
            ))}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="input w-24 !py-2 text-sm">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex items-center cursor-pointer gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-md font-semibold text-blue-900 dark:text-blue-100">
              {loading ? '...' : dashboardData?.studentCounts?.totalStudents || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={dashboardData?.studentCounts} profitData={dashboardData?.monthlyProfit} loading={loading} />



      {/* Unpaid Students & Employee Status */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
        {/* Unpaid Nursery */}
        <div className="card flex-1 min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {t('dashboard.unpaidStudentsAll')}
              </h3>
              <span className="text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">
                {(dashboardData?.nurseryStudentsNotPaid?.length || 0) + (dashboardData?.courseStudentsNotPaid?.length || 0)}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder={t('dashboard.searchByNameOrPhone')}
                value={unpaidSearch}
                onChange={(e) => setUnpaidSearch(e.target.value)}
                className="input py-1.5 px-3 text-sm w-full sm:w-48 bg-gray-50 dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
            {loading && !dashboardData ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : filteredUnpaidStudents.length === 0 ? (
              <div className="text-center py-8">
                {(dashboardData?.nurseryStudentsNotPaid?.length || 0) + (dashboardData?.courseStudentsNotPaid?.length || 0) === 0 ? (
                  <>
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.allPaid')}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
                )}
              </div>
            ) : (
              filteredUnpaidStudents.map((s) => (
                <div 
                  key={s.childID} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => navigate('/fees', { state: { searchStudent: s.childName, selectedMonth, selectedYear } })}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{s.childName}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {s.studentLevel === 'Nursery' || !s.studentLevel ? t('students.nursery') : t('students.course')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.parentPhone}</p>
                  </div>
                  <span className="pill-unpaid whitespace-nowrap">{t('dashboard.late')}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Employee Salary Status */}
        <div className="card flex-1 min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('dashboard.employeeSalaryStatus')}</h3>
              <span className="text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                {dashboardData?.employeeSalaryStatus?.length || 0}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder={t('dashboard.searchByNameOrRole')}
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="input py-1.5 px-3 text-sm w-full sm:w-48 bg-gray-50 dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
            {loading && !dashboardData ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">{t('common.noData')}</div>
            ) : (
              filteredEmployees.map((emp) => (
                <div 
                  key={emp.employeeID} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => navigate('/salaries', { state: { searchEmployee: emp.name, selectedMonth, selectedYear } })}
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{emp.name}</p>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium">
                        {emp.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">{emp.monthlySalary?.toLocaleString()} {t('common.egp')}</p>
                  </div>
                  <span className={emp.salaryStatus === 'Paid' ? 'pill-paid whitespace-nowrap' : 'pill-unpaid whitespace-nowrap'}>
                    {emp.salaryStatus === 'Paid' ? t('dashboard.paidStatus') : t('dashboard.pending')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2 mt-3 sm:mt-6 mb-3 sm:mb-6">
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChartIcon className="w-4 h-4" />
            {t('dashboard.profitTrend')}
          </h3>
          {loading && !dashboardData || profitTrend.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{t('status.loading')}</p>
              </div>
            </div>
          ) : (
            <div className="h-[250px] sm:h-[300px] w-[calc(100%+32px)] -mx-4 sm:w-full sm:mx-0 mt-4 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitTrend} margin={{ top: 5, right: 10, left: -35, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#37415120" />
                  <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 8 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="profit" fill="#4f46e5" name={t('dashboard.netProfit')} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 8, fill: '#6b7280' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {t('dashboard.feesVsSalaries')}
          </h3>
          {loading && !dashboardData || profitTrend.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{t('status.loading')}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-[220px] sm:h-[270px] w-[calc(100%+32px)] -mx-4 sm:w-full sm:mx-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitTrend} margin={{ top: 5, right: 10, left: -35, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="monthName" stroke="#9ca3af" style={{ fontSize: '9px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '9px' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="fees" fill="#10b981" name={t('dashboard.monthlyFees')} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 8, fill: '#6b7280' }} />
                    <Bar dataKey="salaries" fill="#f59e0b" name={t('dashboard.monthlySalaries')} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 8, fill: '#6b7280' }} />
                    <Bar dataKey="supplies" fill="#f97316" name={t('dashboard.monthlyExpenses')} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 8, fill: '#6b7280' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-3 flex-wrap text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-emerald-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">{t('dashboard.monthlyFees')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-amber-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">{t('dashboard.monthlySalaries')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-orange-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">{t('dashboard.monthlyExpenses')}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;