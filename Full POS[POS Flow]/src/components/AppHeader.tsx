import { Receipt, User, DollarSign, Settings, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { dbService } from "@/lib/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AppHeader = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: settings = { shop_name: 'Pos Flow', shop_address: 'العنوان هنا' } } = useQuery({
    queryKey: ['settings'],
    queryFn: () => dbService.getSettings(),
  });

  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newData: Record<string, string>) => {
      await dbService.updateSetting('shop_name', newData.shop_name);
      await dbService.updateSetting('shop_address', newData.shop_address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: "تم تحديث الإعدادات بنجاح" });
      setIsOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl shadow-lg shadow-blue-200">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800">
              {settings.shop_name}
            </h1>
            <p className="text-xs text-gray-500 font-medium">{settings.shop_address}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-green-700">متصل (قاعدة البيانات المحلية)</span>
          </div>

          <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" /> إعدادات المتجر
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="shop_name">اسم المحل</Label>
                    <Input
                      id="shop_name"
                      value={formData.shop_name}
                      onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                      placeholder="أدخل اسم المحل..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop_address">العنوان</Label>
                    <Input
                      id="shop_address"
                      value={formData.shop_address}
                      onChange={(e) => setFormData({ ...formData, shop_address: e.target.value })}
                      placeholder="أدخل العنوان..."
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={updateSettingsMutation.isPending}>
                      <Save className="w-4 h-4 ml-2" /> حفظ التغييرات
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <div className="flex items-center gap-3 ml-2 group">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-700">{settings.shop_name}</p>
                <p className="text-[10px] text-gray-400">{settings.shop_address}</p>
              </div>
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
