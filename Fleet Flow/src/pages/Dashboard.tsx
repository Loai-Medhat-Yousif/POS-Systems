import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Truck, 
  CircleCheck, 
  DollarSign, 
  Download, 
  Upload,
  AlertCircle 
} from 'lucide-react';
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

  // --- Export Logic ---
  const handleExport = async () => {
    try {
      const drivers = await db.drivers.toArray();
      const orders = await db.orders.toArray();
      
      const data = {
        drivers,
        orders,
        exportDate: new Date().toISOString(),
        version: "1.0"
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fleetflow_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data");
    }
  };

  // --- Import Logic ---
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmOverwrite = window.confirm(
      "Importing will delete all current data and replace it with the file data. Continue?"
    );
    if (!confirmOverwrite) {
      event.target.value = ''; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        if (!json.drivers || !json.orders) {
          throw new Error("Invalid format: Missing drivers or orders tables.");
        }

        // Perform atomic replacement
        await db.transaction('rw', db.drivers, db.orders, async () => {
          await db.drivers.clear();
          await db.orders.clear();
          await db.drivers.bulkAdd(json.drivers);
          await db.orders.bulkAdd(json.orders);
        });

        alert("Data imported successfully!");
        window.location.reload(); // Refresh to update all hooks
      } catch (error) {
        console.error("Import failed:", error);
        alert("Import failed. Ensure the file is a valid FleetFlow JSON backup.");
      }
    };
    reader.readAsText(file);
  };

  // --- Statistics Queries ---
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
      {/* Header with Export/Import */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-[#1F3B61]">{t('nav.dashboard')}</h2>
        
        <div className="flex items-center gap-2">
          {/* Export */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            {t('common.export', 'Export')}
          </Button>

          {/* Import */}
          <div className="relative">
            <input
              type="file"
              id="import-db"
              className="hidden"
              accept=".json"
              onChange={handleImport}
            />
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="cursor-pointer border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <label htmlFor="import-db" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t('common.import', 'Import')}
              </label>
            </Button>
          </div>
        </div>
      </div>

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