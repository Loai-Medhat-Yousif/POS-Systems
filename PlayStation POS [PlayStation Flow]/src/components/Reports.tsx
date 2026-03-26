import { useStore } from '../store';
import { calculateSessionCost, formatCurrency, formatDuration } from '../utils';
import { isToday, isThisWeek, isThisMonth, format, subDays, startOfDay, isWithinInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar, CalendarDays, CalendarRange, TrendingUp, Gamepad2, CupSoda, PieChart as PieIcon, BarChart3, Printer } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useState } from 'react';
import InvoiceTemplate from './InvoiceTemplate';

export default function Reports() {
  const { sessions, devices, settings, products } = useStore();
  const [printingSession, setPrintingSession] = useState<{ sessionId: string, deviceId: string } | null>(null);
  
  const completedSessions = sessions.filter(s => s.status === 'completed' && s.endTime);

  const handleReprint = (sessionId: string, deviceId: string) => {
    setPrintingSession({ sessionId, deviceId });
    setTimeout(() => {
      window.print();
      setPrintingSession(null);
    }, 100);
  };

  const calculateStats = (filteredSessions: typeof sessions) => {
    let totalRevenue = 0;
    let timeRevenue = 0;
    let ordersRevenue = 0;
    let totalPlayTime = 0;

    filteredSessions.forEach(session => {
      const device = devices.find(d => d.id === session.deviceId);
      if (!device) return;
      
      const cost = calculateSessionCost(session, device);
      totalRevenue += cost.total;
      timeRevenue += cost.timeCost;
      ordersRevenue += cost.ordersCost;
      totalPlayTime += (session.endTime! - session.startTime);
    });

    return { totalRevenue, timeRevenue, ordersRevenue, totalPlayTime, sessionsCount: filteredSessions.length };
  };

  const dailyStats = calculateStats(completedSessions.filter(s => isToday(s.endTime!)));
  const weeklyStats = calculateStats(completedSessions.filter(s => isThisWeek(s.endTime!)));
  const monthlyStats = calculateStats(completedSessions.filter(s => isThisMonth(s.endTime!)));

  // Charts Data Preparation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    const daySessions = completedSessions.filter(s => 
      isWithinInterval(s.endTime!, { 
        start: startOfDay(date), 
        end: new Date(startOfDay(date).getTime() + 86399999) 
      })
    );
    const stats = calculateStats(daySessions);
    return {
      name: format(date, 'eee', { locale: ar }),
      revenue: stats.totalRevenue,
      date: format(date, 'yyyy-MM-dd')
    };
  }).reverse();

  const pieData = [
    { name: 'إيرادات اللعب', value: monthlyStats.timeRevenue, color: '#3b82f6' },
    { name: 'إيرادات الكافيه', value: monthlyStats.ordersRevenue, color: '#a855f7' }
  ];

  const StatCard = ({ title, stats, icon: Icon, colorClass }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-100 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{stats.sessionsCount} جلسة لعب</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">إجمالي الإيرادات</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Gamepad2 className="w-3 h-3"/> إيرادات اللعب</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(stats.timeRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><CupSoda className="w-3 h-3"/> إيرادات الكافيه</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(stats.ordersRevenue)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">تقارير PlayStation Flow</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">نظرة عامة على أداء المقهى وإيراداته.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="تقرير اليوم" 
          stats={dailyStats} 
          icon={Calendar} 
          colorClass="bg-gradient-to-br from-blue-500 to-blue-600" 
        />
        <StatCard 
          title="تقرير الأسبوع" 
          stats={weeklyStats} 
          icon={CalendarDays} 
          colorClass="bg-gradient-to-br from-purple-500 to-purple-600" 
        />
        <StatCard 
          title="تقرير الشهر" 
          stats={monthlyStats} 
          icon={CalendarRange} 
          colorClass="bg-gradient-to-br from-indigo-500 to-indigo-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Area Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">إيرادات آخر 7 أيام</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '12px', 
                    color: '#f8fafc' 
                  }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <PieIcon className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">توزيع إيرادات الشهر</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '12px', 
                    color: '#f8fafc' 
                  }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-blue-100 dark:border-slate-800 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">أحدث الجلسات المكتملة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-blue-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              <tr>
                <th className="p-4 font-medium">الجهاز</th>
                <th className="p-4 font-medium">التاريخ والوقت</th>
                <th className="p-4 font-medium">مدة اللعب</th>
                <th className="p-4 font-medium">الطلبات</th>
                <th className="p-4 font-medium">الإجمالي</th>
                <th className="p-4 font-medium text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {completedSessions.slice().reverse().slice(0, 10).map(session => {
                const device = devices.find(d => d.id === session.deviceId);
                const cost = device ? calculateSessionCost(session, device) : { total: 0 };
                return (
                  <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{device?.name || 'جهاز محذوف'}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {format(session.endTime!, 'PPp', { locale: ar })}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {formatDuration(session.endTime! - session.startTime)}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {session.orders.length > 0 ? `${session.orders.length} طلبات` : 'لا يوجد'}
                    </td>
                    <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{formatCurrency(cost.total)}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleReprint(session.id, session.deviceId)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="إعادة طباعة الفاتورة"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {completedSessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">لا توجد جلسات مكتملة بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Invoice for Printing */}
      {printingSession && (() => {
        const session = sessions.find(s => s.id === printingSession.sessionId);
        const device = devices.find(d => d.id === printingSession.deviceId);
        if (!session || !device) return null;
        return <InvoiceTemplate session={session} device={device} settings={settings} products={products} />;
      })()}
    </div>
  );
}
