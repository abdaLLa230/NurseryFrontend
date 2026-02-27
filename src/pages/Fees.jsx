import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { feesAPI, childrenAPI } from '../services/api';
import { showSuccessAlert, showErrorAlert, handleApiError, showConfirmDialog, validateMoney } from '../utils/helpers';
import { Search, DollarSign, CheckCircle, AlertCircle, RefreshCw, Edit, X, Trash2, Printer } from 'lucide-react';

const Fees = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const [fees, setFees] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(location.state?.searchStudent || '');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterLevel, setFilterLevel] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState(location.state?.selectedMonth || new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(location.state?.selectedYear || new Date().getFullYear());
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

        // بناء خريطة من جميع السجلات
        for (const f of fees) {
            const key = `${String(f.childID)}-${Number(f.feeMonth)}-${Number(f.feeYear)}`;
            const arr = byKey.get(key) || [];
            arr.push(f);
            byKey.set(key, arr);
        }

        // إنشاء صف لكل طالب مع بيانات الشهر والسنة المختارة
        return students.map(student => {
            const key = `${String(student.childID)}-${Number(selectedMonth)}-${Number(selectedYear)}`;
            const records = byKey.get(key) || [];
            const hasDuplicates = records.length > 1;

            // اختيار السجل الأساسي: نفضل المدفوع، وإلا الأحدث
            const primary =
                records.find(r => r.paymentStatus === 'Paid') ||
                records.slice().sort((a, b) => (b.feeID ?? 0) - (a.feeID ?? 0))[0] ||
                null;

            // تحديد حالة الدفع بناءً على السجل الأساسي
            const isPaid = primary !== null && primary.paymentStatus === 'Paid';

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
        const matchType = filterType === 'all' || row.student.studentType === filterType;
        const matchLevel = filterLevel === 'all' || row.student.studentLevel === filterLevel;
        return matchSearch && matchStatus && matchType && matchLevel;
    }).sort((a, b) => a.student.childName.localeCompare(b.student.childName, 'ar'));

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

    const printMonthlyFee = (row) => {
        const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        // استخدم الشهر والسنة من الفلتر المختار
        const displayMonth = selectedMonth;
        const displayYear = selectedYear;
        
        const printContent = `
          <!DOCTYPE html>
          <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>فاتورة ${row.student.childName}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
              @page { margin: 1cm; }
              @media print {
                body { margin: 0; padding: 0; }
              }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Cairo', sans-serif; }
            </style>
          </head>
          <body>
  <div style="font-family:'Cairo',sans-serif;width:82mm;background:#fafaf8;direction:rtl;position:relative;box-shadow:0 2px 4px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.10),0 24px 48px rgba(0,0,0,0.08);">

    <!-- حواف علوية -->
    <div style="height:3px;background:linear-gradient(90deg,#1c1c1e 0%,#3a3a3c 50%,#1c1c1e 100%);"></div>

    <!-- HEADER -->
    <div style="background:#1c1c1e;padding:22px 20px 18px;text-align:center;position:relative;">
      <div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid #1c1c1e;"></div>
      <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);margin:0 auto 8px;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:22px;">
        <img src="${window.location.origin}/NurseryLogo.png" onerror="this.style.display='none';this.parentElement.innerHTML='🌸'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
      </div>
      <div style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:1px;">حضانة الأمل</div>
      <div style="color:rgba(255,255,255,0.9);font-size:15px;letter-spacing:2px;margin-top:4px;">فاتورة رسوم شهرية</div>
    </div>

    <!-- BODY -->
    <div style="padding:24px 20px 16px;">

      <!-- الفترة -->
      <div style="display:flex;justify-content:space-between;align-items:center;background:#f3f1ee;border-radius:4px;padding:7px 12px;margin-bottom:20px;">
        <span style="font-size:15px;color:#a0998e;letter-spacing:1.5px;">الفترة</span>
        <span style="font-size:15px;font-weight:700;color:#1c1c1e;">${months[displayMonth - 1]} ${displayYear}</span>
      </div>

      <!-- بيانات الطالب -->
      <div style="font-size:15px;letter-spacing:2px;color:#c0b8ae;margin-bottom:10px;text-align:center;">بيانات الطالب</div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #eeece8;">
        <span style="font-size:15px;color:#1c1c1e;">أسم الطالب</span>
        <span style="font-size:14px;font-weight:700;color:#1c1c1e;">${row.student.childName}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #eeece8;">
        <span style="font-size:15px;color:#1c1c1e;">المستوى</span>
        <span style="font-size:11px;font-weight:700;color:#1c1c1e;">${row.student.studentLevel || '—'}</span>
      </div>

      <!-- فاصل -->
      <div style="border:none;border-top:1px dashed #d8d4cc;margin:18px 0;"></div>

      <!-- المبلغ -->
      <div style="text-align:center;padding:4px 0 6px;">
        <div style="font-size:12px;color:#a0998e;letter-spacing:1.5px;margin-bottom:6px;">المبلغ المستحق</div>
        <div style="font-size:32px;font-weight:900;color:#1c1c1e;line-height:1;letter-spacing:-2px;">${row.amount > 0 ? row.amount.toLocaleString() : '—'}</div>  
        <div style="font-size:12px;color:#a0998e;margin-top:5px;letter-spacing:1px;">جنيه مصري</div>
      </div>

      <!-- الحالة -->
      <div style="display:flex;justify-content:center;margin-top:14px;">
        ${row.fee?.paymentStatus === 'Paid'
          ? '<span style="display:inline-flex;align-items:center;gap:5px;font-size:14px;font-weight:700;color:#166534;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:5px 14px;">تم الدفع  &nbsp; &nbsp; ✅</span>'
          : '<span style="display:inline-flex;align-items:center;gap:5px;font-size:14px;font-weight:700;color:#991b1b;background:#fff5f5;border:1px solid #fecaca;border-radius:20px;padding:5px 14px;">لم  يدفع  &nbsp; &nbsp; 🚫</span>'
        }
      </div>

      ${row.fee?.notes ? `
      <div style="margin-top:16px;background:#fffbeb;border-right:2px solid #d4a017;border-radius:3px;padding:9px 11px;">
        <div style="font-size:7.5px;color:#a16207;letter-spacing:1.5px;margin-bottom:4px;">ملاحظات</div>
        <div style="font-size:10px;color:#78350f;line-height:1.6;">${row.fee.notes}</div>
      </div>
      ` : ''}

    </div>

    <!-- FOOTER -->
    <div style="border-top:1px solid #eae7e1;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:10px;font-weight:700;color:#1c1c1e;">نظام إدارة الحضانة</span>
      <span style="font-size:10px;color:#b0a89e;">${new Date().toLocaleDateString('ar-EG')}</span>
    </div>

  </div>
          </body>
          </html>
`;
        
        // Check if mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // For mobile: Open in new window
            const w = window.open('', '_blank');
            if (w) {
                w.document.write(printContent);
                w.document.close();
                setTimeout(() => {
                    w.focus();
                    w.print();
                }, 1000);
            }
        } else {
            // For desktop: Use iframe
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);
            
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(printContent);
            doc.close();
            
            setTimeout(() => {
                iframe.contentWindow.print();
                setTimeout(() => document.body.removeChild(iframe), 1000);
            }, 300);
        }
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

        // Validate amount
        const amountValidation = validateMoney(payData.amount, t('fees.amount'));
        if (!amountValidation.valid) {
            showErrorAlert(amountValidation.error);
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

        // Validate amount
        const amountValidation = validateMoney(editData.amount, t('fees.amount'));
        if (!amountValidation.valid) {
            showErrorAlert(amountValidation.error);
            return;
        }

        setSaving(true);
        try {
            const freshFee = await feesAPI.getById(selectedFee.feeID);

            const updateData = {
                childID: freshFee.data.childID,
                feeMonth: freshFee.data.feeMonth,
                feeYear: freshFee.data.feeYear,
                amount: parseFloat(editData.amount) || 0,
                paymentStatus: editData.paymentStatus || 'NotPaid',
                notes: editData.notes?.trim() || null,
            };

            await feesAPI.update(selectedFee.feeID, updateData);

            showSuccessAlert(t('messages.updateSuccess'));
            setShowEditModal(false);
            fetchAll();
        } catch (err) {
            if (err.response?.status === 400 || err.response?.status === 409) {
                showErrorAlert(err.response?.data?.error || err.response?.data?.message || t('status.dataChanged'));
                fetchAll();
                setShowEditModal(false);
            } else {
                showErrorAlert(err.response?.data?.message || err.message || t('messages.updateError'));
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

    const printFeeReport = () => {
        if (filtered.length === 0) {
            showErrorAlert(t('status.noPrintData'));
            return;
        }
        
        const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const total = filtered.filter(r => r.isPaid).reduce((sum, r) => sum + r.amount, 0);
        
        const collectionRate = filtered.length > 0 ? Math.round((stats.paid / filtered.length) * 100) : 0;
        
        // ترتيب متعدد المستويات: النوع > المستوى > الاسم أبجدياً
        const sortedFiltered = [...filtered].sort((a, b) => {
            // 1. ترتيب حسب النوع (حضانة أولاً، كورس ثانياً)
            if (a.student.studentType !== b.student.studentType) {
                return a.student.studentType === 'Nursery' ? -1 : 1;
            }
            
            // 2. ترتيب حسب المستوى
            const levelA = a.student.studentLevel || '';
            const levelB = b.student.studentLevel || '';
            
            if (a.student.studentType === 'Nursery') {
                // ترتيب الحضانة: KG1, KG2, KG3
                const nurseryOrder = { 'KG1': 1, 'KG2': 2, 'KG3': 3 };
                const orderA = nurseryOrder[levelA] || 999;
                const orderB = nurseryOrder[levelB] || 999;
                if (orderA !== orderB) return orderA - orderB;
            } else {
                // ترتيب الكورس: 1, 2, 3, 4, 5, 6
                const numA = parseInt(levelA) || 999;
                const numB = parseInt(levelB) || 999;
                if (numA !== numB) return numA - numB;
            }
            
            // 3. ترتيب أبجدي حسب الاسم داخل نفس المستوى
            return a.student.childName.localeCompare(b.student.childName, 'ar');
        });
        
        // حساب الإحصائيات من البيانات المطبوعة فعليًا
        const printStats = {
            total: sortedFiltered.length,
            paid: sortedFiltered.filter(r => r.isPaid).length,
            unpaid: sortedFiltered.filter(r => !r.isPaid).length,
            totalAmount: sortedFiltered.filter(r => r.isPaid).reduce((s, r) => s + r.amount, 0),
        };
        const printCollectionRate = sortedFiltered.length > 0 ? Math.round((printStats.paid / sortedFiltered.length) * 100) : 0;
        
        // تحديد نص الفلتر للعرض
        let filterDisplayText = '';
        if (filterType === 'Nursery') {
            filterDisplayText = 'حضانة';
            if (filterLevel !== 'all') {
                filterDisplayText += ' - ' + filterLevel;
            }
        } else if (filterType === 'Course') {
            filterDisplayText = 'كورس';
            if (filterLevel !== 'all') {
                filterDisplayText += ' - الصف ' + (filterLevel === '1' ? 'الأول' : 
                                                    filterLevel === '2' ? 'الثاني' : 
                                                    filterLevel === '3' ? 'الثالث' : 
                                                    filterLevel === '4' ? 'الرابع' : 
                                                    filterLevel === '5' ? 'الخامس' : 
                                                    filterLevel === '6' ? 'السادس' : filterLevel);
            }
        }
        
        // تقسيم البيانات: 14 في الصفحة الأولى، 21 في الثانية، 20 في الباقي
        const firstPageCount = 14;
        const secondPageCount = 21;
        const otherPagesCount = 20;
        
        const firstPageData = sortedFiltered.slice(0, firstPageCount);
        const secondPageData = sortedFiltered.slice(firstPageCount, firstPageCount + secondPageCount);
        const remainingData = sortedFiltered.slice(firstPageCount + secondPageCount);
        
        // تقسيم الباقي على صفحات
        const otherPages = [];
        for (let i = 0; i < remainingData.length; i += otherPagesCount) {
            otherPages.push(remainingData.slice(i, i + otherPagesCount));
        }

const printContent = `
  <style>
    @page { size: A4; margin: 0; }
    @media print{ @page {margin: 0;}}
    body { margin: 0; padding: 0; }
    .page { width: 210mm; min-height: 297mm; background: white; padding: 15mm 12mm 20mm 12mm; box-sizing: border-box; page-break-after: always; position: relative; }
    .page-no-header { padding-top: 10mm; }
    .page:last-child { page-break-after: auto; }
    .footer { position: absolute; bottom: 10mm; left: 12mm; right: 12mm; border-top: 1px solid #eee; padding-top: 8px; display: flex; justify-content: space-between; font-size: 8px; color: #bbb; }
    .table-wrapper { margin-bottom: 15mm; }
  </style>

  <!-- الصفحة الأولى مع الهيدر -->
  <div class="page">
    <!-- HEADER -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:2px solid #1a1a2e;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:65px;height:65px;border-radius:50%;border:2px solid #1a1a2e;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;overflow:hidden;">
          <img src="/NurseryLogo.png" alt="logo" onerror="this.style.display='none';this.parentElement.innerHTML='🌸'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
        </div>
        <div>
          <div style="font-size:26px;font-weight:900;color:#1a1a2e;line-height:1.1;">حضانة الأمل</div>
          <div style="font-size:11px;color:#777;margin-top:3px;">نظام إدارة الحضانة</div>
        </div>
      </div>
      <div style="text-align:center;border:1.5px solid #1a1a2e;padding:10px 16px;border-radius:4px;min-width:130px;">
        <div style="font-size:14px;font-weight:700;color:#1a1a2e;">رسوم شهرية</div>
        <div style="font-size:13px;font-weight:600;color:#1a1a2e;margin-top:4px;">${months[selectedMonth - 1]} ${selectedYear}</div>
        ${filterDisplayText ? `<div style="font-size:11px;color:#667eea;margin-top:4px;font-weight:600;">${filterDisplayText}</div>` : ''}
      </div>
    </div>

    <!-- STATS -->
    <div style="display:flex;border:1.5px solid #ddd;border-radius:4px;overflow:hidden;margin-bottom:14px;">
      <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 10px;border-left:1.5px solid #ddd;">
        <div style="font-size:22px;font-weight:900;color:#1a1a2e;">${printStats.total}</div>
        <div style="font-size:11px;color:#666;">إجمالي الطلاب</div>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 10px;border-left:1.5px solid #ddd;">
        <div style="font-size:22px;font-weight:900;color:#15803d;">${printStats.paid}</div>
        <div style="font-size:11px;color:#666;">تم الدفع</div>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 10px;">
        <div style="font-size:22px;font-weight:900;color:#b91c1c;">${printStats.unpaid}</div>
        <div style="font-size:11px;color:#666;">لم يدفع </div>
      </div>
    </div>

    <!-- AMOUNT BOX -->
    <div style="background:#1a1a2e;color:white;padding:10px 20px;border-radius:4px;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:0.5px;margin-bottom:6px;">إجمالي المبالغ المحصّلة</div>
        <div style="font-size:24px;font-weight:900;line-height:1;letter-spacing:-1px;">${printStats.totalAmount.toLocaleString()}</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.7);margin-top:4px;">جنيه مصري</div>
      </div>
      <div style="text-align:left;font-size:11px;color:rgba(255,255,255,0.6);line-height:2;">
        نسبة التحصيل<br>
        <span style="color:white;font-weight:700;">${printCollectionRate}٪</span>
      </div>
    </div>

    <!-- TABLE TITLE -->
    <div style="font-size:11px;letter-spacing:1.5px;color:#999;font-weight:700;margin-bottom:8px;">تفاصيل الطلاب</div>

    <!-- TABLE للصفحة الأولى -->
    <div class="table-wrapper">
    <table style="width:100%;border-collapse:collapse;font-size:12.5px;border:1px solid #ddd;">
      <thead>
        <tr style="background:#1a1a2e;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
          <th style="padding:5px 10px;text-align:center;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);width:40px;">#</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);">اسم الطالب</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);">النوع</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);">المستوى</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);">المبلغ</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;">الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${firstPageData.map((row, i) => {
          const isLastInLevel = i < firstPageData.length - 1 && 
            (firstPageData[i].student.studentType !== firstPageData[i + 1].student.studentType ||
             firstPageData[i].student.studentLevel !== firstPageData[i + 1].student.studentLevel);
          
          return `
          <tr style="border-bottom:${isLastInLevel ? '2px solid #1a1a2e' : '1px solid #ebebeb'};${i % 2 === 1 ? 'background:#fafafa;' : ''}">
            <td style="padding:9px 12px;text-align:center;color:#999;font-size:11px;border-left:1px solid #f0f0f0;">${i + 1}</td>
            <td style="padding:9px 12px;font-weight:700;border-left:1px solid #f0f0f0;">${row.student.childName}</td>
            <td style="padding:9px 12px;text-align:center;border-left:1px solid #f0f0f0;">
              ${row.student.studentType === 'Nursery'
                ? '<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:600;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;-webkit-print-color-adjust:exact;print-color-adjust:exact;">حضانة</span>'
                : '<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:600;border:1px solid #fde68a;background:#fffbeb;color:#b45309;-webkit-print-color-adjust:exact;print-color-adjust:exact;">كورس</span>'
              }
            </td>
            <td style="padding:9px 12px;text-align:center;color:#555;border-left:1px solid #f0f0f0;">${row.student.studentLevel || '—'}</td>
            <td style="padding:9px 12px;text-align:center;font-weight:700;color:#1a1a2e;border-left:1px solid #f0f0f0;">${row.amount > 0 ? row.amount.toLocaleString() + ' ج' : '—'}</td>
            <td style="padding:9px 12px;text-align:center;font-size:11.5px;font-weight:700;color:${row.isPaid ? '#15803d' : '#b91c1c'};">
              ${row.isPaid ? ' ✅ تم الدفع' : '🚫 لم يدفع'}
            </td>
          </tr>
        `}).join('')}
      </tbody>
    </table>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <span>حضانة الأمل — نظام إدارة الحضانة</span>
      <span>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')} — ${new Date().toLocaleTimeString('ar-EG')}</span>
    </div>
  </div>

  ${secondPageData.length > 0 ? `
  <!-- الصفحة الثانية - 21 طالب -->
  <div class="page page-no-header">
    <!-- TABLE بدون هيدر -->
    <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-top:0;border:1px solid #ddd;">
      <thead>
        <tr style="background:#1a1a2e;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
          <th style="padding:5px 10px;text-align:center;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);width:40px;">#</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);">اسم الطالب</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);">النوع</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);">المستوى</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);">المبلغ</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;">الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${secondPageData.map((row, i) => {
          const isLastInLevel = i < secondPageData.length - 1 && 
            (secondPageData[i].student.studentType !== secondPageData[i + 1].student.studentType ||
             secondPageData[i].student.studentLevel !== secondPageData[i + 1].student.studentLevel);
          
          return `
          <tr style="border-bottom:${isLastInLevel ? '2px solid #1a1a2e' : '1px solid #ebebeb'};${i % 2 === 1 ? 'background:#fafafa;' : ''}">
            <td style="padding:9px 12px;text-align:center;color:#999;font-size:11px;border-left:1px solid #f0f0f0;">${firstPageCount + i + 1}</td>
            <td style="padding:9px 12px;font-weight:700;border-left:1px solid #f0f0f0;">${row.student.childName}</td>
            <td style="padding:9px 12px;text-align:center;border-left:1px solid #f0f0f0;">
              ${row.student.studentType === 'Nursery'
                ? '<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:600;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;-webkit-print-color-adjust:exact;print-color-adjust:exact;">حضانة</span>'
                : '<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:600;border:1px solid #fde68a;background:#fffbeb;color:#b45309;-webkit-print-color-adjust:exact;print-color-adjust:exact;">كورس</span>'
              }
            </td>
            <td style="padding:9px 12px;text-align:center;color:#555;border-left:1px solid #f0f0f0;">${row.student.studentLevel || '—'}</td>
            <td style="padding:9px 12px;text-align:center;font-weight:700;color:#1a1a2e;border-left:1px solid #f0f0f0;">${row.amount > 0 ? row.amount.toLocaleString() + ' ج' : '—'}</td>
            <td style="padding:9px 12px;text-align:center;font-size:11.5px;font-weight:700;color:${row.isPaid ? '#15803d' : '#b91c1c'};">
              ${row.isPaid ? ' ✅ تم الدفع' : '🚫 لم يدفع'}
            </td>
          </tr>
        `}).join('')}
      </tbody>
    </table>

    <!-- FOOTER -->
    <div class="footer">
      <span>حضانة الأمل — نظام إدارة الحضانة</span>
      <span>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')} — ${new Date().toLocaleTimeString('ar-EG')}</span>
    </div>
  </div>
  ` : ''}

  ${otherPages.map((pageData, pageIndex) => `
  <!-- صفحة ${pageIndex + 3} -->
  <div class="page page-no-header">
    <!-- TABLE بدون هيدر -->
    <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-top:0;border:1px solid #ddd;">
      <thead>
        <tr style="background:#1a1a2e;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
          <th style="padding:5px 10px;text-align:center;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);width:40px;">#</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);">اسم الطالب</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);">النوع</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);">المستوى</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;border-left:1px solid rgba(255,255,255,0.1);">المبلغ</th>
          <th style="padding:5px 10px;text-align:right;color:white;font-weight:600;font-size:10px;">الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${pageData.map((row, i) => {
          const isLastInLevel = i < pageData.length - 1 && 
            (pageData[i].student.studentType !== pageData[i + 1].student.studentType ||
             pageData[i].student.studentLevel !== pageData[i + 1].student.studentLevel);
          
          return `
          <tr style="border-bottom:${isLastInLevel ? '2px solid #1a1a2e' : '1px solid #ebebeb'};${i % 2 === 1 ? 'background:#fafafa;' : ''}">
            <td style="padding:9px 12px;text-align:center;color:#999;font-size:11px;border-left:1px solid #f0f0f0;">${firstPageCount + secondPageCount + (pageIndex * otherPagesCount) + i + 1}</td>
            <td style="padding:9px 12px;font-weight:700;border-left:1px solid #f0f0f0;">${row.student.childName}</td>
            <td style="padding:9px 12px;text-align:center;border-left:1px solid #f0f0f0;">
              ${row.student.studentType === 'Nursery'
                ? '<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:600;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;-webkit-print-color-adjust:exact;print-color-adjust:exact;">حضانة</span>'
                : '<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:600;border:1px solid #fde68a;background:#fffbeb;color:#b45309;-webkit-print-color-adjust:exact;print-color-adjust:exact;">كورس</span>'
              }
            </td>
            <td style="padding:9px 12px;text-align:center;color:#555;border-left:1px solid #f0f0f0;">${row.student.studentLevel || '—'}</td>
            <td style="padding:9px 12px;text-align:center;font-weight:700;color:#1a1a2e;border-left:1px solid #f0f0f0;">${row.amount > 0 ? row.amount.toLocaleString() + ' ج' : '—'}</td>
            <td style="padding:9px 12px;text-align:center;font-size:11.5px;font-weight:700;color:${row.isPaid ? '#15803d' : '#b91c1c'};">
              ${row.isPaid ? ' ✅ تم الدفع' : '🚫 لم يدفع'}
            </td>
          </tr>
        `}).join('')}
      </tbody>
    </table>

    <!-- FOOTER -->
    <div class="footer">
      <span>حضانة الأمل — نظام إدارة الحضانة</span>
      <span>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')} — ${new Date().toLocaleTimeString('ar-EG')}</span>
    </div>
  </div>
  `).join('')}
`;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
            <style>
              * { margin:0; padding:0; box-sizing:border-box; }
              html, body { direction:rtl; font-family:'Cairo',Arial,sans-serif; background:white; color:#1a1a1a; }
            </style>
          </head>
          <body>${printContent}</body>
          </html>
        `);
        doc.close();
        
        setTimeout(() => {
            iframe.contentWindow.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 300);
    };

    if (error) {
        return (<div className="card text-center py-12"><AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" /><p className="text-gray-700 dark:text-gray-300 mb-3">{error}</p><button onClick={fetchAll} className="btn btn-primary"><RefreshCw className="w-4 h-4" /> {t('dashboard.retry')}</button></div>);
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('fees.title')}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('fees.subtitle')}</p>
                </div>
                <button
                    onClick={printFeeReport}
                    className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                    <Printer className="w-4 h-4" />
                    <span className="inline">طباعة التقرير الشهري</span>
                </button>
            </div>

            {/* Month/Year Selector */}
            <div className="card mb-4 !p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    <div className="relative col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-2">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder={t('filters.searchByName')} className="input !pr-10 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="input !py-2 text-xs">
                        {Array.from({ length: 12 }, (_, i) => (<option key={i} value={i + 1}>{t(`months.${i + 1}`)}</option>))}
                    </select>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="input !py-2 text-xs">
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select className="input !py-2 text-xs" value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterLevel('all'); }}>
                        <option value="all">{t('filters.allTypes')}</option>
                        <option value="Nursery">{t('filters.nursery')}</option>
                        <option value="Course">{t('filters.course')}</option>
                    </select>
                    <select className="input !py-2 text-xs" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} disabled={filterType === 'all'}>
                        {filterType === 'all' && <option value="all">{t('filters.selectType')}</option>}
                        {filterType === 'Nursery' && (
                            <>
                                <option value="all">{t('filters.allClasses')}</option>
                                <option value="KG1">KG1</option>
                                <option value="KG2">KG2</option>
                                <option value="KG3">KG3</option>
                            </>
                        )}
                        {filterType === 'Course' && (
                            <>
                                <option value="all">{t('filters.allGrades')}</option>
                                <option value="1">{t('filters.gradeFirst')}</option>
                                <option value="2">{t('filters.gradeSecond')}</option>
                                <option value="3">{t('filters.gradeThird')}</option>
                                <option value="4">{t('filters.gradeFourth')}</option>
                                <option value="5">{t('filters.gradeFifth')}</option>
                                <option value="6">{t('filters.gradeSixth')}</option>
                            </>
                        )}
                    </select>
                    <select className="input !py-2 text-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">{t('filters.selectPaymentStatus')}</option>
                        <option value="paid">{t('filters.payer')}</option>
                        <option value="unpaid">{t('filters.nonPayer')}</option>
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
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.val}</p>
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
                                                <button onClick={() => printMonthlyFee(row)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-600 rounded-lg" title="طباعة الفاتورة">
                                                    <Printer className="w-4 h-4" />
                                                </button>
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
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => printMonthlyFee(row)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors" title="طباعة الفاتورة">
                                                <Printer className="w-5 h-5" />
                                            </button>
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