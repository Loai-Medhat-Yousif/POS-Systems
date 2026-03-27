import { useState } from 'react';
import { useStore } from '../store';
import { Device, DeviceType } from '../types';
import { Plus, Edit2, Trash2, Gamepad2, Tv } from 'lucide-react';
import { formatCurrency } from '../utils';

export default function DevicesManager() {
  const { devices, addDevice, updateDevice, deleteDevice } = useStore();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Device>>({});

  const handleSave = () => {
    if (!formData.name || !formData.room || !formData.type) return;
    
    const deviceData = {
      name: formData.name,
      room: formData.room,
      type: formData.type as DeviceType,
      hourlyRateSingle: Number(formData.hourlyRateSingle) || 0,
      hourlyRateMulti: Number(formData.hourlyRateMulti) || 0,
      games: formData.games ? (typeof formData.games === 'string' ? (formData.games as string).split(',').map(g => g.trim()) : formData.games) : [],
    };

    if (isEditing === 'new') {
      addDevice(deviceData as Omit<Device, 'id'>);
    } else if (isEditing) {
      updateDevice(isEditing, deviceData);
    }
    
    setIsEditing(null);
    setFormData({});
  };

  const handleEdit = (device: Device) => {
    setFormData({ ...device, games: device.games.join(', ') as any });
    setIsEditing(device.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة الغرف والأجهزة</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">أضف أو عدل الأجهزة، الغرف، وأسعار الساعات.</p>
        </div>
        <button 
          onClick={() => { setIsEditing('new'); setFormData({ type: 'PS5', hourlyRateSingle: 20, hourlyRateMulti: 30 }); }}
          className="bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          إضافة جهاز جديد
        </button>
      </div>

      {isEditing && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-blue-100 dark:border-slate-800 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {isEditing === 'new' ? 'إضافة جهاز جديد' : 'تعديل بيانات الجهاز'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">اسم الجهاز</label>
              <input 
                type="text" 
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                placeholder="مثال: جهاز 1"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">الغرفة</label>
              <input 
                type="text" 
                value={formData.room || ''} 
                onChange={e => setFormData({...formData, room: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                placeholder="مثال: الغرفة العامة"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">نوع الجهاز</label>
              <select 
                value={formData.type || 'PS5'} 
                onChange={e => setFormData({...formData, type: e.target.value as DeviceType})}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
              >
                <option value="PS4">PlayStation 4</option>
                <option value="PS5">PlayStation 5</option>
                <option value="PC">Gaming PC</option>
                <option value="VIP">VIP Room</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">سعر الساعة (فردي)</label>
              <input 
                type="number" 
                value={formData.hourlyRateSingle || ''} 
                onChange={e => setFormData({...formData, hourlyRateSingle: Number(e.target.value)})}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">سعر الساعة (زوجي/مالتي)</label>
              <input 
                type="number" 
                value={formData.hourlyRateMulti || ''} 
                onChange={e => setFormData({...formData, hourlyRateMulti: Number(e.target.value)})}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">الألعاب المتاحة (افصل بينها بفاصلة)</label>
              <input 
                type="text" 
                value={formData.games || ''} 
                onChange={e => setFormData({...formData, games: e.target.value as any})}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                placeholder="FIFA 24, GTA V, Tekken 8..."
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
              className="px-6 py-2 bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-colors shadow-sm"
            >
              حفظ
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {devices.map(device => (
          <div key={device.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-transparent">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <Tv className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{device.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{device.room} • {device.type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(device)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteDevice(device.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">سعر الفردي:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(device.hourlyRateSingle)} / ساعة</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">سعر الزوجي:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(device.hourlyRateMulti)} / ساعة</span>
              </div>
              
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400 block mb-2">الألعاب:</span>
                <div className="flex flex-wrap gap-2">
                  {device.games.map((game, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3" />
                      {game}
                    </span>
                  ))}
                  {device.games.length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500">لا توجد ألعاب مضافة</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
