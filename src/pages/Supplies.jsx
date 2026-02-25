import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { suppliesAPI } from '../services/api';
import { showSuccessAlert, showConfirmDialog, handleApiError, validateName, validateMoney, showErrorAlert } from '../utils/helpers';
import { Plus, Search, Edit, Trash2, ShoppingCart, AlertCircle, RefreshCw, X } from 'lucide-react';

const Supplies = () => {
    const { t } = useTranslation();
    const [supplies, setSupplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingSupply, setEditingSupply] = useState(null);
    const [saving, setSaving] = useState(false);

    // ✅ New filter states
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const [formData, setFormData] = useState({ supplyName: '', price: '', purchaseDate: new Date().toISOString().split('T')[0], notes: '' });

    useEffect(() => { fetchSupplies(); }, [selectedMonth, selectedYear]); // ✅ Fetch when filters change

    const fetchSupplies = async () => {
        try {
            setLoading(true);
            setError(null);
            // ✅ Use getAll and filter locally to keep IDs and CRUD working
            const r = await suppliesAPI.getAll();
            setSupplies(r.data);
        }
        catch { setError(t('messages.networkError')); }
        finally { setLoading(false); }
    };

    const filtered = supplies.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        s.purchaseMonth === selectedMonth &&
        s.purchaseYear === selectedYear
    ).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    const totalCost = filtered.reduce((sum, s) => sum + (s.price || 0), 0);

    const resetForm = () => {
        // ✅ Default to the first day of the selected month/year from filters
        const defaultDate = new Date(selectedYear, selectedMonth - 1, 2).toISOString().split('T')[0];
        setFormData({ supplyName: '', price: '', purchaseDate: defaultDate, notes: '' });
        setEditingSupply(null);
    };

    const openEdit = (s) => {
        setEditingSupply(s);
        setFormData({ supplyName: s.name, price: s.price, purchaseDate: s.purchaseDate ? new Date(s.purchaseDate).toISOString().split('T')[0] : '', notes: s.notes || '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate supply name
        const nameValidation = validateName(formData.supplyName, t('supplies.name'));
        if (!nameValidation.valid) {
            showErrorAlert(nameValidation.error);
            return;
        }

        // Validate price
        const priceValidation = validateMoney(formData.price, t('supplies.price'));
        if (!priceValidation.valid) {
            showErrorAlert(priceValidation.error);
            return;
        }
        
        setSaving(true);
        try {
            const payload = {
                name: formData.supplyName.trim(),
                price: parseFloat(formData.price),
                purchaseDate: formData.purchaseDate || null,
                notes: formData.notes?.trim() || null
            };
            if (editingSupply) { await suppliesAPI.update(editingSupply.supplyID, payload); showSuccessAlert(t('messages.updateSuccess')); }
            else { await suppliesAPI.create(payload); showSuccessAlert(t('messages.addSuccess')); }
            setShowModal(false); resetForm(); fetchSupplies();
        } catch (err) { handleApiError(err, t); } finally { setSaving(false); }
    };

    const handleDelete = async (s) => {
        const result = await showConfirmDialog(t('messages.deleteConfirm'), `${t('messages.deleteWarning')} "${s.name}"`, t('common.confirm'), t('common.cancel'));
        if (result.isConfirmed) { try { await suppliesAPI.delete(s.supplyID); showSuccessAlert(t('messages.deleteSuccess')); fetchSupplies(); } catch (err) { handleApiError(err, t); } }
    };

    if (error) {
        return (<div className="card text-center py-12"><AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" /><p className="text-gray-700 dark:text-gray-300 mb-3">{error}</p><button onClick={fetchSupplies} className="btn btn-primary"><RefreshCw className="w-4 h-4" /> {t('dashboard.retry')}</button></div>);
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('supplies.title')}</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('supplies.subtitle')}</p></div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary"><Plus className="w-4 h-4" /> {t('supplies.addNew')}</button>
            </div>

            <div className="card mb-4 !p-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder={t('common.search') + '...'} className="input !pr-10 !py-3 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>

                    {/* ✅ New Month/Year Filters */}
                    <div className="flex gap-2">
                        <select
                            className="input !py-1 text-sm w-32"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(parseInt(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(2000, i).toLocaleString('ar-EG', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <select
                            className="input  text-sm w-24"
                            value={selectedYear}
                            onChange={e => setSelectedYear(parseInt(e.target.value))}
                        >
                            {Array.from({ length: 5 }, (_, i) => {
                                const year = new Date().getFullYear() - 2 + i;
                                return <option key={year} value={year}>{year}</option>
                            })}
                        </select>
                    </div>

                    <div className="card-stat !p-3 flex items-center gap-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('supplies.price')}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{totalCost.toLocaleString()} {t('common.egp')}</p>
                    </div>
                </div>
            </div>

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
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('supplies.name')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('supplies.price')}</th>
                                    <th className="px-4 py-3 hidden sm:table-cell text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('supplies.purchaseDate')}</th>
                                    <th className="px-4 py-3 hidden lg:table-cell text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('supplies.notes')}</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">{t('students.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filtered.map(s => (
                                    <tr key={s.supplyID} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-medium text-gray-900 dark:text-white">{s.name}</div>
                                            <div className="text-[10px] text-gray-500 sm:hidden">{s.purchaseDate ? new Date(s.purchaseDate).toLocaleDateString('ar-EG') : '—'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">{s.price?.toLocaleString()} {t('common.egp')}</td>
                                        <td className="px-4 py-3 hidden sm:table-cell text-right text-gray-600 dark:text-gray-400">{s.purchaseDate ? new Date(s.purchaseDate).toLocaleDateString('ar-EG') : '—'}</td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-right text-gray-500 dark:text-gray-400 text-xs">{s.notes || '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-lg"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(s)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (<div className="text-center py-12"><ShoppingCart className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500">{t('students.noResults')}</p></div>)}
                </div>

                {/* Mobile Card View - Simple & Clean */}
                <div className="md:hidden space-y-3">
                    {filtered.length === 0 ? (
                        <div className="card text-center py-12"><ShoppingCart className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500">{t('students.noResults')}</p></div>
                    ) : (
                        filtered.map(s => (
                            <div key={s.supplyID} className="card !p-0 overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">{s.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.purchaseDate ? new Date(s.purchaseDate).toLocaleDateString('ar-EG') : '—'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEdit(s)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg transition-colors">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(s)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('supplies.price')}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.price?.toLocaleString()} {t('common.egp')}</span>
                                    </div>
                                    {s.notes && (
                                        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('supplies.notes')}</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{s.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                </>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
                    <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingSupply ? t('common.edit') : t('supplies.addNew')}</h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div><label className="label">{t('supplies.name')}</label><input type="text" className="input" value={formData.supplyName} onChange={e => setFormData({ ...formData, supplyName: e.target.value })} required /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="label">{t('supplies.price')}</label><input type="number" className="input" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required min="0" step="0.01" /></div>
                                <div><label className="label">{t('supplies.purchaseDate')}</label><input type="date" className="input" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} /></div>
                            </div>
                            <div><label className="label">{t('supplies.notes')}</label><input type="text" className="input" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></div>
                            <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>{saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (editingSupply ? t('common.save') : t('common.add'))}</button>
                                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-secondary flex-1">{t('common.cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Supplies;
