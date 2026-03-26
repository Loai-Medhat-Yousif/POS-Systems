
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Calendar, Building, Receipt, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbService, PurchaseInvoice, PurchaseItem, formatDate } from "@/lib/db";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface NewItem {
  product_name: string;
  quantity: number;
  cost: number;
}

const PurchaseInvoices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [selectedItems, setSelectedItems] = useState<PurchaseItem[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState({ supplier: "", invoice_ref: "", date: "" });
  const [items, setItems] = useState<NewItem[]>([{ product_name: "", quantity: 0, cost: 0 }]);

  const { data: invoices = [], isLoading } = useQuery<PurchaseInvoice[]>({
    queryKey: ["purchase-invoices"],
    queryFn: () => dbService.getPurchaseInvoices(),
  });

  const addMutation = useMutation({
    mutationFn: () => {
      const validItems = items.filter((i) => i.product_name && i.quantity > 0);
      const total = validItems.reduce((s, i) => s + i.cost * i.quantity, 0);
      return dbService.addPurchaseInvoice(invoiceData.supplier, invoiceData.invoice_ref, total, validItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم حفظ فاتورة الشراء بنجاح" });
      setIsAddOpen(false);
      setInvoiceData({ supplier: "", invoice_ref: "", date: "" });
      setItems([{ product_name: "", quantity: 0, cost: 0 }]);
    },
    onError: () => toast({ title: "فشل حفظ الفاتورة", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dbService.deletePurchaseInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      toast({ title: "تم حذف الفاتورة بنجاح" });
      setIsDetailOpen(false);
    },
    onError: () => toast({ title: "فشل حذف الفاتورة", variant: "destructive" }),
  });

  const openDetail = async (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    const invItems = await dbService.getPurchaseItems(invoice.id);
    setSelectedItems(invItems);
    setIsDetailOpen(true);
  };

  const addItem = () => setItems([...items, { product_name: "", quantity: 0, cost: 0 }]);
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (index: number, field: keyof NewItem, value: any) =>
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const calculateTotal = () => items.reduce((s, i) => s + i.cost * i.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceData.supplier || !invoiceData.invoice_ref) {
      toast({ title: "يرجى ملء جميع بيانات الفاتورة", variant: "destructive" });
      return;
    }
    const validItems = items.filter((i) => i.product_name && i.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: "يرجى إضافة منتج واحد على الأقل", variant: "destructive" });
      return;
    }
    addMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <FileText className="w-6 h-6" /> فواتير الشراء
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">إجمالي الفواتير: {invoices.length} فاتورة</p>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Plus className="w-4 h-4 mr-2" /> إضافة فاتورة شراء
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة فاتورة شراء جديدة</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>رقم الفاتورة *</Label>
                      <Input value={invoiceData.invoice_ref} onChange={(e) => setInvoiceData({ ...invoiceData, invoice_ref: e.target.value })} placeholder="INV-001" required />
                    </div>
                    <div>
                      <Label>المورد *</Label>
                      <Input value={invoiceData.supplier} onChange={(e) => setInvoiceData({ ...invoiceData, supplier: e.target.value })} placeholder="اسم المورد" required />
                    </div>
                    <div>
                      <Label>تاريخ الفاتورة</Label>
                      <Input type="date" value={invoiceData.date} onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-lg font-semibold">بنود الفاتورة</Label>
                      <Button type="button" variant="outline" onClick={addItem}><Plus className="w-4 h-4 mr-2" /> إضافة بند</Button>
                    </div>
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <Card key={index} className="p-4 bg-blue-50 border-blue-200">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <div>
                              <Label>اسم المنتج</Label>
                              <Input value={item.product_name} onChange={(e) => updateItem(index, "product_name", e.target.value)} placeholder="اسم المنتج" />
                            </div>
                            <div>
                              <Label>الكمية</Label>
                              <Input type="number" value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)} placeholder="0" />
                            </div>
                            <div>
                              <Label>سعر الشراء</Label>
                              <Input type="number" step="0.01" value={item.cost} onChange={(e) => updateItem(index, "cost", parseFloat(e.target.value) || 0)} placeholder="0.00" />
                            </div>
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(index)} disabled={items.length === 1}>حذف</Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center text-lg font-bold">
                    <span>إجمالي الفاتورة:</span>
                    <span className="text-blue-600">{calculateTotal().toFixed(2)} جنيه</span>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500" disabled={addMutation.isPending}>
                      {addMutation.isPending ? "جاري الحفظ..." : "حفظ الفاتورة"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>إلغاء</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Receipt className="w-5 h-5" /> قائمة فواتير الشراء ({invoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-gray-400 py-8">جاري التحميل...</p>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد فواتير شراء حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="border-blue-200 hover:shadow-md transition-all cursor-pointer" onClick={() => openDetail(invoice)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-blue-600 border-blue-300">{invoice.invoice_ref}</Badge>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(invoice.created_at)}</div>
                          <div className="flex items-center gap-1"><Building className="w-4 h-4" />{invoice.supplier}</div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-blue-600">{invoice.total.toFixed(2)} جنيه</div>
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

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> تفاصيل فاتورة الشراء {selectedInvoice?.invoice_ref}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div><span className="text-sm text-gray-600">رقم الفاتورة</span><p className="font-semibold">{selectedInvoice.invoice_ref}</p></div>
                <div><span className="text-sm text-gray-600">المورد</span><p className="font-semibold">{selectedInvoice.supplier}</p></div>
                <div><span className="text-sm text-gray-600">التاريخ</span><p className="font-semibold">{formatDate(selectedInvoice.created_at)}</p></div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">سعر الشراء</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>{item.cost.toFixed(2)} جنيه</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="font-semibold">{(item.cost * item.quantity).toFixed(2)} جنيه</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t pt-4 flex justify-between items-center text-xl font-bold">
                <span>المبلغ الإجمالي:</span>
                <span className="text-blue-600">{selectedInvoice.total.toFixed(2)} جنيه</span>
              </div>
              <div className="flex gap-2">
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
                        سيتم حذف فاتورة الشراء بشكل نهائي من قاعدة البيانات.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(selectedInvoice.id)}>
                        حذف
                      </AlertDialogAction>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="flex-1">إغلاق</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseInvoices;
