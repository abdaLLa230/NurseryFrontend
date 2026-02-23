import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { feesAPI, childrenAPI } from '../services/api';
import { showSuccessAlert, showErrorAlert, handleApiError, showConfirmDialog } from '../utils/helpers';
import { Search, DollarSign, CheckCircle, AlertCircle, RefreshCw, Edit, X, Trash2 } from 'lucide-react';

const Fees = () => {
    const { t } = useTranslation();
    const [fees, setFees] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showPayModal, setShowPayModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedFee, setSelectedFee] = useState(null);
    const [saving, setSaving] = useState(false);
    const [payData, setPayData] = useState({ amount: '', notes: '' });
    const [editData, setEditData] = useState({ amount: '', notes: '', paymentStatus: '' });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            setLoading(true); setError(null);
            const [feesRes, studentsRes] = await Promise.all([feesAPI.getAll(), childrenAPI.getAll()]);
            setFees(feesRes.data);
            setStudents(studentsRes.data.filter(s => s.isActive));
        } catch { setError(t('messages.networkError')); }
        finally { setLoading(false); }
    };




    const feeMatrix = useMemo(() => {
        const byKey = new Map(); // key -> array of records

        for (const f of fees) {
            const key = `${String(f.childID)}-${Number(f.feeMonth)}-${Number(f.feeYear)}`;
            const arr = byKey.get(key) || [];
            arr.push(f);
            byKey.set(key, arr);
        }

        return students.map(student => {
            const key = `${String(student.childID)}-${Number(selectedMonth)}-${Number(selectedYear)}`;
            const records = byKey.get(key) || [];
            const hasDuplicates = records.length > 1;

            // pick a deterministic "primary" record:
            // prefer Paid, else newest feeID (or paymentDate if you have it)
            const primary =
                records.find(r => r.paymentStatus === 'Paid') ||
                records.slice().sort((a, b) => (b.feeID ?? 0) - (a.feeID ?? 0))[0] ||
                null;

            const isPaid = primary?.paymentStatus === 'Paid';

            return {
                student,
                fee: primary,
                isPaid,
                amount: primary?.amount || 0,
                hasDuplicates,
                allRecords: records,
            };
        });
    }, [students, fees, selectedMonth, selectedYear]);

    const filtered = feeMatrix.filter(row => {
        const matchSearch = row.student.childName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || (filterStatus === 'paid' && row.isPaid) || (filterStatus === 'unpaid' && !row.isPaid);
        return matchSearch && matchStatus;
    });

    const stats = {
        total: feeMatrix.length,
        paid: feeMatrix.filter(r => r.isPaid).length,
        unpaid: feeMatrix.filter(r => !r.isPaid).length,
        totalAmount: feeMatrix.filter(r => r.isPaid).reduce((s, r) => s + r.amount, 0),
    };

    const openPayModal = (row) => {
        setSelectedStudent(row.student);
        setPayData({ amount: '', notes: '' });
        setShowPayModal(true);
    };

    const openEditModal = (row) => {
        setSelectedFee(row.fee);
        setSelectedStudent(row.student);
        setEditData({
            amount: row.fee?.amount || '',
            notes: row.fee?.notes || '',
            paymentStatus: row.fee?.paymentStatus || 'NotPaid'
        });
        setShowEditModal(true);
    };

    const handlePay = async (e) => {
        e.preventDefault();

        // Safety check: verify this student doesn't already have a payment for this month in local state
        const alreadyPaid = feeMatrix.find(r => r.student.childID === selectedStudent.childID && r.isPaid);
        if (alreadyPaid) {
            showErrorAlert(t('messages.alreadyPaid') || 'This student has already paid for the selected month.');
            setShowPayModal(false);
            return;
        }

        setSaving(true);
        try {
            await feesAPI.pay({
                childID: selectedStudent.childID,
                amount: parseFloat(payData.amount),
                month: selectedMonth,
                year: selectedYear,
            });
            showSuccessAlert(t('messages.paymentSuccess'));
            setShowPayModal(false); fetchAll();
        } catch (err) { handleApiError(err, t); }
        finally { setSaving(false); }
    };

    const handleEditFee = async (e) => {
        e.preventDefault();

        const currentRow = feeMatrix.find(r => r.student.childID === selectedStudent?.childID);
        if (currentRow?.allRecords.length > 1) {
            showErrorAlert(t('messages.duplicateError') || 'Multiple records detected. Please delete duplicates first.');
            return;
        }

        setSaving(true);
        try {
            // ✅ نجيب البيانات الحديثة
            const freshFee = await feesAPI.getById(selectedFee.feeID);

            // ✅ نستخدم البيانات الحديثة مع التعديلات
            await feesAPI.update(selectedFee.feeID, {
                ...freshFee.data,              // كل البيانات الحديثة
                amount: parseFloat(editData.amount),  // التعديل الجديد
                paymentStatus: editData.paymentStatus, // حالة الدفع
                notes: editData.notes || null,        // التعديل الجديد
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
        }
        finally { setSaving(false); }
    };

    const handleDeleteFee = async (feeId) => {
        const idToDelete = feeId || selectedFee?.feeID;
        if (!idToDelete) return;

        const result = await showConfirmDialog(
            t('common.deleteConfirm'),
            t('messages.deleteWarning'),
            t('common.delete'),
            t('common.cancel')
        );
        if (!result.isConfirmed) return;

        setSaving(true);
        try {
            await feesAPI.delete(idToDelete);
            showSuccessAlert(t('messages.deleteSuccess'));

            // If we deleted the primary record, close modal
            if (idToDelete === selectedFee?.feeID) {
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('fees.title')}</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('fees.subtitle')}</p></div>
            </div>

            {/* Month/Year Selector */}
            <div className="card mb-4 !p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder={t('common.search') + '...'} className="input !pr-10 !py-3 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="input !py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">{t('common.all')}</option>
                        <option value="paid">{t('fees.paid')}</option>
                        <option value="unpaid">{t('fees.unpaid')}</option>
                    </select>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="input !py-2 text-sm">
                        {Array.from({ length: 12 }, (_, i) => (<option key={i} value={i + 1}>{t(`months.${i + 1}`)}</option>))}
                    </select>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="input !py-2 text-sm">
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {[
                    { label: t('dashboard.totalStudents'), val: stats.total, color: 'bg-blue-600' },
                    { label: t('fees.paid'), val: stats.paid, color: 'bg-emerald-600' },
                    { label: t('fees.unpaid'), val: stats.unpaid, color: 'bg-red-600' },
                    { label: t('dashboard.totalRevenue'), val: stats.totalAmount.toLocaleString() + ' ' + t('common.egp'), color: 'bg-amber-600' },
                ].map((s, i) => (
                    <div key={i} className="card-stat">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{s.val}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div className="card text-center py-16"><div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
            ) : (
                <>
                {/* Desktop Table */}
                <div className="hidden md:block card !p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('fees.student')}</th>
                                    <th className="px-4 py-3 hidden md:table-cell text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('students.type')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('fees.amount')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('fees.paymentStatus')}</th>
                                    <th className="px-4 py-3 hidden lg:table-cell text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('fees.notes')}</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">{t('students.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filtered.map(row => (
                                    <tr key={row.student.childID} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-medium text-gray-900 dark:text-white text-sm">{row.student.childName}</div>
                                            <div className="text-[10px] text-gray-500 sm:hidden">{row.student.parentPhone}</div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell text-right"><span className={row.student.studentType === 'Nursery' ? 'pill-nursery' : 'pill-course'}>{row.student.studentType === 'Nursery' ? t('students.nursery') : t('students.course')}</span></td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {row.isPaid ? `${row.amount.toLocaleString()} ${t('common.egp')}` : '—'}
                                            {row.hasDuplicates && (
                                                <span className="ml-2 text-red-500" title="Duplicate records detected in database">
                                                    <AlertCircle className="w-3.5 h-3.5 inline" />
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right"><span className={row.isPaid ? 'pill-paid' : 'pill-unpaid'}>{row.isPaid ? t('fees.paid') : t('fees.unpaid')}</span></td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-right text-gray-500 dark:text-gray-400 text-xs text-ellipsis overflow-hidden max-w-[150px]">
                                            {row.fee?.notes || '—'}
                                            {row.hasDuplicates && <div className="text-[10px] text-red-500 font-bold mt-1">DATA ERROR: Multiple payments</div>}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {!row.isPaid ? (
                                                    <button onClick={() => openPayModal(row)} className="btn btn-success !py-1 !px-3 !text-xs">
                                                        <DollarSign className="w-3.5 h-3.5" /> {t('fees.pay')}
                                                    </button>
                                                ) : (
                                                    <button onClick={() => openEditModal(row)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-lg"><Edit className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (<div className="text-center py-12"><DollarSign className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500">{t('students.noResults')}</p></div>)}
                </div>

                {/* Mobile Card View - Simple & Clean */}
                <div className="md:hidden space-y-3">
                    {filtered.length === 0 ? (
                        <div className="card text-center py-12"><DollarSign className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500">{t('students.noResults')}</p></div>
                    ) : (
                        filtered.map(row => (
                            <div key={row.student.childID} className="card !p-0 overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{row.student.childName}</h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={row.student.studentType === 'Nursery' ? 'pill-nursery' : 'pill-course'}>
                                                    {row.student.studentType === 'Nursery' ? t('students.nursery') : t('students.course')}
                                                </span>
                                                <span className={row.isPaid ? 'pill-paid' : 'pill-unpaid'}>
                                                    {row.isPaid ? t('fees.paid') : t('fees.unpaid')}
                                                </span>
                                            </div>
                                        </div>
                                        {!row.isPaid ? (
                                            <button onClick={() => openPayModal(row)} className="btn btn-success !py-2 !px-3 !text-sm whitespace-nowrap">
                                                <DollarSign className="w-4 h-4" /> {t('fees.pay')}
                                            </button>
                                        ) : (
                                            <button onClick={() => openEditModal(row)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg transition-colors">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('fees.amount')}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {row.isPaid ? `${row.amount.toLocaleString()} ${t('common.egp')}` : '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('students.parentPhone')}</span>
                                        <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white" dir="ltr">{row.student.parentPhone}</span>
                                    </div>
                                    {row.fee?.notes && (
                                        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('fees.notes')}</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{row.fee.notes}</p>
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
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('fees.pay')} — {selectedStudent?.childName}</h2>
                            <button onClick={() => setShowPayModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handlePay} className="p-5 space-y-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t(`months.${selectedMonth}`)} {selectedYear}</div>
                            <div><label className="label">{t('fees.amount')}</label><input type="number" className="input" value={payData.amount} onChange={e => setPayData({ ...payData, amount: e.target.value })} required min="1" /></div>
                            <div><label className="label">{t('fees.notes')}</label><input type="text" className="input" value={payData.notes} onChange={e => setPayData({ ...payData, notes: e.target.value })} /></div>
                            <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <button type="submit" className="btn btn-success flex-1" disabled={saving}>{saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : t('fees.pay')}</button>
                                <button type="button" onClick={() => setShowPayModal(false)} className="btn btn-secondary flex-1">{t('common.cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedFee && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('common.edit')} — {selectedStudent?.childName}</h2>
                            <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleEditFee} className="p-5 space-y-4">
                            {feeMatrix.find(r => r.student.childID === selectedStudent?.childID)?.allRecords.length > 1 ? (
                                <div className="space-y-3">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                        <div className="flex gap-2 mb-3">
                                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-red-700 dark:text-red-400">Database Conflict Detected</p>
                                                <p className="text-xs text-red-600 dark:text-red-500 mt-1">This student has multiple payment records for {t(`months.${selectedMonth}`)} {selectedYear}. You must delete the duplicates before you can edit this fee.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {feeMatrix.find(r => r.student.childID === selectedStudent?.childID)?.allRecords.map((f, idx) => (
                                                <div key={f.feeID} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 shadow-sm transition-all hover:border-red-300">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-900 dark:text-white">{f.amount} {t('common.egp')}</span>
                                                        <span className="text-[10px] text-gray-500">{f.notes || 'No notes'}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteFee(f.feeID)}
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
                                    <div><label className="label">{t('fees.amount')}</label><input type="number" className="input" value={editData.amount} onChange={e => setEditData({ ...editData, amount: e.target.value })} required min="1" /></div>
                                    <div>
                                        <label className="label">{t('fees.paymentStatus')}</label>
                                        <select className="input" value={editData.paymentStatus} onChange={e => setEditData({ ...editData, paymentStatus: e.target.value })}>
                                            <option value="Paid">{t('fees.paid')}</option>
                                            <option value="NotPaid">{t('fees.unpaid')}</option>
                                        </select>
                                    </div>
                                    <div><label className="label">{t('fees.notes')}</label><input type="text" className="input" value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} /></div>
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

export default Fees;