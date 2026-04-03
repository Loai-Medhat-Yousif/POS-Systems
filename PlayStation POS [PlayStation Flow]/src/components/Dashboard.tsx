import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { formatDuration, calculateSessionCost, cn, formatCurrency } from '../utils';
import { Tv, Gamepad2, CupSoda, StopCircle, Plus, Clock, Users, User, Printer } from 'lucide-react';
import InvoiceTemplate from './InvoiceTemplate';

export default function Dashboard() {
  const { devices, sessions, products, settings, startSession, endSession, addOrderToSession, updateSessionControllers } = useStore();
  const [, setTick] = useState(0);

  // Modals state
  const [startingDevice, setStartingDevice] = useState<string | null>(null);
  const [orderingSession, setOrderingSession] = useState<string | null>(null);
  const [endingSession, setEndingSession] = useState<string | null>(null);
  const [lastEndedSession, setLastEndedSession] = useState<{ session: any, device: any } | null>(null);

  // Start Session Form
  const [isMulti, setIsMulti] = useState(false);
  const [controllers, setControllers] = useState(1);

  // Order Form
  const [selectedProduct, setSelectedProduct] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartSession = () => {
    if (startingDevice) {
      startSession(startingDevice, isMulti, controllers);
      setStartingDevice(null);
      setIsMulti(false);
      setControllers(1);
    }
  };

  const handleAddOrder = () => {
    if (orderingSession && selectedProduct) {
      addOrderToSession(orderingSession, selectedProduct, orderQuantity);
      setOrderingSession(null);
      setSelectedProduct('');
      setOrderQuantity(1);
    }
  };

  const handleEndSession = () => {
    if (endingSession) {
      const session = sessions.find(s => s.id === endingSession);
      const device = devices.find(d => d.id === session?.deviceId);
      if (session && device) {
        // Create a copy of the session as it will be at the end
        const finalSession = { 
          ...session, 
          status: 'completed' as const, 
          endTime: Date.now() 
        };
        setLastEndedSession({ session: finalSession, device });
        endSession(endingSession);
      }
      setEndingSession(null);
    }
  };

  const handlePrint = () => {
    window.print();
    setLastEndedSession(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">PlayStation Flow</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">متابعة حالة الأجهزة والجلسات الحالية.</p>
      </div>

      {devices.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {devices.map(device => {
            const activeSession = sessions.find(s => s.deviceId === device.id && s.status === 'active');
            const cost = activeSession ? calculateSessionCost(activeSession, device) : null;

            return (
              <div 
                key={device.id} 
                className={cn(
                  "rounded-2xl border overflow-hidden transition-all duration-300 shadow-sm",
                  activeSession 
                    ? "bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)] dark:shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
                    : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                )}
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900/20">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border",
                      activeSession ? "bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    )}>
                      <Tv className={cn("w-5 h-5", activeSession ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500")} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{device.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{device.room} • {device.type}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold border",
                    activeSession 
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 animate-pulse" 
                      : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  )}>
                    {activeSession ? 'مشغول' : 'متاح'}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 bg-white dark:bg-transparent">
                  {activeSession && cost ? (
                    <div className="space-y-5">
                      {/* Timer & Cost */}
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Clock className="w-4 h-4" /> الوقت المنقضي
                          </p>
                          <p className="text-3xl font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                            {formatDuration(Date.now() - activeSession.startTime)}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">الإجمالي</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(cost.total)}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-md">
                            {activeSession.isMultiplayer ? <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">النوع</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{activeSession.isMultiplayer ? 'زوجي' : 'فردي'}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-md">
                            <Gamepad2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">الدراعات</p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{activeSession.controllersCount}</p>
                              <div className="flex flex-col gap-0.5">
                                <button onClick={() => updateSessionControllers(activeSession.id, activeSession.controllersCount + 1)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white leading-none">+</button>
                                <button onClick={() => updateSessionControllers(activeSession.id, Math.max(1, activeSession.controllersCount - 1))} className="text-slate-400 hover:text-slate-900 dark:hover:text-white leading-none">-</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Orders Summary */}
                      {activeSession.orders.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                            <CupSoda className="w-3 h-3" /> طلبات الكافيه ({formatCurrency(cost.ordersCost)})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {activeSession.orders.map(order => {
                              const product = products.find(p => p.id === order.productId);
                              return product ? (
                                <span key={order.id} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300">
                                  {product.name} x{order.quantity}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => setOrderingSession(activeSession.id)}
                          className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> طلب
                        </button>
                        <button 
                          onClick={() => setEndingSession(activeSession.id)}
                          className="flex-1 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <StopCircle className="w-4 h-4" /> إنهاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
                        <Tv className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mb-6">الجهاز متاح الآن وجاهز للعب.</p>
                      <button 
                        onClick={() => setStartingDevice(device.id)}
                        className="w-full bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                      >
                        بدء جلسة جديدة
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Tv className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">لا توجد أجهزة مضافة</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
            ابدأ بإضافة الأجهزة والأسعار من صفحة "إدارة الأجهزة" لتتمكن من بدء الجلسات.
          </p>
        </div>
      )}

      {/* Start Session Modal */}
      {startingDevice && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full md:w-[600px] shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">بدء جلسة جديدة</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">نوع اللعب</label>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsMulti(false)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all",
                      !isMulti ? "bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                  >
                    <User className="w-5 h-5" /> فردي
                  </button>
                  <button 
                    onClick={() => setIsMulti(true)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all",
                      isMulti ? "bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                  >
                    <Users className="w-5 h-5" /> زوجي/مالتي
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">عدد الدراعات (أجهزة التحكم)</label>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2">
                  <button onClick={() => setControllers(Math.max(1, controllers - 1))} className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-white flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-600">-</button>
                  <span className="flex-1 text-center text-xl font-bold text-slate-900 dark:text-white">{controllers}</span>
                  <button onClick={() => setControllers(controllers + 1)} className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-white flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-600">+</button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setStartingDevice(null)}
                className="flex-1 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleStartSession}
                className="flex-1 py-3 bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                بدء اللعب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {orderingSession && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full md:w-[600px] shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">إضافة طلب للكافيه</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">المنتج</label>
                <select 
                  value={selectedProduct} 
                  onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                >
                  <option value="">اختر المنتج...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} - {formatCurrency(p.price)} {p.stock <= 0 ? '(نفذت الكمية)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">الكمية</label>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2">
                  <button onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))} className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-white flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-600">-</button>
                  <span className="flex-1 text-center text-xl font-bold text-slate-900 dark:text-white">{orderQuantity}</span>
                  <button onClick={() => setOrderQuantity(orderQuantity + 1)} className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-white flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-600">+</button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => { setOrderingSession(null); setSelectedProduct(''); }}
                className="flex-1 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleAddOrder}
                disabled={!selectedProduct}
                className="flex-1 py-3 bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
              >
                إضافة الطلب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Modal */}
      {endingSession && (() => {
        const session = sessions.find(s => s.id === endingSession);
        const device = devices.find(d => d.id === session?.deviceId);
        if (!session || !device) return null;
        const cost = calculateSessionCost(session, device);

        return (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">إنهاء الجلسة ؟</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">هل أنت متأكد من إنهاء جلسة {device.name}؟</p>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">تكلفة الوقت:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(cost.timeCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">إجمالي الكافيه:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(cost.ordersCost)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                  <span className="text-slate-900 dark:text-white font-bold text-lg">الإجمالي النهائي:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xl">{formatCurrency(cost.total)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setEndingSession(null)}
                  className="flex-1 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  تراجع
                </button>
                <button 
                  onClick={handleEndSession}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
                >
                  تأكيد الإنهاء
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Print Confirmation Modal */}
      {lastEndedSession && (() => {
        const { session, device } = lastEndedSession;

        return (
          <>
            <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-60 p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white dark:border-slate-800 shadow-lg">
                  <Printer className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">تم إنهاء الجلسة</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8">هل تريد طباعة فاتورة {device.name} الآن؟</p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handlePrint}
                    className="w-full py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Printer className="w-6 h-6" /> طباعة الفاتورة
                  </button>
                  <button 
                    onClick={() => setLastEndedSession(null)}
                    className="w-full py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                  >
                    إغلاق بدون طباعة
                  </button>
                </div>
              </div>
            </div>
            
            {/* Hidden Invoice for Printing */}
            <InvoiceTemplate 
              session={session} 
              device={device} 
              settings={settings} 
              products={products}
            />
          </>
        );
      })()}
    </div>
  );
}
