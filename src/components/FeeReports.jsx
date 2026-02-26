import { useState, useEffect } from 'react';
import { feesAPI } from '../services/api';
import { Users, Printer } from 'lucide-react';
import { handleApiError } from '../utils/helpers';

const FeeReports = ({ selectedMonth, selectedYear, filterStatus }) => {
  const [loading, setLoading] = useState(false);
  const [studentsPaid, setStudentsPaid] = useState([]);

  const months = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // تحميل البيانات تلقائياً عند تغيير الشهر أو السنة
  useEffect(() => {
    handleGetStudentsWhoPaid();
  }, [selectedMonth, selectedYear]);

  const handleGetStudentsWhoPaid = async () => {
    try {
      setLoading(true);
      const response = await feesAPI.getStudentsWhoPaid(selectedMonth, selectedYear);
      setStudentsPaid(response.data);
    } catch (error) {
      handleApiError(error, 'فشل في جلب الطلاب');
    } finally {
      setLoading(false);
    }
  };

  // فلترة البيانات حسب حالة الدفع
  const filteredStudents = studentsPaid.filter(s => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'paid') return s.paymentStatus === 'Paid';
    if (filterStatus === 'unpaid') return s.paymentStatus === 'NotPaid';
    return true;
  });

  const printStudentsPaid = () => {
    if (filteredStudents.length === 0) return;
    const total = filteredStudents.reduce((sum, s) => sum + s.amountPaid, 0);
    const w = window.open('', '_blank');
    w.document.body.innerHTML = `
      <div style="font-family:Arial;max-width:900px;margin:40px auto;padding:30px;border:2px solid #333;direction:rtl">
        <div style="text-align:center;border-bottom:2px solid #333;padding-bottom:20px;margin-bottom:30px">
          <img src="/NurseryLogo.png" alt="حضانة الأمل" style="width:80px;height:80px;object-fit:cover;border-radius:50%;margin:0 auto 15px" />
          <h1 style="margin:0 0 10px">حضانة الأمل</h1>
          <p style="margin:0;color:#666">تقرير الدفع الشهري - ${months[selectedMonth - 1]} ${selectedYear}</p>
          <div style="display:inline-block;margin-top:15px;padding:10px 25px;background:#667eea;color:white;border-radius:20px;font-weight:bold">
            ${filterStatus === 'all' ? 'جميع الطلاب' : filterStatus === 'paid' ? 'الطلاب الذين دفعوا' : 'الطلاب الذين لم يدفعوا'}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px">
          <div style="background:#667eea;color:white;padding:25px;text-align:center;border-radius:15px">
            <div style="font-size:14px;margin-bottom:10px">عدد الطلاب</div>
            <div style="font-size:40px;font-weight:bold">${filteredStudents.length}</div>
          </div>
          <div style="background:#667eea;color:white;padding:25px;text-align:center;border-radius:15px">
            <div style="font-size:14px;margin-bottom:10px">إجمالي المبالغ</div>
            <div style="font-size:40px;font-weight:bold">${total.toLocaleString()}</div>
            <div style="font-size:16px;margin-top:5px">جنيه</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;border:2px solid #ddd">
          <thead style="background:#333;color:white">
            <tr>
              <th style="padding:12px;text-align:right;border:1px solid #333">#</th>
              <th style="padding:12px;text-align:right;border:1px solid #333">اسم الطالب</th>
              <th style="padding:12px;text-align:right;border:1px solid #333">المبلغ</th>
              <th style="padding:12px;text-align:right;border:1px solid #333">التاريخ</th>
              <th style="padding:12px;text-align:right;border:1px solid #333">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map((s, i) => `
              <tr style="border-bottom:1px solid #ddd;${i % 2 === 0 ? 'background:#f9f9f9' : ''}">
                <td style="padding:10px;border:1px solid #ddd">${i + 1}</td>
                <td style="padding:10px;border:1px solid #ddd;font-weight:bold">${s.studentName}</td>
                <td style="padding:10px;border:1px solid #ddd;color:#667eea;font-weight:bold">${s.amountPaid.toLocaleString()} جنيه</td>
                <td style="padding:10px;border:1px solid #ddd">${new Date(s.paymentDate).toLocaleDateString('ar-EG')}</td>
                <td style="padding:10px;border:1px solid #ddd;font-weight:bold;color:${s.paymentStatus === 'Paid' ? '#10b981' : '#ef4444'}">
                  ${s.paymentStatus === 'Paid' ? '✓ مدفوع' : '✗ غير مدفوع'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align:center;margin-top:30px;padding-top:20px;border-top:2px solid #333;color:#666;font-size:13px">
          <p>التاريخ: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}</p>
          <p>حضانة الأمل - نظام إدارة الحضانة ❤️</p>
        </div>
      </div>
    `;
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="space-y-6">
      {/* الطلاب الذين دفعوا */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تقارير الطلاب</h3>
          </div>
          <button onClick={printStudentsPaid} disabled={filteredStudents.length === 0} className="btn btn-primary !py-2 !px-4 !text-sm flex items-center gap-2 whitespace-nowrap">
            <Printer className="w-4 h-4" />طباعة
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">جاري التحميل...</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">اسم الطالب</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">المبلغ المدفوع</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">تاريخ الدفع</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{student.studentName}</td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">{student.amountPaid} ج.م</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(student.paymentDate).toLocaleDateString('ar-EG')}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={student.paymentStatus === 'Paid' ? 'pill-paid' : 'pill-unpaid'}>
                          {student.paymentStatus === 'Paid' ? 'مدفوع' : 'غير مدفوع'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">إجمالي: {filteredStudents.length} طالب</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد بيانات للعرض</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeReports;
