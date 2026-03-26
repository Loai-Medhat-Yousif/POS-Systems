
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, FileText, Calendar, Trash2, Printer, Download, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbService, Sale, SaleItem, formatDate } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const SalesInvoices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["sales"],
    queryFn: () => dbService.getSales(),
  });

  const { data: settings = { shop_name: 'Pos Flow', shop_address: 'العنوان هنا' } } = useQuery({
    queryKey: ['settings'],
    queryFn: () => dbService.getSettings(),
  });

  const openSale = async (sale: Sale) => {
    setSelectedSale(sale);
    const items = await dbService.getSaleItems(sale.id);
    setSaleItems(items);
    setIsDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dbService.deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast({ title: "تم حذف الفاتورة بنجاح" });
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "فشل حذف الفاتورة", variant: "destructive" }),
  });
  
  const handlePrint = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.print();
    } else {
      window.print();
    }
  };

  const handleExportBackup = async () => {
    if ((window as any).electronAPI) {
      try {
        toast({ title: "جاري تحضير نسخة احتياطية..." });
        const salesData = await dbService.getSales();
        const saleItemsData: any[] = [];
        for (const sale of salesData) {
          const items = await dbService.getSaleItems(sale.id);
          saleItemsData.push(...items);
        }
        
        const backup = JSON.stringify({ sales: salesData, sale_items: saleItemsData }, null, 2);
        const success = await (window as any).electronAPI.saveFile(
          backup,
          `pos_backup_${new Date().toISOString().slice(0, 10)}.json`,
          [{ name: 'Backup File (JSON)', extensions: ['json'] }]
        );
        
        if (success) {
          toast({ title: "تم تصدير النسخة الاحتياطية بنجاح" });
        }
      } catch (error) {
        console.error("Backup error:", error);
        toast({ title: "فشل تصدير النسخة الاحتياطية", variant: "destructive" });
      }
    }
  };

  const handleExportAllCSV = async () => {
    if ((window as any).electronAPI) {
      try {
        toast({ title: "جاري تصدير البيانات..." });
        
        // Header
        let csv = "\uFEFF"; // UTF-8 BOM for Excel
        csv += "رقم الفاتورة,التاريخ,إجمالي المبلغ,المنتجات\n";
        
        for (const sale of sales) {
          const items = await dbService.getSaleItems(sale.id);
          const itemsStr = items.map(i => `${i.name} (${i.quantity}x${i.price})`).join(" | ");
          csv += `${sale.invoice_number},${formatDate(sale.created_at)},${sale.total},"${itemsStr}"\n`;
        }
        
        const success = await (window as any).electronAPI.saveFile(
          csv, 
          `sales_report_${new Date().toISOString().slice(0,10)}.csv`,
          [{ name: 'CSV (Excel)', extensions: ['csv'] }]
        );
        
        if (success) {
          toast({ title: "تم التصدير بنجاح" });
        }
      } catch (error) {
        console.error("Export error:", error);
        toast({ title: "فشل التصدير", variant: "destructive" });
      }
    }
  };

  const handleImportBackup = async () => {
    if ((window as any).electronAPI) {
      try {
        const content = await (window as any).electronAPI.openFile([
          { name: 'Backup File (JSON)', extensions: ['json'] }
        ]);
        
        if (content) {
          const data = JSON.parse(content);
          if (data.sales && data.sale_items) {
            toast({ title: "جاري استيراد البيانات..." });
            await dbService.restoreBackup(data);
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            toast({ title: "تم استيراد البيانات بنجاح" });
          } else {
            toast({ title: "ملف غير صالح", variant: "destructive" });
          }
        }
      } catch (error) {
        console.error("Import error:", error);
        toast({ title: "فشل الاستيراد", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <FileText className="w-6 h-6" /> فواتير المبيعات
          </CardTitle>
          <p className="text-sm text-gray-600">إجمالي الفواتير: {sales.length} فاتورة</p>
          <div className="mt-4 flex gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => handleExportAllCSV()} className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100">
              <Download className="w-4 h-4 mr-2" /> تصدير الكل (Excel)
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportBackup()} className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
              <Download className="w-4 h-4 mr-2" /> تصدير نسخة احتياطية (JSON)
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleImportBackup()} className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100">
              <Plus className="w-4 h-4 mr-2" /> استيراد نسخة احتياطية
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Receipt className="w-5 h-5" /> قائمة الفواتير ({sales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-gray-400 py-8">جاري التحميل...</p>
          ) : sales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد فواتير مبيعات حتى الآن</p>
              <p className="text-sm mt-2">ستظهر الفواتير هنا بعد إتمام عمليات البيع</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((sale) => (
                <Card
                  key={sale.id}
                  className="border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => openSale(sale)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {sale.invoice_number}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(sale.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{sale.total.toFixed(2)} جنيه</div>
                        <Button variant="ghost" size="sm" className="mt-1">عرض التفاصيل</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" /> تفاصيل الفاتورة {selectedSale?.invoice_number}
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">رقم الفاتورة</span>
                  <p className="font-semibold">{selectedSale.invoice_number}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">التاريخ</span>
                  <p className="font-semibold">{formatDate(selectedSale.created_at)}</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.price.toFixed(2)} جنيه</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="font-semibold">{(item.price * item.quantity).toFixed(2)} جنيه</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t pt-4 flex justify-between items-center text-xl font-bold">
                <span>المبلغ الإجمالي:</span>
                <span className="text-blue-600">{selectedSale.total.toFixed(2)} جنيه</span>
              </div>
              <div className="flex gap-2 pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      <Trash2 className="w-4 h-4 mr-2" /> حذف الفاتورة
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        سيتم حذف الفاتورة بشكل نهائي من قاعدة البيانات.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(selectedSale.id)}>
                        حذف
                      </AlertDialogAction>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="default" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" /> طباعة
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>إغلاق</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden Printable Invoice (Visible only during print via CSS) */}
      {selectedSale && (
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
              <span>Check# {selectedSale.invoice_number.slice(-6)}</span>
            </div>
            <div className="text-left font-mono">
              {formatDate(selectedSale.created_at)}
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
              {saleItems.map((item, idx) => (
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
              <span className="font-mono">EGP {selectedSale.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>VAT(0.0%)</span>
              <span className="font-mono">EGP 0.00</span>
            </div>
            <div className="flex justify-between font-bold text-xl pt-2 mt-2 border-t">
              <span>Total</span>
              <span className="font-mono">EGP {selectedSale.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="font-bold">Products Count {saleItems.reduce((acc, item) => acc + item.quantity, 0)}</p>
            <p className="text-sm italic mt-4">شكراً لزيارتكم!</p>
            <p className="text-[10px] text-gray-400 mt-4 tracking-tighter uppercase">Powered by Pos Flow</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesInvoices;
