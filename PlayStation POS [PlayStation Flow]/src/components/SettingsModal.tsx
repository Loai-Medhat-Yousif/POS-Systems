import React, { useState, useRef } from 'react';
import { X, Save, House, MapPin, MessageSquare, Download, Upload } from 'lucide-react';
import { useStore } from '../store';
import { exportToJson, importFromJson } from '../utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, sessions, devices, products, loadData } = useStore();
  const [formData, setFormData] = useState(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    onClose();
  };

  const handleExport = () => {
    const dataToExport = {
      settings,
      sessions,
      devices,
      products,
      exportDate: new Date().toISOString()
    };
    exportToJson(dataToExport, `pos-backup-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await importFromJson(file);
        if (confirm('هل أنت متأكد من استيراد هذه البيانات؟ سيؤدي ذلك إلى استبدال البيانات الحالية.')) {
          loadData(data);
          alert('تم استيراد البيانات بنجاح.');
        }
      } catch (err) {
        alert('حدث خطأ أثناء استيراد البيانات.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full  md:w-[600px] rounded-2xl shadow-2xl border border-blue-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-blue-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            إعدادات المحل
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <House className="w-4 h-4 text-blue-500" />
              اسم المحل
            </label>
            <input
              type="text"
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="مثال: بلايستيشن كافيه"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-500" />
              العنوان
            </label>
            <input
              type="text"
              value={formData.shopAddress}
              onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="مثال: القاهرة، شارع النصر"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              رسالة أسفل الفاتورة
            </label>
            <textarea
              value={formData.footerMessage}
              onChange={(e) => setFormData({ ...formData, footerMessage: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px] resize-none"
              placeholder="مثال: شكراً لزيارتكم!"
            />
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all transform active:scale-95"
            >
              <Save className="w-5 h-5" />
              حفظ الإعدادات
            </button>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                تصدير البيانات
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl font-medium transition-all"
              >
                <Upload className="w-4 h-4" />
                استيراد البيانات
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
