import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { classesAPI, childrenAPI } from '../services/api'; // ✅ Added childrenAPI
import { showSuccessAlert, showConfirmDialog, handleApiError, validateName, showErrorAlert } from '../utils/helpers';
import { Plus, Search, Edit, Trash2, School, AlertCircle, RefreshCw, X, Users } from 'lucide-react';

const NURSERY_LEVELS = ['KG1', 'KG2', 'KG3'];
const COURSE_LEVELS = ['1', '2', '3', '4', '5', '6'];

const Classes = () => {
    const { t } = useTranslation();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ className: '', classType: 'Nursery', level: NURSERY_LEVELS[0] });
    const [students, setStudents] = useState([]);

    useEffect(() => {
        fetchClasses();
        fetchStudents();
    }, []);

    const fetchClasses = async () => {
        try { setLoading(true); setError(null); const r = await classesAPI.getAll(); setClasses(r.data); }
        catch { setError(t('messages.networkError')); }
        finally { setLoading(false); }
    };

    const fetchStudents = async () => {
        try { const r = await childrenAPI.getAll(); setStudents(r.data); } catch { }
    };

    // ✅ Calculate counts locally
    const classesWithCounts = React.useMemo(() => {
        return classes.map(c => ({
            ...c,
            studentsCount: students.filter(s => s.studentClass === c.classID).length
        }));
    }, [classes, students]);

    const filtered = classesWithCounts.filter(c => c.className?.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            // ترتيب حسب النوع أولاً (Nursery قبل Course)
            if (a.classType !== b.classType) {
                return a.classType === 'Nursery' ? -1 : 1;
            }
            // ثم ترتيب أبجدي حسب الاسم
            return a.className.localeCompare(b.className, 'ar');
        });
    const resetForm = () => { setFormData({ className: '', classType: 'Nursery', level: NURSERY_LEVELS[0] }); setEditingClass(null); };

    const openEdit = (c) => {
        setEditingClass(c);
        setFormData({ className: c.className, classType: c.classType || 'Nursery', level: c.level || (c.classType === 'Nursery' ? NURSERY_LEVELS[0] : COURSE_LEVELS[0]) });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate class name
        const nameValidation = validateName(formData.className, t('classes.name'));
        if (!nameValidation.valid) {
            showErrorAlert(nameValidation.error);
            return;
        }
        
        setSaving(true);
        try {
            const payload = {
                className: formData.className.trim(),
                classType: formData.classType,
                level: formData.level
            };
            if (editingClass) { await classesAPI.update(editingClass.classID, payload); showSuccessAlert(t('messages.updateSuccess')); }
            else { await classesAPI.create(payload); showSuccessAlert(t('messages.addSuccess')); }
            setShowModal(false); resetForm(); fetchClasses();
        } catch (err) { handleApiError(err, t); } finally { setSaving(false); }
    };

    const handleDelete = async (c) => {
        const result = await showConfirmDialog(t('messages.deleteConfirm'), `${t('messages.deleteWarning')} "${c.className}"`, t('common.confirm'), t('common.cancel'));
        if (result.isConfirmed) { try { await classesAPI.delete(c.classID); showSuccessAlert(t('messages.deleteSuccess')); fetchClasses(); } catch (err) { handleApiError(err, t); } }
    };

    if (error) {
        return (<div className="card text-center py-12"><AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" /><p className="text-gray-700 dark:text-gray-300 mb-3">{error}</p><button onClick={fetchClasses} className="btn btn-primary"><RefreshCw className="w-4 h-4" /> {t('dashboard.retry')}</button></div>);
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('classes.title')}</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('classes.subtitle')}</p></div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary"><Plus className="w-4 h-4" /> {t('classes.addNew')}</button>
            </div>

            <div className="card mb-4 !p-4">
                <div className="relative max-w-md"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder={t('common.search') + '...'} className="input !pr-10 !py-2 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
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
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('classes.name')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('classes.type')}</th>
                                    <th className="px-4 py-3 hidden sm:table-cell text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('classes.level')}</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">{t('classes.studentsCount')}</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">{t('students.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filtered.map(c => (
                                    <tr key={c.classID} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-medium text-gray-900 dark:text-white">{c.className}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={c.classType === 'Nursery' ? 'pill-nursery' : 'pill-course'}>{c.classType === 'Nursery' ? t('students.nursery') : t('students.course')}</span>
                                            <div className="text-[10px] text-gray-500 sm:hidden mt-0.5">{c.level}</div>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell text-right text-gray-600 dark:text-gray-400">{c.level}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-indigo-600 dark:text-indigo-400">{c.studentsCount || 0}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-lg"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(c)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (<div className="text-center py-12"><School className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500">{t('students.noResults')}</p></div>)}
                </div>

                {/* Mobile Card View - Simple & Clean */}
                <div className="md:hidden space-y-3">
                    {filtered.length === 0 ? (
                        <div className="card text-center py-12"><School className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500">{t('students.noResults')}</p></div>
                    ) : (
                        filtered.map(c => (
                            <div key={c.classID} className="card !p-0 overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{c.className}</h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={c.classType === 'Nursery' ? 'pill-nursery' : 'pill-course'}>
                                                    {c.classType === 'Nursery' ? t('students.nursery') : t('students.course')}
                                                </span>
                                                <span className="pill-active">{c.level}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEdit(c)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg transition-colors">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(c)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('classes.studentsCount')}</span>
                                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{c.studentsCount || 0}</span>
                                    </div>
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
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingClass ? t('common.edit') : t('classes.addNew')}</h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div><label className="label">{t('classes.name')}</label><input type="text" className="input" value={formData.className} onChange={e => setFormData({ ...formData, className: e.target.value })} required /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="label">{t('classes.type')}</label>
                                    <select
                                        className="input"
                                        value={formData.classType}
                                        onChange={e => {
                                            const newType = e.target.value;
                                            setFormData({
                                                ...formData,
                                                classType: newType,
                                                level: newType === 'Nursery' ? NURSERY_LEVELS[0] : COURSE_LEVELS[0]
                                            });
                                        }}
                                    >
                                        <option value="Nursery">{t('students.nursery')}</option>
                                        <option value="Course">{t('students.course')}</option>
                                    </select>
                                </div>
                                <div><label className="label">{t('classes.level')}</label>
                                    <select
                                        className="input"
                                        value={formData.level}
                                        onChange={e => setFormData({ ...formData, level: e.target.value })}
                                        required
                                    >
                                        {(formData.classType === 'Nursery' ? NURSERY_LEVELS : COURSE_LEVELS).map(lvl => (
                                            <option key={lvl} value={lvl}>{lvl}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>{saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (editingClass ? t('common.save') : t('common.add'))}</button>
                                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-secondary flex-1">{t('common.cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Classes;
