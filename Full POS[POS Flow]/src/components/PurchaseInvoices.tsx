import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Plus, Calendar, Building, Receipt, Trash2,
  Search, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft,
  Eye, TrendingUp, ShoppingCart, DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbService, PurchaseInvoice, PurchaseItem, formatDate } from "@/lib/db";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NewItem {
  product_name: string;
  quantity: number;
  cost: number;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const PurchaseInvoices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [selectedItems, setSelectedItems]     = useState<PurchaseItem[]>([]);
  const [isDetailOpen, setIsDetailOpen]       = useState(false);
  const [isAddOpen, setIsAddOpen]             = useState(false);
  const [searchTerm, setSearchTerm]           = useState("");
  const [currentPage, setCurrentPage]         = useState(1);
  const [pageSize, setPageSize]               = useState(10);
  const [invoiceData, setInvoiceData]         = useState({ supplier: "", invoice_ref: "", date: "" });
  const [items, setItems]                     = useState<NewItem[]>([{ product_name: "", quantity: 0, cost: 0 }]);

  // ── Data ──────────────────────────────────────────────────────
  const { data: invoices = [], isLoading } = useQuery<PurchaseInvoice[]>({
    queryKey: ["purchase-invoices"],
    queryFn: () => dbService.getPurchaseInvoices(),
  });

  // ── Derived ───────────────────────────────────────────────────
  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages    = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage      = Math.min(currentPage, totalPages);
  const pageStart     = (safePage - 1) * pageSize;
  const pagedInvoices = filtered.slice(pageStart, pageStart + pageSize);

  const grandTotal    = invoices.reduce((s, inv) => s + inv.total, 0);
  const avgInvoice    = invoices.length ? grandTotal / invoices.length : 0;

  const handleSearch = (v: string) => { setSearchTerm(v); setCurrentPage(1); };
  const handlePageSizeChange = (v: string) => { setPageSize(Number(v)); setCurrentPage(1); };

  // ── Mutations ─────────────────────────────────────────────────
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

  // ── Helpers ───────────────────────────────────────────────────
  const openDetail = async (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    const invItems = await dbService.getPurchaseItems(invoice.id);
    setSelectedItems(invItems);
    setIsDetailOpen(true);
  };

  const addItem    = () => setItems([...items, { product_name: "", quantity: 0, cost: 0 }]);
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

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-800">فواتير الشراء</h2>
          <p className="text-sm text-gray-500 mt-0.5">إدارة ومتابعة فواتير الموردين</p>
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

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base font-semibold">بنود الفاتورة</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-1" /> إضافة بند
                  </Button>
                </div>

                {/* Items table */}
                <div className="rounded-lg border border-blue-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50/60 hover:bg-blue-50/60">
                        <TableHead className="text-right text-blue-800 font-semibold">#</TableHead>
                        <TableHead className="text-right text-blue-800 font-semibold">اسم المنتج</TableHead>
                        <TableHead className="text-right text-blue-800 font-semibold w-32">الكمية</TableHead>
                        <TableHead className="text-right text-blue-800 font-semibold w-36">سعر الشراء</TableHead>
                        <TableHead className="text-right text-blue-800 font-semibold w-32">الإجمالي</TableHead>
                        <TableHead className="w-16" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index} className="hover:bg-blue-50/20">
                          <TableCell className="text-gray-400 text-sm">{index + 1}</TableCell>
                          <TableCell>
                            <Input
                              value={item.product_name}
                              onChange={(e) => updateItem(index, "product_name", e.target.value)}
                              placeholder="اسم المنتج"
                              className="h-8 border-gray-200"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity || ""}
                              onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="h-8 w-24 border-gray-200"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.cost || ""}
                              onChange={(e) => updateItem(index, "cost", parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="h-8 w-28 border-gray-200"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-blue-600 text-sm">
                              {(item.cost * item.quantity).toFixed(2)}
                              <span className="text-xs font-normal text-gray-500 mr-1">جنيه</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button" variant="ghost" size="sm"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Total row */}
                <div className="flex justify-between items-center mt-3 px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="font-semibold text-gray-700">إجمالي الفاتورة:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {calculateTotal().toFixed(2)}
                    <span className="text-sm font-normal text-gray-500 mr-1">جنيه</span>
                  </span>
                </div>
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

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white/70 backdrop-blur-sm border-blue-100">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي الفواتير</p>
              <p className="text-2xl font-bold text-blue-800">{invoices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur-sm border-blue-100">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-xl bg-green-50">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المشتريات</p>
              <p className="text-2xl font-bold text-green-700">{grandTotal.toFixed(2)} <span className="text-sm font-normal">جنيه</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur-sm border-blue-100">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">متوسط قيمة الفاتورة</p>
              <p className="text-2xl font-bold text-purple-700">{avgInvoice.toFixed(2)} <span className="text-sm font-normal">جنيه</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Invoices Table ── */}
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Receipt className="w-5 h-5" />
              قائمة الفواتير
              <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="ابحث برقم الفاتورة أو المورد..."
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center text-gray-400 py-12">جاري التحميل...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد فواتير شراء حتى الآن"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50/60 hover:bg-blue-50/60">
                      <TableHead className="text-right font-semibold text-blue-800 w-10">#</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">رقم الفاتورة</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">المورد</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">التاريخ</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">الإجمالي</TableHead>
                      <TableHead className="text-center font-semibold text-blue-800 w-24">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedInvoices.map((invoice, index) => (
                      <TableRow
                        key={invoice.id}
                        className="hover:bg-blue-50/40 transition-colors border-blue-50 cursor-pointer"
                        onClick={() => openDetail(invoice)}
                      >
                        <TableCell className="text-gray-400 text-sm">{pageStart + index + 1}</TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-blue-600 border-blue-300 font-mono text-xs">
                            {invoice.invoice_ref}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Building className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-800">{invoice.supplier}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(invoice.created_at)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-bold text-green-600">
                            {invoice.total.toFixed(2)}
                            <span className="text-xs font-normal text-gray-500 mr-1">جنيه</span>
                          </span>
                        </TableCell>

                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => openDetail(invoice)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm" variant="ghost"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    سيتم حذف فاتورة <strong>{invoice.invoice_ref}</strong> بشكل نهائي.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-row-reverse gap-2">
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => deleteMutation.mutate(invoice.id)}
                                  >
                                    حذف
                                  </AlertDialogAction>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ── Pagination Footer ── */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-blue-50">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>
                    عرض {pageStart + 1}–{Math.min(pageStart + pageSize, filtered.length)} من {filtered.length} فاتورة
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">صفوف:</span>
                    <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="h-7 w-16 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((n) => (
                          <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(1)} disabled={safePage === 1}>
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === "..." ? (
                        <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                      ) : (
                        <Button key={item} size="sm"
                          variant={safePage === item ? "default" : "outline"}
                          className={`h-8 w-8 p-0 text-xs ${safePage === item ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                          onClick={() => setCurrentPage(item as number)}>
                          {item}
                        </Button>
                      )
                    )}
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}>
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Invoice Detail Dialog ── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-800">
              <FileText className="w-5 h-5" />
              فاتورة شراء — {selectedInvoice?.invoice_ref}
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-500 mb-1">رقم الفاتورة</p>
                  <p className="font-bold text-blue-700 font-mono">{selectedInvoice.invoice_ref}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-500 mb-1">المورد</p>
                  <p className="font-semibold text-gray-800">{selectedInvoice.supplier}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-500 mb-1">التاريخ</p>
                  <p className="font-semibold text-gray-800 text-sm">{formatDate(selectedInvoice.created_at)}</p>
                </div>
              </div>

              {/* Items table */}
              <div className="rounded-lg border border-blue-100 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50/60 hover:bg-blue-50/60">
                      <TableHead className="text-right font-semibold text-blue-800 w-10">#</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">المنتج</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">سعر الشراء</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">الكمية</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((item, i) => (
                      <TableRow key={item.id} className="hover:bg-blue-50/20 border-blue-50">
                        <TableCell className="text-gray-400 text-sm">{i + 1}</TableCell>
                        <TableCell className="font-medium text-gray-800">{item.product_name}</TableCell>
                        <TableCell className="text-gray-600">
                          {item.cost.toFixed(2)}
                          <span className="text-xs text-gray-400 mr-1">جنيه</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.quantity}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-green-600">
                            {(item.cost * item.quantity).toFixed(2)}
                            <span className="text-xs font-normal text-gray-500 mr-1">جنيه</span>
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Grand total */}
              <div className="flex justify-between items-center px-4 py-3 bg-green-50 rounded-lg border border-green-100">
                <span className="font-semibold text-gray-700">المبلغ الإجمالي:</span>
                <span className="text-2xl font-bold text-green-600">
                  {selectedInvoice.total.toFixed(2)}
                  <span className="text-sm font-normal text-gray-500 mr-1">جنيه</span>
                </span>
              </div>

              {/* Actions */}
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
                        سيتم حذف فاتورة <strong>{selectedInvoice.invoice_ref}</strong> بشكل نهائي من قاعدة البيانات.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteMutation.mutate(selectedInvoice.id)}
                      >
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