import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { childrenAPI, classesAPI } from '../services/api';
import { showSuccessAlert, showConfirmDialog, handleApiError } from '../utils/helpers';
import { Plus, Search, Edit, Trash2, Users, UserCheck, GraduationCap, AlertCircle, RefreshCw, X } from 'lucide-react';

const NURSERY_LEVELS = ['KG1', 'KG2', 'KG3'];
const COURSE_LEVELS = ['1', '2', '3', '4', '5', '6'];

const Students = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    childName: '', age: '', studentType: 'Nursery', studentLevel: NURSERY_LEVELS[0],
    studentClass: '', parentPhone: '', registrationDate: new Date().toISOString().split('T')[0], isActive: true,
  });

  useEffect(() => { fetchStudents(); fetchClasses(); }, []);

  const fetchStudents = async () => {
    try { setLoading(true); setError(null); const r = await childrenAPI.getAll(); setStudents(r.data); }
    catch { setError(t('messages.networkError')); }
    finally { setLoading(false); }
  };
  const fetchClasses = async () => { try { const r = await classesAPI.getAll(); setClasses(r.data); } catch { } };

  const filtered = students.filter(s => {
    const matchSearch = s.childName.toLowerCase().includes(searchTerm.toLowerCase()) || s.parentPhone?.includes(searchTerm);
    const matchType = filterType === 'all' || s.studentType === filterType;
    const matchLevel = filterLevel === 'all' || s.studentLevel === filterLevel;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' && s.isActive) || (filterStatus === 'inactive' && !s.isActive);
    return matchSearch && matchType && matchLevel && matchStatus;
  });

  const stats = {
    total: students.length,
    nursery: students.filter(s => s.studentType === 'Nursery').length,
    course: students.filter(s => s.studentType === 'Course').length,
    active: students.filter(s => s.isActive).length,
  };

  const resetForm = () => {
    setFormData({ childName: '', age: '', studentType: 'Nursery', studentLevel: NURSERY_LEVELS[0], studentClass: '', parentPhone: '', registrationDate: new Date().toISOString().split('T')[0], isActive: true });
    setEditingStudent(null);
  };

  const openEdit = (s) => {
    setEditingStudent(s);
    setFormData({
      childName: s.childName, age: s.age, studentType: s.studentType, studentLevel: s.studentLevel || NURSERY_LEVELS[0],
      studentClass: s.studentClass || '', parentPhone: s.parentPhone || '',
      registrationDate: s.registrationDate ? new Date(s.registrationDate).toISOString().split('T')[0] : '', isActive: s.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameTrimmed = (formData.childName || '').trim();
    if (!nameTrimmed) {
      handleApiError({ response: { data: { message: t('students.invalidName') || 'Please enter the student name.' } } }, t);
      return;
    }

    const ageNum = parseInt(formData.age, 10);
    if (formData.age === '' || isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      handleApiError({ response: { data: { message: t('students.invalidAge') || 'Please enter a valid age (0-120).' } } }, t);
      return;
    }

    const studentClassNum = formData.studentClass !== '' && !isNaN(parseInt(formData.studentClass, 10))
      ? parseInt(formData.studentClass, 10)
      : null;

    setSaving(true);
    try {
      if (editingStudent) {
        const updatePayload = {
          childName: nameTrimmed,
          age: ageNum,
          studentType: formData.studentType || 'Nursery',
          studentLevel: String(formData.studentLevel ?? 1),
          studentClass: studentClassNum,
          parentPhone: (formData.parentPhone || '').trim() || null,
          isActive: Boolean(formData.isActive),
        };
        await childrenAPI.update(editingStudent.childID, updatePayload);
        showSuccessAlert(t('messages.updateSuccess'));
      } else {
        const createPayload = {
          childName: nameTrimmed,
          age: ageNum,
          studentType: formData.studentType || 'Nursery',
          studentLevel: String(formData.studentLevel ?? 1),
          studentClass: studentClassNum,
          parentPhone: (formData.parentPhone || '').trim() || null,
        };
        await childrenAPI.create(createPayload);
        showSuccessAlert(t('messages.addSuccess'));
      }
      setShowModal(false);
      resetForm();
      await fetchStudents();
    } catch (err) {
      handleApiError(err, t);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    const result = await showConfirmDialog(t('messages.deleteConfirm'), `${t('messages.deleteWarning')} "${s.childName}"`, t('common.confirm'), t('common.cancel'));
    if (result.isConfirmed) { try { await childrenAPI.delete(s.childID); showSuccessAlert(t('messages.deleteSuccess')); fetchStudents(); } catch (err) { handleApiError(err, t); } }
  };

  if (error) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-700 dark:text-gray-300 mb-3">{error}</p>
        <button onClick={fetchStudents} className="btn btn-primary"><RefreshCw className="w-4 h-4" /> {t('dashboard.retry')}</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('students.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('students.subtitle')}</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
          <Plus className="w-4 h-4" /> {t('students.addNew')}
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4 !p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={t('students.search')} className="input !pr-10 !py-3 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="input !py-2 text-sm" value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterLevel('all'); }}>
            <option value="all">{t('students.allTypes')}</option>
            <option value="Nursery">{t('students.nursery')}</option>
            <option value="Course">{t('students.course')}</option>
          </select>
          <select className="input !py-2 text-sm" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} disabled={filterType === 'all'}>
            <option value="all">{t('common.all') || 'All'}</option>
            {filterType === 'Nursery' && NURSERY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            {filterType === 'Course' && COURSE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select className="input !py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">{t('students.allStatuses')}</option>
            <option value="active">{t('students.active')}</option>
            <option value="inactive">{t('students.inactive')}</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: t('dashboard.totalStudents'), val: stats.total, icon: Users, color: 'bg-blue-600' },
          { label: t('dashboard.nurseryStudents'), val: stats.nursery, icon: UserCheck, color: 'bg-pink-600' },
          { label: t('dashboard.courseStudents'), val: stats.course, icon: GraduationCap, color: 'bg-violet-600' },
          { label: t('dashboard.activeStudents'), val: stats.active, icon: UserCheck, color: 'bg-emerald-600' },
        ].map((s, i) => (
          <div key={i} className="card-stat">
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}><s.icon className="w-4 h-4 text-white" /></div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="card text-center py-16">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3">{t('students.name')}</th>
                    <th className="px-4 py-3">{t('students.age')}</th>
                    <th className="px-4 py-3">{t('students.type')}</th>
                    <th className="px-4 py-3">{t('students.level')}</th>
                    <th className="px-4 py-3">{t('students.class')}</th>
                    <th className="px-4 py-3">{t('students.parentPhone')}</th>
                    <th className="px-4 py-3">{t('students.status')}</th>
                    <th className="px-4 py-3 text-center">{t('students.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(s => (
                    <tr key={s.childID} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.childName}</td>
                      <td className="px-4 py-3">{s.age}</td>
                      <td className="px-4 py-3"><span className={s.studentType === 'Nursery' ? 'pill-nursery' : 'pill-course'}>{s.studentType === 'Nursery' ? t('students.nursery') : t('students.course')}</span></td>
                      <td className="px-4 py-3">{s.studentLevel}</td>
                      <td className="px-4 py-3">{s.className || <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-3 font-mono text-xs">{s.parentPhone}</td>
                      <td className="px-4 py-3"><span className={s.isActive ? 'pill-active' : 'pill-inactive'}>{s.isActive ? t('students.active') : t('students.inactive')}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(s)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('students.noResults')}</p>
              </div>
            )}
          </div>

          {/* Mobile Card View - Simple & Clean */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="card text-center py-12">
                <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('students.noResults')}</p>
              </div>
            ) : (
              filtered.map(s => (
                <div key={s.childID} className="card !p-0 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{s.childName}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={s.studentType === 'Nursery' ? 'pill-nursery' : 'pill-course'}>
                            {s.studentType === 'Nursery' ? t('students.nursery') : t('students.course')}
                          </span>
                          <span className={s.isActive ? 'pill-active' : 'pill-inactive'}>
                            {s.isActive ? t('students.active') : t('students.inactive')}
                          </span>
                        </div>
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
                  
                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('students.age')}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.age} {t('students.years')}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('students.level')}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.studentLevel}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('students.class')}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.className || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('students.parentPhone')}</span>
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white" dir="ltr">{s.parentPhone}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{t('students.showing')} {filtered.length} {t('students.of')} {students.length}</p>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingStudent ? t('students.edit') : t('students.addNew')}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="label">{t('students.name')}</label><input type="text" className="input" value={formData.childName} onChange={e => setFormData({ ...formData, childName: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{t('students.age')}</label><input type="number" className="input" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} required min="1" max="20" /></div>
                <div><label className="label">{t('students.type')}</label>
                  <select
                    className="input"
                    value={formData.studentType}
                    onChange={e => {
                      const newType = e.target.value;
                      setFormData({
                        ...formData,
                        studentType: newType,
                        studentLevel: newType === 'Nursery' ? NURSERY_LEVELS[0] : COURSE_LEVELS[0]
                      });
                    }}
                  >
                    <option value="Nursery">{t('students.nursery')}</option>
                    <option value="Course">{t('students.course')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{t('students.level')}</label>
                  <select
                    className="input"
                    value={formData.studentLevel}
                    onChange={e => setFormData({ ...formData, studentLevel: e.target.value })}
                    required
                  >
                    {(formData.studentType === 'Nursery' ? NURSERY_LEVELS : COURSE_LEVELS).map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
                <div><label className="label">{t('students.class')}</label>
                  <select className="input" value={formData.studentClass} onChange={e => setFormData({ ...formData, studentClass: e.target.value })}>
                    <option value="">—</option>{classes.map(c => <option key={c.classID} value={c.classID}>{c.className}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label">{t('students.parentPhone')}</label><input type="text" className="input" value={formData.parentPhone} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })} /></div>
              <div><label className="label">{t('students.registrationDate')}</label><input type="date" className="input" value={formData.registrationDate} onChange={e => setFormData({ ...formData, registrationDate: e.target.value })} /></div>
              {editingStudent && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
                  {t('students.active')}
                </label>
              )}
              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (editingStudent ? t('common.save') : t('common.add'))}
                </button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-secondary flex-1">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;