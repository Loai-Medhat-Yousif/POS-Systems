
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Tag, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dbService, Category } from "@/lib/db";

interface CategoryManagementProps {
  categories: Category[];
  onCategoriesUpdate: () => void;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"];

const CategoryManagement = ({ categories, onCategoriesUpdate }: CategoryManagementProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", color: "#3B82F6" });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    onCategoriesUpdate();
  };

  const addMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => dbService.addCategory(data),
    onSuccess: () => { refresh(); toast({ title: "تم إضافة الفئة" }); closeDialog(); },
    onError: () => toast({ title: "فشل الإضافة", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => dbService.updateCategory(id, data),
    onSuccess: () => { refresh(); toast({ title: "تم تحديث الفئة" }); closeDialog(); },
    onError: () => toast({ title: "فشل التحديث", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dbService.deleteCategory(id),
    onSuccess: () => { refresh(); toast({ title: "تم حذف الفئة" }); },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", color: "#3B82F6" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) { toast({ title: "يرجى إدخال اسم الفئة", variant: "destructive" }); return; }
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, color: cat.color });
    setIsDialogOpen(true);
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Tag className="w-5 h-5" /> إدارة الفئات
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); else setIsDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                onClick={() => { setEditingCategory(null); setFormData({ name: "", color: "#3B82F6" }); }}>
                <Plus className="w-4 h-4 mr-2" /> إضافة فئة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>اسم الفئة *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="أدخل اسم الفئة" required />
                </div>
                <div>
                  <Label>لون الفئة</Label>
                  <div className="flex gap-2 mt-2">
                    {COLORS.map((color) => (
                      <button key={color} type="button"
                        className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? "border-gray-800 scale-110" : "border-gray-300"} transition-transform`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500" disabled={addMutation.isPending || updateMutation.isPending}>
                    {editingCategory ? "تحديث" : "إضافة"}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeDialog}>إلغاء</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>لا توجد فئات. أضف فئة جديدة لتنظيم منتجاتك.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <div key={cat.id} className="p-3 bg-white rounded-lg border border-blue-100 flex items-center justify-between group hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium text-sm">{cat.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(cat)} className="h-6 w-6 p-0">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(cat.id)} className="h-6 w-6 p-0 text-red-500 hover:text-red-700" disabled={deleteMutation.isPending}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryManagement;
