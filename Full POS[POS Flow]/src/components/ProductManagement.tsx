
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Search, Edit, Trash2, Barcode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbService, Product, Category } from "@/lib/db";
import CategoryManagement from "./CategoryManagement";

const ProductManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    barcode: "",
    category_id: "",
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

  // ── Mutations ─────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (data: Omit<Product, "id">) => dbService.addProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم إضافة المنتج بنجاح" });
      closeDialog();
    },
    onError: (error: any) => {
      console.error('[POS] Add mutation error:', error);
      toast({ 
        title: "فشل الإضافة", 
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive" 
      });
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

  const generateBarcode = () => {
    setFormData({ ...formData, barcode: Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000).toString() });
  };

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
      category_id: formData.category_id || null, // Explicitly pass null if not selected
    };

    console.log('[POS] Saving product:', payload);

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

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode || "").includes(searchTerm)
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-blue-800">إدارة المنتجات</h2>
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
                <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500" disabled={addMutation.isPending || updateMutation.isPending}>
                  {editingProduct ? "تحديث" : "إضافة"}
                </Button>
                <Button type="button" variant="outline" onClick={closeDialog}>إلغاء</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <CategoryManagement categories={categories} onCategoriesUpdate={() => queryClient.invalidateQueries({ queryKey: ["categories"] })} />

      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث عن المنتجات..." className="pr-10" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-center text-gray-400 py-12">جاري تحميل المنتجات...</p>
      ) : filteredProducts.length === 0 ? (
        <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{searchTerm ? "لا توجد نتائج للبحث" : "لا توجد منتجات. أضف منتجاً جديداً للبدء."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const cat = getCategoryById(product.category_id);
            return (
              <Card key={product.id} className="bg-white/80 backdrop-blur-sm border-blue-100 hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-gray-800">{product.name}</CardTitle>
                    {cat && (
                      <Badge variant="secondary" className="text-xs text-white border-0" style={{ backgroundColor: cat.color }}>
                        {cat.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">السعر:</span>
                    <span className="font-bold text-blue-600">{product.price.toFixed(2)} جنيه</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">المخزون:</span>
                    <Badge variant={product.stock > 10 ? "default" : "destructive"}>{product.stock}</Badge>
                  </div>
                  {product.barcode && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">الباركود:</span>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{product.barcode}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="flex-1">
                      <Edit className="w-3 h-3 mr-1" /> تعديل
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(product.id)} disabled={deleteMutation.isPending}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
