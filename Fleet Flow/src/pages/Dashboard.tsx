import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Truck, CircleCheck, DollarSign } from 'lucide-react';
import {
  startOfDay, endOfDay, subDays, subWeeks, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, format,
} from 'date-fns';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type Period = 'daily' | 'weekly' | 'monthly';

function getPeriodRanges(period: Period) {
  const now = new Date();
  const ranges: { label: string; start: number; end: number }[] = [];

  if (period === 'daily') {
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      ranges.push({
        label: format(day, 'EEE dd'),
        start: startOfDay(day).getTime(),
        end: endOfDay(day).getTime(),
      });
    }
  } else if (period === 'weekly') {
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 6 });
      const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 6 });
      ranges.push({
        label: format(weekStart, 'dd/MM'),
        start: weekStart.getTime(),
        end: weekEnd.getTime(),
      });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      ranges.push({
        label: format(monthDate, 'MMM'),
        start: startOfMonth(monthDate).getTime(),
        end: endOfMonth(monthDate).getTime(),
      });
    }
  }

  return ranges;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('daily');

  const todayStart = startOfDay(new Date()).getTime();
  const todayEnd = endOfDay(new Date()).getTime();

  const stats = useLiveQuery(async () => {
    const todayOrders = await db.orders
      .where('createdAt')
      .between(todayStart, todayEnd)
      .toArray();

    const deliveredOrders = todayOrders.filter(o => o.status === 'Delivered');
    const pendingOrders = todayOrders.filter(o => o.status === 'Pending');

    const totalCash = deliveredOrders.reduce((sum, order) => {
      return sum + (order.cashCollected || (order.paymentType === 'Cash' ? order.deliveryFee : 0));
    }, 0);

    const activeDrivers = await db.drivers.where('status').equals('Available').count();

    return {
      totalOrders: todayOrders.length,
      deliveredOrders: deliveredOrders.length,
      pendingOrders: pendingOrders.length,
      totalCash,
      activeDrivers,
    };
  }, []);

  const ranges = useMemo(() => getPeriodRanges(period), [period]);

  const chartData = useLiveQuery(async () => {
    const allOrders = await db.orders.toArray();
    return ranges.map(range => {
      const ordersInRange = allOrders.filter(
        o => o.createdAt >= range.start && o.createdAt <= range.end
      );
      const delivered = ordersInRange.filter(o => o.status === 'Delivered');
      const revenue = delivered.reduce((sum, order) => {
        return sum + (order.cashCollected || (order.paymentType === 'Cash' ? order.deliveryFee : 0));
      }, 0);

      return {
        name: range.label,
        orders: ordersInRange.length,
        revenue,
        delivered: delivered.length,
        failed: ordersInRange.filter(o => o.status === 'Failed').length,
      };
    });
  }, [ranges]);

  if (!stats) return null;

  const periodButtons: Period[] = ['daily', 'weekly', 'monthly'];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-[#1F3B61]">{t('nav.dashboard')}</h2>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalOrders')}</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-[#1F3B61]/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-[#1F3B61]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.deliveredOrders')}</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <CircleCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.deliveredOrders}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.pendingOrders')}</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Package className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalCash')}</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalCash.toLocaleString()} {t('common.egp')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Toggle */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {periodButtons.map(p => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'ghost'}
            size="sm"
            className={period === p
              ? 'bg-[#1F3B61] text-white hover:bg-[#152a47] shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'}
            onClick={() => setPeriod(p)}
          >
            {t(`charts.${p}`)}
          </Button>
        ))}
      </div>

      {/* Charts */}
      {chartData && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Orders Trend */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#1F3B61]">
                {t('charts.ordersTrend')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend />
                  <defs>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1F3B61" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1F3B61" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <Bar
                    dataKey="orders"
                    name={t('charts.orders')}
                    fill="url(#ordersGradient)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#1F3B61]">
                {t('charts.revenueTrend')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} ${t('common.egp')}`, t('charts.revenue')]}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name={t('charts.revenue')}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
