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
        const w = window.open('', '_blank');
        w.document.body.innerHTML = `
          <div style="font-family:Arial;max-width:1000px;margin:40px auto;padding:30px;border:2px solid #333;direction:rtl">
            <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:20px;margin-bottom:30px">
              <div style="text-align:center;flex:1">
                <h1 style="margin:0 0 10px">حضانة الأمل</h1>
                <p style="margin:0;color:#666">تقرير الأرباح والمصروفات الشهرية - عام ${new Date().getFullYear()}</p>
              </div>
              <img src="/NurseryLogo.png" alt="حضانة الأمل" style="width:80px;height:80px;object-fit:cover;border-radius:50%;flex-shrink:0" />
            </div>
            <table style="width:100%;border-collapse:collapse;border:2px solid #333;direction:rtl">
              <thead style="background:#333;color:white">
                <tr>
                  <th style="padding:12px;text-align:center;border:1px solid #333">الشهر</th>
                  <th style="padding:12px;text-align:center;border:1px solid #333">الرسوم الشهرية</th>
                  <th style="padding:12px;text-align:center;border:1px solid #333">الرواتب الشهرية</th>
                  <th style="padding:12px;text-align:center;border:1px solid #333">المستلزمات</th>
                  <th style="padding:12px;text-align:center;border:1px solid #333">صافي الربح</th>
                </tr>
              </thead>
              <tbody>
                ${profitTrend.map((row, i) => `
                  <tr style="border-bottom:1px solid #ddd;${i % 2 === 0 ? 'background:#f9f9f9' : ''}">
                    <td style="padding:10px;border:1px solid #ddd;font-weight:bold;text-align:center">${row.monthName}</td>
                    <td style="padding:10px;border:1px solid #ddd;color:#10b981;font-weight:600;text-align:center">${row.fees?.toLocaleString()}</td>
                    <td style="padding:10px;border:1px solid #ddd;color:#f59e0b;font-weight:600;text-align:center">${row.salaries?.toLocaleString()}</td>
                    <td style="padding:10px;border:1px solid #ddd;color:#6366f1;font-weight:600;text-align:center">${row.supplies?.toLocaleString()}</td>
                    <td style="padding:10px;border:1px solid #ddd;font-weight:bold;font-size:16px;text-align:center">${row.profit?.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        setTimeout(() => w.print(), 300);
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
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.reports')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date().getFullYear()}</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                    { label: t('dashboard.totalRevenue'), val: profitSummary?.totalPaidFees?.toLocaleString() || 0, icon: DollarSign, color: 'bg-emerald-600', link: '/fees' },
                    { label: t('dashboard.monthlySalaries'), val: profitSummary?.totalPaidSalaries?.toLocaleString() || 0, icon: Wallet, color: 'bg-amber-600', link: '/salaries' },
                    { label: t('dashboard.netProfit'), val: profitSummary?.actualNetProfit?.toLocaleString() || 0, icon: TrendingUp, color: 'bg-indigo-600', link: '/reports' },
                    { label: t('dashboard.totalStudents'), val: studentCounts?.totalStudents || 0, icon: Users, color: 'bg-blue-600', link: '/students' },
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
                        <div className="h-[250px] sm:h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={profitTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#37415120" />
                                    <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
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
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={profitTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="monthName" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="fees" fill="#10b981" name={t('dashboard.monthlyFees')} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="salaries" fill="#f59e0b" name={t('dashboard.monthlySalaries')} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="supplies" fill="#6366f1" name={t('supplies.title')} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
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
                                    {[t('fees.month'), t('dashboard.monthlyFees'), t('dashboard.monthlySalaries'), t('supplies.title'), t('dashboard.netProfit')].map((h, i) => (
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
                                        <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-medium">{row.supplies?.toLocaleString()} {t('common.egp')}</td>
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
