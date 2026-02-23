import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, GraduationCap, DollarSign, Wallet, TrendingUp } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, color, loading, path }) => {
  const navigate = useNavigate();
  return (
    <div
      className="card-stat cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
      onClick={() => path && navigate(path)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      </div>
      {loading ? (
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-20 animate-pulse"></div>
      ) : (
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value?.toLocaleString() || 0}
        </p>
      )}
    </div>
  );
};

const StatsCards = ({ stats, profitData, loading }) => {
  const { t } = useTranslation();

  const cards = [
    { icon: Users, title: t('dashboard.totalStudents'), value: stats?.totalStudents, color: 'bg-blue-600', path: '/students' },
    { icon: UserCheck, title: t('dashboard.nurseryStudents'), value: stats?.nurseryStudentCount, color: 'bg-pink-600', path: '/students' },
    { icon: GraduationCap, title: t('dashboard.courseStudents'), value: stats?.courseStudentCount, color: 'bg-violet-600', path: '/students' },
    { icon: DollarSign, title: t('dashboard.monthlyFees'), value: profitData?.totalFees, color: 'bg-emerald-600', path: '/fees' },
    { icon: Wallet, title: t('dashboard.monthlySalaries'), value: profitData?.totalSalaries, color: 'bg-amber-600', path: '/salaries' },
    { icon: TrendingUp, title: t('dashboard.netProfit'), value: profitData?.netProfit, color: 'bg-teal-600', path: '/reports' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} loading={loading} />
      ))}
    </div>
  );
};

export default StatsCards;
