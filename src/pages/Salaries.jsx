import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { salariesAPI, employeesAPI } from '../services/api';
import { showSuccessAlert, showErrorAlert, showConfirmDialog, handleApiError } from '../utils/helpers';
import { Search, DollarSign, Edit, AlertCircle, RefreshCw, X, Wallet, Trash2 } from 'lucide-react';

const Salaries = () => {
    const { t } = useTranslation();
    const [salaries, setSalaries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showPayModal, setShowPayModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [saving, setSaving] = useState(false);
    const [payData, setPayData] = useState({ amount: '', notes: '' });
    const [editData, setEditData] = useState({ amount: '', notes: '', paymentStatus: '' });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            setLoading(true); setError(null);
            const [salRes, empRes] = await Promise.all([salariesAPI.getAll(), employeesAPI.getAll()]);
            setSalaries(salRes.data); setEmployees(empRes.data.filter(e => e.isActive !== false));
        } catch { setError(t('messages.networkError')); }
        finally { setLoading(false); }
    };

    // Backend SalaryPaymentDto uses: employeeID, paymentMonth, paymentYear, paymentStatus, amount
    const salaryMatrix = useMemo(() => {
        const byKey = new Map(); // key -> array of records

        salaries.forEach(s => {
            const key = `${String(s.employeeID)}-${Number(s.paymentMonth)}-${Number(s.paymentYear)}`;
            const arr = byKey.get(key) || [];
            arr.push(s);
            byKey.set(key, arr);
        });

        return employees.map(emp => {
            const key = `${String(emp.employeeID)}-${Number(selectedMonth)}-${Number(selectedYear)}`;
            const records = byKey.get(key) || [];
            const hasDuplicates = records.length > 1;

            // pick a deterministic "primary" record:
            const primary =
                records.find(r => r.paymentStatus === 'Paid') ||
                records.slice().sort((a, b) => (b.paymentID ?? 0) - (a.paymentID ?? 0))[0] ||
                null;

            const isPaid = primary?.paymentStatus === 'Paid';

            return {
                employee: emp,
                salary: primary,
                isPaid,
                amount: primary?.amount || emp.monthlySalary || 0,
                hasDuplicates,
                allRecords: records
            };
        });
    }, [employees, salaries, selectedMonth, selectedYear]);

    const filtered = salaryMatrix.filter(row => {
        const matchSearch = row.employee.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || (filterStatus === 'paid' && row.isPaid) || (filterStatus === 'unpaid' && !row.isPaid);
        return matchSearch && matchStatus;
    });

    const stats = {
        total: salaryMatrix.length,
        paid: salaryMatrix.filter(r => r.isPaid).length,
        unpaid: salaryMatrix.filter(r => !r.isPaid).length,
        totalAmount: salaryMatrix.filter(r => r.isPaid).reduce((s, r) => s + r.amount, 0),
    };

    const handlePay = async (e) => {
        e.preventDefault();

        // Safety check
        const alreadyPaid = salaryMatrix.find(r => r.employee.employeeID === selectedEmployee.employeeID && r.isPaid);
        if (alreadyPaid) {
            handleApiError({ response: { data: { message: t('messages.alreadyPaid') || 'Already paid for this month.' } } }, t);
            setShowPayModal(false);
            return;
        }

        setSaving(true);
        try {
            await salariesAPI.pay({ employeeID: selectedEmployee.employeeID, amount: parseFloat(payData.amount), month: selectedMonth, year: selectedYear, notes: payData.notes || null });
            showSuccessAlert(t('messages.paymentSuccess')); setShowPayModal(false); fetchAll();
        } catch (err) { handleApiError(err, t); } finally { setSaving(false); }
    };

    const handleEdit = async (e) => {
        e.preventDefault();

        // Final guard: check for duplicates again before submitting
        const currentRow = salaryMatrix.find(r => r.employee.employeeID === selectedEmployee?.employeeID);
        if (currentRow?.allRecords.length > 1) {
            showErrorAlert(t('messages.duplicateError') || 'Multiple records detected. Please delete duplicates first.');
            return;
        }

        setSaving(true);
        try {
            // ✅ Fetch fresh data
            const freshSalary = await salariesAPI.getById(selectedSalary.paymentID);

            // ✅ Use fresh data for update
            await salariesAPI.update(selectedSalary.paymentID, {
                ...freshSalary.data,
                amount: parseFloat(editData.amount),
                paymentStatus: editData.paymentStatus, // Update Payment Status
                notes: editData.notes || null,
            });

            showSuccessAlert(t('messages.updateSuccess'));
            setShowEditModal(false);
            fetchAll();
        } catch (err) {
            if (err.response?.status === 400 || err.response?.status === 409) {
                showErrorAlert('البيانات تغيرت. جاري إعادة التحميل...');
                fetchAll();
                setShowEditModal(false);
            } else {
                handleApiError(err, t);
            }
        } finally { setSaving(false); }
    };

    const handleDeleteSalary = async (salaryId) => {
        const idToDelete = salaryId || selectedSalary?.paymentID;
        if (!idToDelete) return;

        const confirmed = await showConfirmDialog(t('common.deleteConfirm'), t('messages.deleteWarning'));
        if (!confirmed) return;

        setSaving(true);
        try {
            await salariesAPI.delete(idToDelete);
            showSuccessAlert(t('messages.deleteSuccess'));

            // If we deleted the primary record, close modal
            if (idToDelete === selectedSalary?.paymentID) {
                setShowEditModal(false);
            }
            fetchAll();
        } catch (err) { handleApiError(err, t); }
        finally { setSaving(false); }
    };

    if (error) {
        return (<div className="card text-center py-12"><AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" /><p className="text-gray-700 dark:text-gray-300 mb-3">{error}</p><button onClick={fetchAll} className="btn btn-primary"><RefreshCw className="w-4 h-4" /> {t('dashboard.retry')}</button></div>);
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('salaries.title')}</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('salaries.subtitle')}</p></div>
            </div>

            <div className="card mb-4 !p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder={t('common.search') + '...'} className="input !pr-10 !py-3 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                    <select className="input !py-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="all">{t('common.all')}</option><option value="paid">{t('fees.paid')}</option><option value="unpaid">{t('fees.unpaid')}</option></select>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="input !py-2 text-sm">{Array.from({ length: 12 }, (_, i) => (<option key={i} value={i + 1}>{t(`months.${i + 1}`)}</option>))}</select>
                    <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="input !py-2 text-sm">{[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {[
                    { label: t('salaries.employee'), val: stats.total },
                    { label: t('fees.paid'), val: stats.paid },
                    { label: t('fees.unpaid'), val: stats.unpaid },
                    { label: t('dashboard.monthlySalaries'), val: stats.totalAmount.toLocaleString() + ' ' + t('common.egp') },
                ].map((s, i) => (<div key={i} className="card-stat"><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p><p className="text-xl font-bold text-gray-900 dark:text-white">{s.val}</p></div>))}
            </div>

            {loading ? (
                <div className="card text-center py-16"><div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <>
                {/* Desktop Table */}
                <div className="hidden md:block card !p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('salaries.employee')}</th>
                                    <th className="px-4 py-3 hidden md:table-cell text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('employees.role')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('salaries.amount')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('salaries.paymentStatus')}</th>
                                    <th className="px-4 py-3 hidden lg:table-cell text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('salaries.notes')}</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">{t('students.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filtered.map(row => (
                                    <tr key={row.employee.employeeID} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-medium text-gray-900 dark:text-white">{row.employee.name}</div>
                                            <div className="text-[10px] text-gray-500 md:hidden">{row.employee.role}</div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell text-right text-gray-600 dark:text-gray-400">{row.employee.role}</td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {row.isPaid ? `${row.amount.toLocaleString()} ${t('common.egp')}` : `${row.employee.monthlySalary?.toLocaleString()} ${t('common.egp')}`}
                                            {row.hasDuplicates && (
                                                <span className="ml-2 text-red-500" title="Duplicate records detected in database">
                                                    <AlertCircle className="w-3.5 h-3.5 inline" />
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right"><span className={row.isPaid ? 'pill-paid' : 'pill-unpaid'}>{row.isPaid ? t('fees.paid') : t('fees.unpaid')}</span></td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-right text-gray-500 dark:text-gray-400 text-xs">
                                            {row.salary?.notes || '—'}
                                            {row.hasDuplicates && <div className="text-[10px] text-red-500 font-bold mt-1">DATA ERROR: Multiple records</div>}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {!row.isPaid ? (
                                                    <button onClick={() => { setSelectedEmployee(row.employee); setPayData({ amount: row.employee.monthlySalary || '', notes: '' }); setShowPayModal(true); }} className="btn btn-success !py-1 !px-3 !text-xs">
                                                        <DollarSign className="w-3.5 h-3.5" /> {t('salaries.pay')}
                                                    </button>
                                                ) : (
                                                    <button onClick={() => { setSelectedSalary(row.salary); setSelectedEmployee(row.employee); setEditData({ amount: row.salary?.amount || '', notes: row.salary?.notes || '', paymentStatus: row.salary?.paymentStatus || 'NotPaid' }); setShowEditModal(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-lg"><Edit className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (<div className="text-center py-12"><Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500">{t('students.noResults')}</p></div>)}
                </div>

                {/* Mobile Card View - Simple & Clean */}
                <div className="md:hidden space-y-3">
                    {filtered.length === 0 ? (
                        <div className="card text-center py-12"><Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500">{t('students.noResults')}</p></div>
                    ) : (
                        filtered.map(row => (
                            <div key={row.employee.employeeID} className="card !p-0 overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{row.employee.name}</h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="pill-nursery">{row.employee.role}</span>
                                                <span className={row.isPaid ? 'pill-paid' : 'pill-unpaid'}>
                                                    {row.isPaid ? t('fees.paid') : t('fees.unpaid')}
                                                </span>
                                            </div>
                                        </div>
                                        {!row.isPaid ? (
                                            <button onClick={() => { setSelectedEmployee(row.employee); setPayData({ amount: row.employee.monthlySalary || '', notes: '' }); setShowPayModal(true); }} className="btn btn-success !py-2 !px-3 !text-sm whitespace-nowrap">
                                                <DollarSign className="w-4 h-4" /> {t('salaries.pay')}
                                            </button>
                                        ) : (
                                            <button onClick={() => { setSelectedSalary(row.salary); setSelectedEmployee(row.employee); setEditData({ amount: row.salary?.amount || '', notes: row.salary?.notes || '', paymentStatus: row.salary?.paymentStatus || 'NotPaid' }); setShowEditModal(true); }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg transition-colors">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('salaries.amount')}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {row.isPaid ? `${row.amount.toLocaleString()} ${t('common.egp')}` : `${row.employee.monthlySalary?.toLocaleString()} ${t('common.egp')}`}
                                        </span>
                                    </div>
                                    {row.salary?.notes && (
                                        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('salaries.notes')}</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{row.salary.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                </>
            )}

            {/* Pay Modal */}
            {showPayModal && (
                <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
                    <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('salaries.pay')} — {selectedEmployee?.name}</h2>
                            <button onClick={() => setShowPayModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handlePay} className="p-5 space-y-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t(`months.${selectedMonth}`)} {selectedYear}</div>
                            <div><label className="label">{t('salaries.amount')}</label><input type="number" className="input" value={payData.amount} onChange={e => setPayData({ ...payData, amount: e.target.value })} required min="1" /></div>
                            <div><label className="label">{t('salaries.notes')}</label><input type="text" className="input" value={payData.notes} onChange={e => setPayData({ ...payData, notes: e.target.value })} /></div>
                            <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <button type="submit" className="btn btn-success flex-1" disabled={saving}>{saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : t('salaries.pay')}</button>
                                <button type="button" onClick={() => setShowPayModal(false)} className="btn btn-secondary flex-1">{t('common.cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedSalary && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('common.edit')} — {selectedEmployee?.name}</h2>
                            <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleEdit} className="p-5 space-y-4">
                            {salaryMatrix.find(r => r.employee.employeeID === selectedEmployee?.employeeID)?.allRecords.length > 1 ? (
                                <div className="space-y-3">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                        <div className="flex gap-2 mb-3">
                                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-red-700 dark:text-red-400">Database Conflict Detected</p>
                                                <p className="text-xs text-red-600 dark:text-red-500 mt-1">This employee has multiple payout records for {t(`months.${selectedMonth}`)} {selectedYear}. You must delete the duplicates before you can edit.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {salaryMatrix.find(r => r.employee.employeeID === selectedEmployee?.employeeID)?.allRecords.map((s, idx) => (
                                                <div key={s.paymentID} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 shadow-sm transition-all hover:border-red-300">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{s.amount} {t('common.egp')}</span>
                                                        <span className="text-[10px] text-gray-500">{s.notes || 'No notes'}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteSalary(s.paymentID)}
                                                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                                                        title="Delete this record"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary w-full py-2.5 mt-2">{t('common.cancel')}</button>
                                </div>
                            ) : (
                                <>
                                    <div><label className="label">{t('salaries.amount')}</label><input type="number" className="input" value={editData.amount} onChange={e => setEditData({ ...editData, amount: e.target.value })} required min="1" /></div>
                                    <div>
                                        <label className="label">{t('salaries.paymentStatus')}</label>
                                        <select className="input" value={editData.paymentStatus} onChange={e => setEditData({ ...editData, paymentStatus: e.target.value })}>
                                            <option value="Paid">{t('fees.paid')}</option>
                                            <option value="NotPaid">{t('fees.unpaid')}</option>
                                        </select>
                                    </div>
                                    <div><label className="label">{t('salaries.notes')}</label><input type="text" className="input" value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} /></div>
                                    <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <button
                                            type="submit"
                                            className="btn btn-primary flex-1 py-2.5"
                                            disabled={saving}
                                        >
                                            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : t('common.save')}
                                        </button>
                                        <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary flex-1 py-2.5">{t('common.cancel')}</button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Salaries;
