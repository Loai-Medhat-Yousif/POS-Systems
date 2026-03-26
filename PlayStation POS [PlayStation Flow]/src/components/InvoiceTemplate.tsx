import { Device, Product, Session, Settings } from '../types';
import { calculateSessionCost, formatCurrency, formatDuration } from '../utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface InvoiceTemplateProps {
  session: Session;
  device: Device;
  settings: Settings;
  products: Product[];
  onAfterPrint?: () => void;
}

export default function InvoiceTemplate({ session, device, settings, products }: InvoiceTemplateProps) {
  const cost = calculateSessionCost(session, device);
  const totalOrders = session.orders.reduce((acc, order) => acc + (order.priceAtTime * order.quantity), 0);
  const totalItemsCount = session.orders.reduce((acc, order) => acc + order.quantity, 0);
  const vatAmount = 0; // Assuming 0% VAT as per current implementation
  const finalTotal = cost.total + vatAmount;

  return (
    <div id="invoice-print-area" className="hidden print:block bg-white text-black font-sans dir-rtl text-right w-[80mm] mx-auto p-4 select-none">
      {/* Header with enhanced branding */}
      <div className="text-center mb-6">
        {/* Decorative header border */}
        <div className="w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 mb-4 rounded-full"></div>
        
        {/* Shop Name with enhanced typography */}
        <div className="mb-2">
          <h1 className="text-5xl font-extrabold text-blue-800 leading-tight tracking-tight">
            {settings.shopName}
          </h1>
        </div>
        
        {/* Shop Details */}
        <div className="space-y-1 mb-2">
          <p className="text-lg font-semibold text-slate-700">{settings.shopAddress}</p>
        </div>
        
        {/* Subtitle */}
        <p className="text-xs text-slate-500 font-medium tracking-wide">PLAYSTATION & GAMING CENTER</p>
        
        <div className="w-full h-px bg-slate-300 my-4"></div>
      </div>

      {/* Invoice Header Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-600">رقم الفاتورة</span>
          <span className="text-sm font-mono font-bold text-blue-700">#{session.id.slice(0, 8).toUpperCase()}</span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-600">نوع الجلسة</span>
          <span className="text-sm font-semibold">
            {session.isMultiplayer ? 'زوجي/مالتي' : 'فردي'} • {device.name}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-600">تاريخ الطباعة</span>
          <span className="text-xs font-mono text-slate-700">
            {format(new Date(), 'dd/MM/yyyy - HH:mm:ss')}
          </span>
        </div>
      </div>

      {/* Session Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-blue-700">مدة الجلسة</span>
          <span className="text-sm font-mono font-bold text-blue-800">
            {formatDuration((session.endTime || Date.now()) - session.startTime)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-blue-700">عدد الدراعات</span>
          <span className="text-sm font-semibold text-blue-800">{session.controllersCount} جهاز تحكم</span>
        </div>
      </div>

      {/* Items Table Header */}
      <div className="border-b-2 border-slate-800 pb-2 mb-3">
        <div className="flex justify-between font-bold text-sm">
          <span className="w-1/3 text-left font-mono">السعر</span>
          <span className="w-2/3 text-right">الكمية • المنتج</span>
        </div>
      </div>

      {/* Items List with enhanced styling */}
      <div className="space-y-3 mb-4">
        {/* Time Cost Item */}
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <span className="w-1/3 text-left font-mono font-bold text-lg text-blue-700">
            EGP {cost.timeCost.toFixed(2)}
          </span>
          <div className="w-2/3 flex gap-3 justify-end items-center">
            <span className="w-8 text-center font-mono font-bold text-blue-700">1</span>
            <span className="text-right font-semibold text-blue-700 flex-1">تكلفة الوقت (Time Cost)</span>
          </div>
        </div>

        {/* Orders Items */}
        {session.orders.map((order, idx) => {
          const product = products.find(p => p.id === order.productId);
          return (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="w-1/3 text-left font-mono font-bold text-lg">
                EGP {(order.priceAtTime * order.quantity).toFixed(2)}
              </span>
              <div className="w-2/3 flex gap-3 justify-end items-center">
                <span className="w-8 text-center font-mono font-bold">{order.quantity}</span>
                <span className="text-right font-semibold flex-1">
                  {product?.name || `منتج #${order.productId}`}
                </span>
              </div>
            </div>
          );
        })}

        {/* Empty state if no orders */}
        {session.orders.length === 0 && (
          <div className="text-center py-4 text-slate-400 font-medium border border-slate-200 rounded-lg">
            لا توجد طلبات كافيه
          </div>
        )}
      </div>

      {/* Totals Section with enhanced styling */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-600">المجموع الفرعي</span>
          <span className="font-mono font-bold text-slate-800">EGP {cost.total.toFixed(2)}</span>
        </div>

        {/* VAT */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-600">الضريبة (VAT 0%)</span>
          <span className="font-mono font-bold text-slate-800">EGP 0.00</span>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-slate-300 my-2"></div>

        {/* Final Total */}
        <div className="flex justify-between items-center bg-white border-2 border-slate-800 rounded-lg p-3">
          <div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">الإجمالي النهائي</span>
            <div className="text-xs text-slate-500">Total Amount Due</div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono text-slate-900">EGP {finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer with enhanced styling */}
      <div className="mt-6 space-y-4">
        {/* Products Count */}
        <div className="text-center">
          <span className="inline-block bg-slate-100 border border-slate-300 px-4 py-2 rounded-full text-sm font-mono font-bold text-slate-700">
            إجمالي المنتجات: {totalItemsCount}
          </span>
        </div>

        {/* Thank You Message */}
        <div className="text-center">
          <p className="text-2xl font-black text-blue-800 leading-tight mb-2">{settings.footerMessage}</p>
          <p className="text-xs text-slate-500 font-medium">نشكركم لاختياركم مركزنا للألعاب</p>
        </div>

        {/* Payment Info */}
        <div className="text-center space-y-1">
          <p className="text-xs text-slate-400 font-mono">Payment Method: CASH</p>
          <p className="text-xs text-slate-400 font-mono">No Refunds • No Exchanges</p>
        </div>

        {/* Footer Border */}
        <div className="w-full h-px bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 my-4"></div>
      </div>
    </div>
  );
}
