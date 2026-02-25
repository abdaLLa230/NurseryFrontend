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
        
        // Create print content
        const printContent = `
          <!DOCTYPE html>
          <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير الأرباح السنوي ${new Date().getFullYear()}</title>
            <style>
              @page { 
                margin: 0.8cm; 
                size: A4;
              }
              @media print {
                body { 
                  margin: 0 !important; 
                  padding: 0 !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .no-print { display: none !important; }
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body { 
                font-family: Arial, sans-serif;
                padding: 15px;
              }
              .container {
                max-width: 100%;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 2px solid #333;
              }
              .header h1 {
                font-size: 26px;
                margin-bottom: 8px;
                color: #333;
              }
              .header p {
                font-size: 14px;
                color: #666;
                margin: 3px 0;
              }
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 25px;
              }
              .stat-card {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
              }
              .stat-label {
                font-size: 12px;
                color: #6b7280;
                margin-bottom: 8px;
              }
              .stat-value {
                font-size: 20px;
                font-weight: bold;
                color: #111827;
              }
              .stat-card.revenue { border-right: 3px solid #10b981; }
              .stat-card.salaries { border-right: 3px solid #f59e0b; }
              .stat-card.expenses { border-right: 3px solid #f97316; }
              .stat-card.profit { border-right: 3px solid #6366f1; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>حضانة الأمل</h1>
                <p>تقرير الأرباح والمصروفات السنوية - عام ${new Date().getFullYear()}</p>
                <p style="font-size:12px;color:#999">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              
              <div class="stats-grid">
                <div class="stat-card revenue">
                  <div class="stat-label">إجمالي الإيرادات</div>
                  <div class="stat-value">${profitSummary?.totalPaidFees?.toLocaleString() || 0} جنيه</div>
                </div>
                <div class="stat-card salaries">
                  <div class="stat-label">إجمالي الرواتب</div>
                  <div class="stat-value">${profitSummary?.totalPaidSalaries?.toLocaleString() || 0} جنيه</div>
                </div>
                <div class="stat-card expenses">
                  <div class="stat-label">إجمالي المصروفات</div>
                  <div class="stat-value">${profitSummary?.totalSupplies?.toLocaleString() || 0} جنيه</div>
                </div>
                <div class="stat-card profit">
                  <div class="stat-label">صافي الربح</div>
                  <div class="stat-value">${profitSummary?.actualNetProfit?.toLocaleString() || 0} جنيه</div>
                </div>
              </div>
              
              <table style="width:100%;border-collapse:collapse;border:2px solid #333">
                <thead style="background:#333;color:white">
                  <tr>
                    <th style="padding:12px;text-align:center;border:1px solid #333">الشهر</th>
                    <th style="padding:12px;text-align:center;border:1px solid #333">الرسوم الشهرية</th>
                    <th style="padding:12px;text-align:center;border:1px solid #333">الرواتب الشهرية</th>
                    <th style="padding:12px;text-align:center;border:1px solid #333">المصروفات الشهرية</th>
                    <th style="padding:12px;text-align:center;border:1px solid #333">صافي الربح</th>
                  </tr>
                </thead>
                <tbody>
                  ${profitTrend.map((row, i) => `
                    <tr style="border-bottom:1px solid #ddd;${i % 2 === 0 ? 'background:#f9f9f9' : ''}">
                      <td style="padding:10px;border:1px solid #ddd;font-weight:bold;text-align:center">${row.monthName}</td>
                      <td style="padding:10px;border:1px solid #ddd;color:#10b981;font-weight:600;text-align:center">${row.fees?.toLocaleString()}</td>
                      <td style="padding:10px;border:1px solid #ddd;color:#f59e0b;font-weight:600;text-align:center">${row.salaries?.toLocaleString()}</td>
                      <td style="padding:10px;border:1px solid #ddd;color:#f97316;font-weight:600;text-align:center">${row.supplies?.toLocaleString()}</td>
                      <td style="padding:10px;border:1px solid #ddd;font-weight:bold;font-size:16px;text-align:center">${row.profit?.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </body>
          </html>
        `;
        
        // Check if mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // For mobile: Create blob and download as PDF or open in new tab
            const blob = new Blob([printContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `تقرير-${new Date().getFullYear()}.html`;
            a.click();
            URL.revokeObjectURL(url);
            
            // Also try to open in new window for immediate print
            setTimeout(() => {
                const w = window.open('', '_blank');
                if (w) {
                    w.document.write(printContent);
                    w.document.close();
                    setTimeout(() => {
                        w.focus();
                        w.print();
                    }, 1000);
                }
            }, 100);
        } else {
            // For desktop: Use normal print window
            const w = window.open('', '_blank');
            if (w) {
                w.document.write(printContent);
                w.document.close();
                setTimeout(() => {
                    w.focus();
                    w.print();
                }, 500);
            }
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
                                <XAxis dataKey="monthName" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="fees" fill="#10b981" name={t('dashboard.monthlyFees')} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="salaries" fill="#f59e0b" name={t('dashboard.monthlySalaries')} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="supplies" fill="#f97316" name={t('dashboard.monthlyExpenses')} radius={[4, 4, 0, 0]} />
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
