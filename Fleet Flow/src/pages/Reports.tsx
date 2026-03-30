import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download } from 'lucide-react';
import {
  format, startOfDay, endOfDay, subDays, subWeeks, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
} from 'date-fns';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
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

export default function Reports() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [period, setPeriod] = useState<Period>('daily');

  // Daily table data (existing)
  const reportData = useLiveQuery(async () => {
    const start = startOfDay(new Date(selectedDate)).getTime();
    const end = endOfDay(new Date(selectedDate)).getTime();

    const orders = await db.orders
      .where('createdAt')
      .between(start, end)
      .toArray();

    const drivers = await db.drivers.toArray();

    const deliveredOrders = orders.filter(o => o.status === 'Delivered');
    const failedOrders = orders.filter(o => o.status === 'Failed');

    const totalRevenue = deliveredOrders.reduce((sum, order) => {
      return sum + (order.cashCollected || (order.paymentType === 'Cash' ? order.deliveryFee : 0));
    }, 0);

    const driverSummary = drivers.map(driver => {
      const driverOrders = orders.filter(o => o.driverId === driver.id);
      const driverDelivered = driverOrders.filter(o => o.status === 'Delivered');

      const expectedCash = driverDelivered.reduce((sum, order) => {
        return sum + (order.paymentType === 'Cash' ? order.deliveryFee : 0);
      }, 0);

      const collectedCash = driverDelivered.reduce((sum, order) => {
        return sum + (order.cashCollected || 0);
      }, 0);

      return {
        driverName: driver.name,
        ordersCount: driverOrders.length,
        deliveredCount: driverDelivered.length,
        expectedCash,
        collectedCash,
        difference: collectedCash - expectedCash,
      };
    }).filter(d => d.ordersCount > 0);

    return {
      totalOrders: orders.length,
      delivered: deliveredOrders.length,
      failed: failedOrders.length,
      totalRevenue,
      driverSummary,
    };
  }, [selectedDate]);

  // Chart data
  const ranges = useMemo(() => getPeriodRanges(period), [period]);

  const chartData = useLiveQuery(async () => {
    const allOrders = await db.orders.toArray();
    return ranges.map(range => {
      const ordersInRange = allOrders.filter(
        o => o.createdAt >= range.start && o.createdAt <= range.end
      );
      const delivered = ordersInRange.filter(o => o.status === 'Delivered');
      const failed = ordersInRange.filter(o => o.status === 'Failed');
      const revenue = delivered.reduce((sum, order) => {
        return sum + (order.cashCollected || (order.paymentType === 'Cash' ? order.deliveryFee : 0));
      }, 0);

      return {
        name: range.label,
        delivered: delivered.length,
        failed: failed.length,
        revenue,
      };
    });
  }, [ranges]);

  const exportToCsv = () => {
    if (!reportData) return;

    const headers = ['Driver Name', 'Total Orders', 'Delivered', 'Expected Cash', 'Collected Cash', 'Difference'];
    const rows = reportData.driverSummary.map(d => [
      d.driverName,
      d.ordersCount,
      d.deliveredCount,
      d.expectedCash,
      d.collectedCash,
      d.difference,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fleet_report_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const periodButtons: Period[] = ['daily', 'weekly', 'monthly'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#1F3B61]">{t('reports.title')}</h2>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button onClick={exportToCsv} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t('reports.exportCsv')}
          </Button>
        </div>
      </div>

      {reportData && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.totalOrders')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalOrders}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.delivered')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{reportData.delivered}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.failed')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{reportData.failed}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.revenue')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.totalRevenue.toLocaleString()} {t('common.egp')}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Period Toggle */}
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
              {/* Delivered vs Failed */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-[#1F3B61]">
                    {t('charts.deliveredVsFailed')}
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
                      <Bar
                        dataKey="delivered"
                        name={t('charts.delivered')}
                        fill="#22c55e"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="failed"
                        name={t('charts.failed')}
                        fill="#ef4444"
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
                    <LineChart data={chartData}>
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
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name={t('charts.revenue')}
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Driver Summary Table - daily filtered */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle>{t('reports.driverSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('drivers.name')}</TableHead>
                    <TableHead className="text-center">{t('reports.totalOrders')}</TableHead>
                    <TableHead className="text-center">{t('reports.delivered')}</TableHead>
                    <TableHead className="text-right">{t('reports.expectedCash')}</TableHead>
                    <TableHead className="text-right">{t('reports.collectedCash')}</TableHead>
                    <TableHead className="text-right">{t('reports.difference')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.driverSummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No data for selected date.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData.driverSummary.map((driver, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{driver.driverName}</TableCell>
                        <TableCell className="text-center">{driver.ordersCount}</TableCell>
                        <TableCell className="text-center">{driver.deliveredCount}</TableCell>
                        <TableCell className="text-right">{driver.expectedCash} {t('common.egp')}</TableCell>
                        <TableCell className="text-right">{driver.collectedCash} {t('common.egp')}</TableCell>
                        <TableCell className={`text-right font-medium ${driver.difference < 0 ? 'text-red-500' : driver.difference > 0 ? 'text-green-500' : ''}`}>
                          {driver.difference > 0 ? '+' : ''}{driver.difference} {t('common.egp')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
