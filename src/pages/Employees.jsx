import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { employeesAPI, classesAPI } from '../services/api';
import { showSuccessAlert, showConfirmDialog, handleApiError, showErrorAlert } from '../utils/helpers';
import { Plus, Search, Edit, Trash2, UserCog, AlertCircle, RefreshCw, X } from 'lucide-react';

const Employees = () => {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        monthlySalary: '',
        isActive: true,
        studentClass: ''
    });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const [empRes, classRes] = await Promise.all([
                employeesAPI.getAll(),
                classesAPI.getAll()
            ]);
            setEmployees(empRes.data);
            setClasses(classRes.data);
        } catch (err) {
            setError(t('messages.networkError'));
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const r = await employeesAPI.getAll();
            setEmployees(r.data);
        } catch (err) {
            console.error('Fetch Employees Error:', err);
        }
    };

    const filtered = employees.filter(e =>
        e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.phone?.includes(searchTerm) ||
        e.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetForm = () => {
        setFormData({
            name: '',
            role: '',
            phone: '',
            monthlySalary: '',
            isActive: true,
            studentClass: ''
        });
        setEditingEmployee(null);
    };

    const openEdit = (emp) => {
        setEditingEmployee(emp);
        setFormData({
            name: emp.name || '',
            role: emp.role || '',
            phone: emp.phone || '',
            monthlySalary: emp.monthlySalary || '',
            isActive: emp.isActive !== false,
            // Preselect current class ID as string for the select element
            studentClass: emp.studentClass ? emp.studentClass.toString() : ''
        });
        setShowModal(true);
    };

    const validateForm = () => {
        const nameTrimmed = (formData.name || '').trim();
        const roleTrimmed = (formData.role || '').trim();
        const salaryNum = parseFloat(formData.monthlySalary);

        if (!nameTrimmed) {
            showErrorAlert(t('validation.required') + ': ' + t('employees.name'));
            return false;
        }
        if (!roleTrimmed) {
            showErrorAlert(t('validation.required') + ': ' + t('employees.role'));
            return false;
        }
        if (isNaN(salaryNum) || salaryNum <= 0) {
            showErrorAlert(t('validation.positive') || 'Salary must be a positive number');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSaving(true);
        try {
            const classIdParsed = parseInt(formData.studentClass);
            // FK Safety: Check if selected class exists in our fetched list
            const isValidClass = !isNaN(classIdParsed) && classes.some(c => c.classID === classIdParsed);

            const payload = {
                name: formData.name.trim(),
                role: formData.role.trim(),
                phone: formData.phone.trim() || null,
                monthlySalary: parseFloat(formData.monthlySalary),
                studentClass: isValidClass ? classIdParsed : null,
                isActive: formData.isActive
            };

            if (editingEmployee) {
                await employeesAPI.update(editingEmployee.employeeID, payload);
                showSuccessAlert(t('messages.updateSuccess'));
            } else {
                await employeesAPI.create(payload);
                showSuccessAlert(t('messages.addSuccess'));
            }

            setShowModal(false);
            resetForm();
            await fetchEmployees();
        } catch (err) {
            handleApiError(err, t);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (emp) => {
        const result = await showConfirmDialog(
            t('messages.deleteConfirm'),
            `${t('messages.deleteWarning')} "${emp.name}"`,
            t('common.confirm'),
            t('common.cancel')
        );
        if (result.isConfirmed) {
            try {
                await employeesAPI.delete(emp.employeeID);
                showSuccessAlert(t('messages.deleteSuccess'));
                fetchEmployees();
            } catch (err) {
                handleApiError(err, t);
            }
        }
    };

    if (error) {
        return (
            <div className="card text-center py-12">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-300 mb-3">{error}</p>
                <button onClick={fetchAll} className="btn btn-primary">
                    <RefreshCw className="w-4 h-4" /> {t('dashboard.retry')}
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('employees.title')}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('employees.subtitle')}</p>
                </div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
                    <Plus className="w-4 h-4" /> {t('employees.addNew')}
                </button>
            </div>

            <div className="card mb-4 !p-4">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('common.search') + '...'}
                        className="input !pr-10 !py-2 text-sm max-w-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="card text-center py-16">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            ) : (
                <>
                {/* Desktop Table */}
                <div className="hidden md:block card !p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('employees.name')}</th>
                                    <th className="px-4 py-3 hidden md:table-cell text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('employees.role')}</th>
                                    <th className="px-4 py-3 hidden lg:table-cell text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('classes.name')}</th>
                                    <th className="px-4 py-3 hidden sm:table-cell text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('employees.phone')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('employees.monthlySalary')}</th>
                                    <th className="px-4 py-3 hidden sm:table-cell text-right text-xs font-semibold text-gray-600 dark:text-gray-400">{t('employees.status')}</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">{t('employees.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filtered.map(emp => (
                                    <tr key={emp.employeeID} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-medium text-gray-900 dark:text-white">{emp.name}</div>
                                            <div className="text-[10px] text-gray-500 md:hidden">{emp.role}</div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell text-right text-gray-600 dark:text-gray-400">{emp.role}</td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-right text-gray-600 dark:text-gray-400">
                                            {classes.find(c => c.classID === emp.studentClass)?.className || '—'}
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell text-right text-gray-600 dark:text-gray-400 font-mono text-xs">{emp.phone || '—'}</td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                            {emp.monthlySalary?.toLocaleString()} {t('common.egp')}
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell text-right">
                                            <span className={emp.isActive !== false ? 'pill-active' : 'pill-inactive'}>
                                                {emp.isActive !== false ? t('students.active') : t('students.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openEdit(emp)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-lg">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(emp)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (
                        <div className="text-center py-12">
                            <UserCog className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">{t('students.noResults')}</p>
                        </div>
                    )}
                </div>

                {/* Mobile Card View - Simple & Clean */}
                <div className="md:hidden space-y-3">
                    {filtered.length === 0 ? (
                        <div className="card text-center py-12">
                            <UserCog className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">{t('students.noResults')}</p>
                        </div>
                    ) : (
                        filtered.map(emp => (
                            <div key={emp.employeeID} className="card !p-0 overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{emp.name}</h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="pill-nursery">{emp.role}</span>
                                                <span className={emp.isActive !== false ? 'pill-active' : 'pill-inactive'}>
                                                    {emp.isActive !== false ? t('students.active') : t('students.inactive')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEdit(emp)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg transition-colors">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(emp)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('classes.name')}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{classes.find(c => c.classID === emp.studentClass)?.className || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('employees.phone')}</span>
                                        <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white" dir="ltr">{emp.phone || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('employees.monthlySalary')}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{emp.monthlySalary?.toLocaleString()} {t('common.egp')}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                </>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
                    <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingEmployee ? t('common.edit') : t('employees.addNew')}</h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="label">{t('employees.name')}</label>
                                <input type="text" className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">{t('employees.role')}</label>
                                    <input type="text" className="input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="label">{t('classes.title')}</label>
                                    <select
                                        className="input"
                                        value={formData.studentClass}
                                        onChange={e => setFormData({ ...formData, studentClass: e.target.value })}
                                    >
                                        <option value="">—</option>
                                        {classes.map(c => (
                                            <option key={c.classID} value={c.classID}>{c.className}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">{t('employees.phone')}</label>
                                    <input type="text" className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">{t('employees.monthlySalary')}</label>
                                    <input type="number" className="input" value={formData.monthlySalary} onChange={e => setFormData({ ...formData, monthlySalary: e.target.value })} required min="0" />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                                {t('students.active')}
                            </label>
                            <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (editingEmployee ? t('common.save') : t('common.add'))}
                                </button>
                                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-secondary flex-1">
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
