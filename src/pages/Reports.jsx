import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { AlertCircle, RefreshCw, TrendingUp, DollarSign, Wallet, Users, Printer } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Reports = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profitSummary, setProfitSummary] = useState(null);
  const [profitTrend, setProfitTrend] = useState([]);
  const [studentCounts, setStudentCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true); setError(null);
      const [summary, trend, counts] = await Promise.all([
        dashboardAPI.getProfitSummary(),
        dashboardAPI.getProfitTrend({ fromYear: new Date().getFullYear(), fromMonth: 1, toYear: new Date().getFullYear(), toMonth: 12 }),
        dashboardAPI.getStudentCounts(),
      ]);
      setProfitSummary(summary.data);
      setStudentCounts(counts.data);
      setProfitTrend(trend.data.map(item => ({
        ...item,
        monthName: t(`months.${item.profitMonth}`),
        fees: item.totalFees,
        salaries: item.totalSalaries,
        supplies: item.totalSupplies,
        profit: item.netProfit,
      })));
    } catch { setError(t('messages.networkError')); }
    finally { setLoading(false); }
  };

  const printMonthlyBreakdown = () => {
  if (profitTrend.length === 0) return;

  const printContent = `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تقرير الأرباح السنوي ${new Date().getFullYear()}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  <style>
    @page { margin: 0; size: A4; }
    @media print {
      body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Cairo', sans-serif;
      background: #fafaf8;
      direction: rtl;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fafaf8;
    }

    /* ─── HEADER ─── */
    .header {
      background: #1c1c1e;
      padding: 28px 40px 0;
    }

    .header-line {
      height: 4px;
      background: #00b147ff;
      margin-top: 24px;
      margin-left: -40px;
      margin-right: -40px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-circle {
      width: 52px; height: 52px;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.06);
      overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .logo-circle img {
      width: 100%; height: 100%;
      object-fit: cover; border-radius: 50%;
    }

    .nursery-name {
      font-size: 25px;
      font-weight: 900;
      color: #ffffffff;
      letter-spacing: 0.5px;
    }

    .nursery-sub {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.63);
      letter-spacing: 1.5px;
      margin-top: 2px;
    }

    .report-badge {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 6px 14px;
      text-align: center;
    }

    .report-badge-label {
      font-size: 8px;
      color: rgba(255, 253, 253, 0.7);
      letter-spacing: 2px;
      display: block;
      margin-bottom: 2px;
    }

    .report-badge-year {
      font-size: 18px;
      font-weight: 900;
      color: #ffffff;
    }

    .header-meta {
      display: flex;
      gap: 24px;
    }

    .meta-item {
      font-size: 9px;
      color: rgba(255,255,255,0.3);
      letter-spacing: 1px;
    }

    .meta-item span {
      color: rgba(255,255,255,0.6);
      font-weight: 600;
      display: block;
      font-size: 11px;
      letter-spacing: 0;
    }

    /* ─── STATS ─── */
    .stats-section {
      padding: 28px 40px;
      border-bottom: 1px solid #e8e4de;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .stat-card {
      background: #f3f1ee;
      border-radius: 8px;
      padding: 14px 16px;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; right: 0;
      width: 3px;
      height: 100%;
      border-radius: 0 8px 8px 0;
    }

    .stat-card.revenue::before  { background: #01a43dff; }
    .stat-card.salaries::before { background: #ff8800ff; }
    .stat-card.expenses::before { background: #ff0000ff; }
    .stat-card.profit::before   { background: #000000ff; }

    .stat-label {
      font-size: 9px;
      color: #9a9188;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 900;
      color: #1c1c1e;
      line-height: 1;
    }

    .stat-currency {
      font-size: 9px;
      color: #b0a89e;
      margin-top: 3px;
      letter-spacing: 0.5px;
    }

    /* ─── TABLE ─── */
    .table-section {
      padding: 28px 40px 40px;
    }

    .section-label {
      font-size: 8px;
      letter-spacing: 2.5px;
      color: #c0b8ae;
      margin-bottom: 14px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead tr { background: #1c1c1e; }

    thead th {
      padding: 10px 14px;
      font-size: 9px;
      font-weight: 700;
      color: rgba(255,255,255,0.6);
      letter-spacing: 1px;
      text-align: center;
    }

    tbody tr { border-bottom: 1px solid #eeece8; }
    tbody tr:nth-child(even) { background: #f7f5f2; }

    tbody td {
      padding: 9px 14px;
      font-size: 11px;
      text-align: center;
      color: #3a3530ff;
    }

    tbody td:first-child { font-weight: 700; color: #262627ff; text-align: right; }
    tbody td:last-child  { font-weight: 900; font-size: 12px; color: #252526ff; }

    .val-revenue  { color: #15803d; font-weight: 600; }
    .val-salaries { color: #b45309; font-weight: 600; }
    .val-expenses { color: #c2410c; font-weight: 600; }
    .val-profit   { color: #1c1a1aff; font-weight: 600; }
    /* ─── FOOTER ─── */
    .footer {
      border-top: 1px solid #e8e4de;
      padding: 14px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-brand { font-size: 9px; font-weight: 700; color: #1c1c1e; letter-spacing: 0.5px; }
    .footer-date  { font-size: 8.5px; color: #b0a89e; }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-top">
      <div class="header-right">
        <div class="logo-circle">
          <img src="/NurseryLogo.png" onerror="this.style.display='none';this.parentElement.innerHTML='🌸'" />
        </div>
        <div>
          <div class="nursery-name"> حضانه الامل </div>
          <div class="nursery-sub"> نظام إدارة الحضانة </div>
        </div>
      </div>
      <div class="report-badge">
        <span class="report-badge-label">تقرير سنوي</span>
        <span class="report-badge-year">${new Date().getFullYear()}</span>
      </div>
    </div>
    <div class="header-meta">
      <div class="meta-item">نوع التقرير <span>الأرباح والمصروفات</span></div>
      <div class="meta-item">تاريخ الطباعة <span>${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
    </div>
    <div class="header-line"></div>
  </div>

  <div class="stats-section">
    <div class="stats-grid">
      <div class="stat-card revenue">
        <div class="stat-label">إجمالي الإيرادات</div>
        <div class="stat-value">${profitSummary?.totalPaidFees?.toLocaleString() || 0}</div>
        <div class="stat-currency">جنيه مصري</div>
      </div>
      <div class="stat-card salaries">
        <div class="stat-label">إجمالي الرواتب</div>
        <div class="stat-value">${profitSummary?.totalPaidSalaries?.toLocaleString() || 0}</div>
        <div class="stat-currency">جنيه مصري</div>
      </div>
      <div class="stat-card expenses">
        <div class="stat-label">إجمالي المصروفات</div>
        <div class="stat-value">${profitSummary?.totalSupplies?.toLocaleString() || 0}</div>
        <div class="stat-currency">جنيه مصري</div>
      </div>
      <div class="stat-card profit">
        <div class="stat-label">صافي الربح</div>
        <div class="stat-value">${profitSummary?.actualNetProfit?.toLocaleString() || 0}</div>
        <div class="stat-currency">جنيه مصري</div>
      </div>
    </div>
  </div>

  <div class="table-section">
    <div class="section-label">التفاصيل الشهرية</div>
    <table>
      <thead>
        <tr>
          <th style="text-align:right">الشهر</th>
          <th>الرسوم الشهرية</th>
          <th>الرواتب</th>
          <th>المصروفات</th>
          <th>صافي الربح</th>
        </tr>
      </thead>
      <tbody>
        ${profitTrend.map((row) => `
          <tr>
            <td>${row.monthName}</td>
            <td class="val-revenue">${row.fees?.toLocaleString() || 0}</td>
            <td class="val-salaries">${row.salaries?.toLocaleString() || 0}</td>
            <td class="val-expenses">${row.supplies?.toLocaleString() || 0}</td>
            <td class="val-profit">${row.profit?.toLocaleString() || 0}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span class="footer-brand">نظام إدارة الحضانة</span>
    <span class="footer-date">${new Date().toLocaleDateString('ar-EG')}</span>
  </div>

</div>
</body>
</html>`;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => {
      const w = window.open('', '_blank');
      if (w) { w.document.write(printContent); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 1000); }
    }, 100);
  } else {
    const w = window.open('', '_blank');
    if (w) { w.document.write(printContent); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 500); }
  }
};

  if (error) {
    return (<div className="card text-center py-12"><AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" /><p className="text-gray-700 dark:text-gray-300 mb-3">{error}</p><button onClick={fetchAll} className="btn btn-primary"><RefreshCw className="w-4 h-4" /> {t('dashboard.retry')}</button></div>);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{t('status.loadingReport')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.reports')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date().getFullYear()}</p>
        </div>

        {/* Total Students Card */}
        <div
          className="card-stat cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 w-auto py-4"
          onClick={() => navigate('/students')}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
              <Users className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.totalStudents')}</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{studentCounts?.totalStudents || 0}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: t('dashboard.totalRevenue'), val: profitSummary?.totalPaidFees?.toLocaleString() || 0, icon: DollarSign, color: 'bg-emerald-600', link: '/fees' },
          { label: t('dashboard.monthlySalaries'), val: profitSummary?.totalPaidSalaries?.toLocaleString() || 0, icon: Wallet, color: 'bg-amber-600', link: '/salaries' },
          { label: t('dashboard.totalExpenses'), val: profitSummary?.totalSupplies?.toLocaleString() || 0, icon: TrendingUp, color: 'bg-orange-600', link: '/supplies' },
          { label: t('dashboard.netProfit'), val: profitSummary?.actualNetProfit?.toLocaleString() || 0, icon: TrendingUp, color: 'bg-indigo-600', link: '/reports' },
        ].map((s, i) => (
          <div
            key={i}
            className="card-stat cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            onClick={() => navigate(s.link)}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}><s.icon className="w-4 h-4 text-white" /></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.val} {typeof s.val === 'number' ? '' : t('common.egp')}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.profitTrend')}</h2>
          {profitTrend.length > 0 ? (
            <div className="h-[250px] sm:h-[300px] w-[calc(100%+35px)] -mx-1 sm:w-full sm:mx-0 mt-4 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#37415120" />
                  <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', textAlign: 'right' }} />
                  <Line type="monotone" dataKey="fees" stroke="#10b981" strokeWidth={2} name={t('dashboard.monthlyFees')} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="salaries" stroke="#f59e0b" strokeWidth={2} name={t('dashboard.monthlySalaries')} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={3} name={t('dashboard.netProfit')} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (<p className="text-sm text-gray-500 text-center py-12">{t('common.noData')}</p>)}
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.feesVsSalaries')}</h2>
          {profitTrend.length > 0 ? (
           <div className="h-[250px] sm:h-[300px] w-[calc(100%+35px)] -mx-1 sm:w-full sm:mx-0 mt-4 overflow-hidden">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={profitTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="monthName" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="fees" fill="#10b981" name={t('dashboard.monthlyFees')} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 8, fill: '#6b7280' }} />
                <Bar dataKey="salaries" fill="#f59e0b" name={t('dashboard.monthlySalaries')} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 8, fill: '#6b7280' }} />
                <Bar dataKey="supplies" fill="#f97316" name={t('dashboard.monthlyExpenses')} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 8, fill: '#6b7280' }} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          ) : (<p className="text-sm text-gray-500 text-center py-12">{t('common.noData')}</p>)}
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      {profitTrend.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('dashboard.profitTrend')}</h2>
            <button onClick={printMonthlyBreakdown} className="btn btn-primary !py-2 !px-4 flex items-center gap-2">
              <Printer className="w-4 h-4" />
              {t('print.printReport')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {[t('fees.month'), t('dashboard.monthlyFees'), t('dashboard.monthlySalaries'), t('dashboard.monthlyExpenses'), t('dashboard.netProfit')].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {profitTrend.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.monthName}</td>
                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium">{row.fees?.toLocaleString()} {t('common.egp')}</td>
                    <td className="px-4 py-3 text-amber-600 dark:text-amber-400 font-medium">{row.salaries?.toLocaleString()} {t('common.egp')}</td>
                    <td className="px-4 py-3 text-orange-600 dark:text-orange-400 font-medium">{row.supplies?.toLocaleString()} {t('common.egp')}</td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{row.profit?.toLocaleString()} {t('common.egp')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
