
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ShoppingCart, Package, DollarSign, FileText, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dbService } from "@/lib/db";

type Period = "day" | "week" | "month";

const PERIOD_LABELS: Record<Period, string> = {
  day: "اليوم",
  week: "الأسبوع",
  month: "الشهر",
};

const StatCard = ({
  title, value, icon: Icon, bg,
}: { title: string; value: string; icon: any; bg: string }) => (
  <Card className="bg-white border-2 border-blue-100 shadow-md">
    <CardContent className="p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bg} flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{title}</p>
        <p className="text-xl font-black text-gray-800">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const ReportsSection = () => {
  const [period, setPeriod] = useState<Period>("week");

  const { data: salesSummary = [] } = useQuery({
    queryKey: ["sales-summary"],
    queryFn: () => dbService.getSalesSummary(),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ["top-products"],
    queryFn: () => dbService.getTopProducts(),
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: () => dbService.getPurchaseInvoices(),
  });

  // ── Filter sales by selected period ───────────────────────────
  const now = new Date();
  const filteredSales = salesSummary.filter((d) => {
    const date = new Date(d.date);
    if (period === "day") {
      return date.toDateString() === now.toDateString();
    } else if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    } else {
      const monthAgo = new Date(now);
      monthAgo.setDate(now.getDate() - 30);
      return date >= monthAgo;
    }
  });

  const filteredPurchases = purchases.filter((p) => {
    const date = new Date(p.created_at);
    if (period === "day") {
      return date.toDateString() === now.toDateString();
    } else if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    } else {
      const monthAgo = new Date(now);
      monthAgo.setDate(now.getDate() - 30);
      return date >= monthAgo;
    }
  });

  const totalSales = filteredSales.reduce((s, d) => s + d.total, 0);
  const totalInvoices = filteredSales.reduce((s, d) => s + d.count, 0);
  const totalPurchases = filteredPurchases.reduce((s, p) => s + p.total, 0);
  const netProfit = totalSales - totalPurchases;

  const chartData = filteredSales
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      date: period === "month" ? d.date.slice(5) : d.date.slice(8),
      total: parseFloat(d.total.toFixed(2)),
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-blue-800">التقارير والإحصائيات</h2>

        {/* Period Tabs */}
        <div className="flex bg-blue-50 border-2 border-blue-100 rounded-xl p-1 gap-1">
          {(["day", "week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                period === p
                  ? "bg-blue-600 text-white shadow"
                  : "text-blue-600 hover:bg-blue-100"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={`إجمالي المبيعات (${PERIOD_LABELS[period]})`} value={`${totalSales.toFixed(2)} جنيه`} icon={TrendingUp} bg="bg-blue-600" />
        <StatCard title={`عدد الفواتير (${PERIOD_LABELS[period]})`} value={totalInvoices.toString()} icon={FileText} bg="bg-indigo-500" />
        <StatCard title={`إجمالي المشتريات (${PERIOD_LABELS[period]})`} value={`${totalPurchases.toFixed(2)} جنيه`} icon={ShoppingCart} bg="bg-green-600" />
        <StatCard title="صافي الربح (تقديري)" value={`${netProfit.toFixed(2)} جنيه`} icon={DollarSign} bg={netProfit >= 0 ? "bg-green-500" : "bg-red-500"} />
      </div>

      {/* Bar Chart */}
      <Card className="bg-white border-2 border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <TrendingUp className="w-5 h-5" />
            مبيعات {PERIOD_LABELS[period]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد بيانات مبيعات في هذه الفترة</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFF6FF" />
                <XAxis dataKey="date" tick={{ fill: "#3B82F6", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "8px" }}
                  formatter={(v) => [`${v} جنيه`, "المبيعات"]}
                />
                <Bar dataKey="total" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card className="bg-white border-2 border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Package className="w-5 h-5" /> المنتجات الأكثر مبيعاً (كل الوقت)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>لا توجد بيانات مبيعات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="text-right font-bold text-blue-800">المنتج</TableHead>
                  <TableHead className="text-right font-bold text-blue-800">الكمية المباعة</TableHead>
                  <TableHead className="text-right font-bold text-blue-800">إجمالي الإيرادات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((item, i) => (
                  <TableRow key={i} className="hover:bg-blue-50/50">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-green-600 font-bold">{item.total_qty}</TableCell>
                    <TableCell className="font-semibold text-blue-600">{item.total_revenue.toFixed(2)} جنيه</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Daily Summary */}
      {filteredSales.length > 0 && (
        <Card className="bg-white border-2 border-green-100 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Calendar className="w-5 h-5" /> ملخص المبيعات — {PERIOD_LABELS[period]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead className="text-right font-bold text-green-800">التاريخ</TableHead>
                  <TableHead className="text-right font-bold text-green-800">عدد الفواتير</TableHead>
                  <TableHead className="text-right font-bold text-green-800">إجمالي المبيعات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((row, i) => (
                  <TableRow key={i} className="hover:bg-green-50/50">
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="text-blue-600 font-bold">{row.count}</TableCell>
                    <TableCell className="font-semibold text-green-600">{row.total.toFixed(2)} جنيه</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsSection;
