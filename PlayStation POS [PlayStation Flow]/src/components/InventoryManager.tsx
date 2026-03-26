import { useState } from 'react';
import { useStore } from '../store';
import { Product } from '../types';
import { Plus, Edit2, Trash2, BoxSelect, CupSoda, UtensilsCrossed } from 'lucide-react';
import { formatCurrency, cn } from '../utils';

export default function InventoryManager() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});

  const handleSave = () => {
    if (!formData.name || !formData.price || !formData.category) return;
    
    const productData = {
      name: formData.name,
      price: Number(formData.price) || 0,
      stock: Number(formData.stock) || 0,
      category: formData.category as Product['category'],
    };

    if (isEditing === 'new') {
      addProduct(productData as Omit<Product, 'id'>);
    } else if (isEditing) {
      updateProduct(isEditing, productData);
    }
    
    setIsEditing(null);
    setFormData({});
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setIsEditing(product.id);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'drink': return <CupSoda className="w-5 h-5 text-blue-500" />;
      case 'food': return <UtensilsCrossed className="w-5 h-5 text-orange-500" />;
      case 'snack': return <BoxSelect className="w-5 h-5 text-yellow-500" />;
      default: return <BoxSelect className="w-5 h-5 text-slate-400" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'drink': return 'مشروبات';
      case 'food': return 'مأكولات';
      case 'snack': return 'سناكس';
      default: return 'أخرى';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة الكافيه والمخزن</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">أضف أو عدل المنتجات المتاحة للبيع.</p>
        </div>
        <button 
          onClick={() => { setIsEditing('new'); setFormData({ category: 'drink', price: 10, stock: 50 }); }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج جديد
        </button>
      </div>

      {isEditing && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-blue-100 dark:border-slate-800 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {isEditing === 'new' ? 'إضافة منتج جديد' : 'تعديل بيانات المنتج'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">اسم المنتج</label>
              <input 
                type="text" 
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                placeholder="مثال: بيبسي"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">القسم</label>
              <select 
                value={formData.category || 'drink'} 
                onChange={e => setFormData({...formData, category: e.target.value as any})}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
              >
                <option value="drink">مشروبات</option>
                <option value="snack">سناكس</option>
                <option value="food">مأكولات</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">السعر</label>
              <input 
                type="number" 
                value={formData.price || ''} 
                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">الكمية المتاحة (المخزون)</label>
              <input 
                type="number" 
                value={formData.stock || ''} 
                onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button 
              onClick={() => setIsEditing(null)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-colors shadow-sm"
            >
              حفظ
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-right">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-blue-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
            <tr>
              <th className="p-4 font-medium">المنتج</th>
              <th className="p-4 font-medium">القسم</th>
              <th className="p-4 font-medium">السعر</th>
              <th className="p-4 font-medium">المخزون</th>
              <th className="p-4 font-medium text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      {getCategoryIcon(product.category)}
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">{product.name}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-300">{getCategoryName(product.category)}</td>
                <td className="p-4 text-blue-600 dark:text-blue-400 font-medium">{formatCurrency(product.price)}</td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium",
                    product.stock > 10 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  )}>
                    {product.stock} وحدة
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => handleEdit(product)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">لا توجد منتجات مضافة بعد.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
