import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Search, Edit, Trash2, Barcode, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbService, Product, Category } from "@/lib/db";
import CategoryManagement from "./CategoryManagement";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const ProductManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm]     = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage]   = useState(1);
  const [pageSize, setPageSize]         = useState(5);
  const [formData, setFormData] = useState({
    name: "", price: "", stock: "", barcode: "", category_id: "",
  });

  // ── Data Loading ──────────────────────────────────────────────
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => dbService.getCategories(),
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => dbService.getProducts(),
  });

  // ── Derived: filter + paginate ────────────────────────────────
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode || "").includes(searchTerm)
  );

  const totalPages  = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage    = Math.min(currentPage, totalPages);
  const pageStart   = (safePage - 1) * pageSize;
  const pageEnd     = pageStart + pageSize;
  const pagedProducts = filteredProducts.slice(pageStart, pageEnd);

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  // ── Mutations ─────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (data: Omit<Product, "id">) => dbService.addProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم إضافة المنتج بنجاح" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "فشل الإضافة", description: error.message || "حدث خطأ غير متوقع", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Product, "id">> }) =>
      dbService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم تحديث المنتج" });
      closeDialog();
    },
    onError: () => toast({ title: "فشل التحديث", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dbService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم حذف المنتج" });
    },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  // ── Helpers ───────────────────────────────────────────────────
  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({ name: "", price: "", stock: "", barcode: "", category_id: "" });
  };

  const generateBarcode = () =>
    setFormData({ ...formData, barcode: Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000).toString() });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    const payload = {
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      barcode: formData.barcode.trim() || null,
      category_id: formData.category_id || null,
    };
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload as any });
    } else {
      addMutation.mutate(payload as any);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      barcode: product.barcode || "",
      category_id: product.category_id || "",
    });
    setIsDialogOpen(true);
  };

  const getCategoryById = (id?: string) => categories.find((c) => c.id === id);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-blue-800">إدارة المنتجات</h2>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); else setIsDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                onClick={() => { setEditingProduct(null); setFormData({ name: "", price: "", stock: "", barcode: "", category_id: "" }); }}
              >
                <Plus className="w-4 h-4 mr-2" /> إضافة منتج جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم المنتج *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="أدخل اسم المنتج" required />
                </div>
                <div>
                  <Label htmlFor="price">السعر *</Label>
                  <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" required />
                </div>
                <div>
                  <Label htmlFor="stock">الكمية المتوفرة</Label>
                  <Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label htmlFor="barcode">الباركود</Label>
                  <div className="flex gap-2">
                    <Input id="barcode" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="الباركود" className="flex-1" />
                    <Button type="button" variant="outline" onClick={generateBarcode}><Barcode className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="category_id" className="mb-2 block">الفئة</Label>
                  <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                    disabled={addMutation.isPending || updateMutation.isPending}>
                    {editingProduct ? "تحديث" : "إضافة"}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeDialog}>إلغاء</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Category Management ── */}
      <CategoryManagement
        categories={categories}
        onCategoriesUpdate={() => queryClient.invalidateQueries({ queryKey: ["categories"] })}
      />

      {/* ── Products Table Card ── */}
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Package className="w-5 h-5" />
              المنتجات
              {!isLoading && (
                <Badge variant="secondary" className="text-xs">{filteredProducts.length}</Badge>
              )}
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الباركود..."
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center text-gray-400 py-12">جاري تحميل المنتجات...</p>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد منتجات. أضف منتجاً جديداً للبدء."}
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50/60 hover:bg-blue-50/60">
                      <TableHead className="text-right font-semibold text-blue-800 w-10">#</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">اسم المنتج</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">الفئة</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">السعر</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">المخزون</TableHead>
                      <TableHead className="text-right font-semibold text-blue-800">الباركود</TableHead>
                      <TableHead className="text-center font-semibold text-blue-800 w-24">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedProducts.map((product, index) => {
                      const cat = getCategoryById(product.category_id);
                      return (
                        <TableRow key={product.id} className="hover:bg-blue-50/40 transition-colors border-blue-50">
                          <TableCell className="text-gray-400 text-sm">
                            {pageStart + index + 1}
                          </TableCell>
                          <TableCell className="font-medium text-gray-800">{product.name}</TableCell>
                          <TableCell>
                            {cat ? (
                              <Badge variant="secondary" className="text-xs text-white border-0"
                                style={{ backgroundColor: cat.color }}>
                                {cat.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-blue-600">
                              {product.price.toFixed(2)}
                              <span className="text-xs font-normal text-gray-500 mr-1">جنيه</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                              {product.stock}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.barcode ? (
                              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {product.barcode}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(product.id)}
                                disabled={deleteMutation.isPending}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ── Pagination Footer ── */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-blue-50">

                {/* Left: rows info + page size */}
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>
                    عرض {pageStart + 1}–{Math.min(pageEnd, filteredProducts.length)} من {filteredProducts.length} منتج
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

                {/* Right: page buttons */}
                <div className="flex items-center gap-1">
                  {/* First */}
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(1)} disabled={safePage === 1}>
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                  {/* Prev */}
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  {/* Page number pills */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                      ) : (
                        <Button key={item} size="sm" variant={safePage === item ? "default" : "outline"}
                          className={`h-8 w-8 p-0 text-xs ${safePage === item ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                          onClick={() => setCurrentPage(item as number)}>
                          {item}
                        </Button>
                      )
                    )}

                  {/* Next */}
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {/* Last */}
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
    </div>
  );
};

export default ProductManagement;