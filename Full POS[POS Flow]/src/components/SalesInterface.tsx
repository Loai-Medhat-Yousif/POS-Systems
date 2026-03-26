
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Barcode, Plus, Minus, Trash2, Printer, Receipt, Edit2, Package, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { dbService, Product, formatDate } from "@/lib/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CartItem extends Product {
  quantity: number;
}

const SalesInterface = () => {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saleForPrinting, setSaleForPrinting] = useState<{ invoice_number: string, items: CartItem[], total: number, date: string } | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  // Real-time products fetching
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => dbService.getProducts(),
  });

  const { data: settings = { shop_name: 'Pos Flow', shop_address: 'العنوان هنا' } } = useQuery({
    queryKey: ['settings'],
    queryFn: () => dbService.getSettings(),
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    toast({
      title: "تم إضافة المنتج",
      description: `تم إضافة ${product.name} إلى السلة`,
    });
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const updatePrice = (id: string, newPrice: number) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, price: newPrice } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      setBarcode("");
    } else {
      toast({
        title: "المنتج غير موجود",
        description: "لم يتم العثور على منتج بهذا الباركود",
        variant: "destructive"
      });
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const invoiceNumber = `INV-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${now.getTime().toString().slice(-4)}`;
      await dbService.saveSale(invoiceNumber, calculateTotal(), cart);
      return { invoiceNumber, date: now.toISOString(), items: [...cart], total: calculateTotal() };
    },
    onSuccess: (data) => {
      toast({
        title: "تمت عملية البيع بنجاح",
        description: `تم حفظ الفاتورة بنجاح في قاعدة البيانات المحلية`,
      });
      setSaleForPrinting({
        invoice_number: data.invoiceNumber,
        items: data.items,
        total: data.total,
        date: data.date
      });
      setIsPrintDialogOpen(true);
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error) => {
      toast({
        title: "فشل في إتمام البيع",
        description: "حدث خطأ أثناء حفظ الفاتورة",
        variant: "destructive"
      });
    }
  });

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "السلة فارغة",
        description: "يرجى إضافة منتجات إلى السلة أولاً",
        variant: "destructive"
      });
      return;
    }
    checkoutMutation.mutate();
  };

  const handlePrint = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.print();
    } else {
      window.print();
    }
    setIsPrintDialogOpen(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/40 backdrop-blur-md border-white/40 shadow-xl shadow-blue-900/5 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3 text-blue-900 font-extrabold">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-md">
                  <Barcode className="w-4 h-4" />
                </div>
                قارئ الباركود الذكي
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
                <div className="relative flex-1 group/input">
                  <Input
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="امسح الباركود أو اكتبه هنا..."
                    className="h-14 bg-white/50 border-blue-100/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-center font-mono text-xl rounded-2xl transition-all"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within/input:text-blue-600">
                    <Barcode className="w-5 h-5" />
                  </div>
                </div>
                <Button type="submit" className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                  إضافة سريعة
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Search className="w-5 h-5" />
                المنتجات المتاحة
              </CardTitle>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن المنتجات..."
                className="mt-2"
              />
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <div className="w-20 h-20 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mb-6">
                    <Package className="w-10 h-10" />
                  </div>
                  <p className="text-gray-400 font-medium text-lg">لا توجد منتجات مسجلة حالياً</p>
                  <p className="text-gray-300 text-sm mt-1">قم بإضافة منتجات من علامة تبويب المنتجات</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredProducts.map((product) => (
                    <Card 
                      key={product.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-blue-100 hover:border-blue-300"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4 text-center">
                        <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
                        <p className="text-lg font-bold text-blue-600 mb-2">{product.price} جنيه</p>
                        <Badge variant="secondary" className="text-xs">
                          متوفر: {product.stock}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100 sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Receipt className="w-5 h-5" />
                سلة المشتريات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">السلة فارغة</p>
              ) : (
                <>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map((item) => (
                      <div key={item.id} className="group relative flex flex-col p-4 bg-white/50 backdrop-blur-sm border border-blue-100/50 rounded-2xl gap-3 transition-all hover:bg-white hover:shadow-lg hover:shadow-blue-500/5">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800 leading-tight">{item.name}</h4>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">السعر</span>
                              <div className="flex items-center gap-1 bg-blue-50/50 px-2 py-0.5 rounded-lg border border-blue-100/50">
                                <Input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                                  className="w-16 h-6 text-xs px-1 bg-transparent border-none focus-visible:ring-0 font-bold text-blue-700"
                                />
                                <span className="text-[10px] font-bold text-blue-400">جنيه</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-white hover:text-blue-600 rounded-lg transition-all"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>
                            <span className="w-8 text-center font-black text-slate-700 text-sm">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-white hover:text-blue-600 rounded-lg transition-all"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                          <div className="text-xs font-bold text-slate-400">
                            المجموع: <span className="text-slate-800">{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>الإجمالي:</span>
                      <span className="text-blue-600">{calculateTotal().toFixed(2)} جنيه</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        onClick={handleCheckout}
                        disabled={checkoutMutation.isPending}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        {checkoutMutation.isPending ? "جاري الحفظ..." : "إتمام البيع"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Confirmation Dialog */}
      <AlertDialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تمت عملية البيع بنجاح</AlertDialogTitle>
            <AlertDialogDescription>
              رقم الفاتورة: {saleForPrinting?.invoice_number}
              <br />
              هل تريد طباعة الفاتورة الآن؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> طباعة
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setIsPrintDialogOpen(false)}>إغلاق</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden Printable Invoice (Visible only during print via CSS) */}
      {saleForPrinting && (
        <div className="printable-invoice">
          <div className="text-center mb-4 pb-4 border-b">
            <h1 className="text-3xl font-bold uppercase tracking-widest">{settings.shop_name}</h1>
            <p className="text-sm mt-1">{settings.shop_address}</p>
          </div>
          
          <div className="space-y-1 mb-4 text-xs">
            <div className="text-center text-gray-600">
              Printed At: {new Date().toLocaleString()}
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span>Pick Up</span>
              <span>Check# {saleForPrinting.invoice_number.slice(-6)}</span>
            </div>
            <div className="text-left font-mono">
              {formatDate(saleForPrinting.date)}
            </div>
          </div>

          <table className="w-full mb-4 text-right border-t border-b border-dashed">
            <thead>
              <tr className="border-b border-dashed">
                <th className="py-2 text-right">Qty Item</th>
                <th className="py-2 text-left">Price</th>
              </tr>
            </thead>
            <tbody>
              {saleForPrinting.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1">
                    <span className="font-bold mr-2">{item.quantity}</span>
                    {item.name}
                  </td>
                  <td className="py-1 text-left font-mono">EGP {item.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 border-b border-dashed pb-2 mb-4">
            <div className="flex justify-between font-bold">
              <span>Subtotal</span>
              <span className="font-mono">EGP {saleForPrinting.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>VAT(0.0%)</span>
              <span className="font-mono">EGP 0.00</span>
            </div>
            <div className="flex justify-between font-bold text-xl pt-2 mt-2 border-t">
              <span>Total</span>
              <span className="font-mono">EGP {saleForPrinting.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="font-bold">Products Count {saleForPrinting.items.reduce((acc, item) => acc + item.quantity, 0)}</p>
            <p className="text-sm italic mt-4">شكراً لزيارتكم!</p>
            <p className="text-[10px] text-gray-400 mt-4 tracking-tighter uppercase">Powered by Pos Flow</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesInterface;
