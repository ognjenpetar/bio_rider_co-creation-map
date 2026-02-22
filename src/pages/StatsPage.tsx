import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { Header } from '../components/common/Header';
import { SkeletonStats } from '../components/common/SkeletonLoader';
import { PageTransition, FadeIn } from '../components/common/PageTransition';
import { getLocations } from '../lib/api/locations';
import type { Location } from '../types';

const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export function StatsPage() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLocations().then(data => {
      setLocations(data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const uniqueUsers = new Set(locations.map(l => l.created_by).filter(Boolean));

    // Locations by user
    const byUser: Record<string, number> = {};
    locations.forEach(l => {
      const user = l.created_by || 'Unknown';
      byUser[user] = (byUser[user] || 0) + 1;
    });
    const userChartData = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Locations by month
    const byMonth: Record<string, number> = {};
    locations.forEach(l => {
      const date = new Date(l.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    const monthChartData = Object.entries(byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    // Cumulative growth
    let cumulative = 0;
    const growthData = monthChartData.map(d => {
      cumulative += d.count;
      return { ...d, cumulative };
    });

    // Recent locations
    const recent = [...locations].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 10);

    // This month count
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthCount = byMonth[thisMonthKey] || 0;

    // Pie chart data for user distribution
    const pieData = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    return {
      total: locations.length,
      uniqueUsers: uniqueUsers.size,
      thisMonthCount,
      userChartData,
      monthChartData,
      growthData,
      pieData,
      recent,
    };
  }, [locations]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonStats />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('stats.title')}</h1>

          {/* Overview cards with animated counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { value: stats.total, label: t('stats.totalLocations'), color: 'green', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
              { value: stats.uniqueUsers, label: t('stats.activeUsers'), color: 'blue', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
              { value: stats.thisMonthCount, label: t('stats.thisMonth'), color: 'purple', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            ].map((card, i) => (
              <FadeIn key={card.label} delay={i * 0.1}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-${card.color}-100 rounded-lg flex items-center justify-center`}>
                      <svg className={`w-6 h-6 text-${card.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                      </svg>
                    </div>
                    <div>
                      <motion.p
                        className="text-3xl font-bold text-gray-900"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        {card.value}
                      </motion.p>
                      <p className="text-sm text-gray-500">{card.label}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Locations by user - Bar Chart */}
            <FadeIn delay={0.2}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('stats.byUser')}</h2>
                {stats.userChartData.length === 0 ? (
                  <p className="text-gray-400 text-sm">{t('stats.noData')}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.userChartData} layout="vertical" margin={{ left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                      <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </FadeIn>

            {/* User distribution - Pie Chart */}
            <FadeIn delay={0.3}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('stats.userDistribution')}</h2>
                {stats.pieData.length === 0 ? (
                  <p className="text-gray-400 text-sm">{t('stats.noData')}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={(props: any) => `${props.name ?? ''} (${((props.percent ?? 0) * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {stats.pieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth over time - Area Chart */}
            <FadeIn delay={0.4}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('stats.growth')}</h2>
                {stats.growthData.length === 0 ? (
                  <p className="text-gray-400 text-sm">{t('stats.noData')}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={stats.growthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      <defs>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="cumulative" stroke="#8b5cf6" fill="url(#colorGrowth)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </FadeIn>

            {/* Monthly activity - Bar Chart */}
            <FadeIn delay={0.5}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('stats.byMonth')}</h2>
                {stats.monthChartData.length === 0 ? (
                  <p className="text-gray-400 text-sm">{t('stats.noData')}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.monthChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </FadeIn>

            {/* Recent activity */}
            <FadeIn delay={0.6}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('stats.recentActivity')}</h2>
                {stats.recent.length === 0 ? (
                  <p className="text-gray-400 text-sm">{t('stats.noData')}</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {stats.recent.map((loc, i) => (
                      <motion.div
                        key={loc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.05 }}
                        className="py-3 flex items-center gap-4"
                      >
                        {loc.preview_image_url ? (
                          <img src={loc.preview_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{loc.name}</p>
                          <p className="text-xs text-gray-500">
                            {loc.created_by || 'Unknown'} &middot; {new Date(loc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
