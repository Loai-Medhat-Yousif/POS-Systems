
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, MapPin, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { dbService } from "@/lib/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SettingsSection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => dbService.getSettings(),
  });

  useEffect(() => {
    if (settings) {
      setShopName(settings.shop_name || "");
      setShopAddress(settings.shop_address || "");
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      await dbService.updateSetting('shop_name', shopName);
      await dbService.updateSetting('shop_address', shopAddress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث بيانات المتجر بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحفظ",
        description: "تعذر حفظ الإعدادات، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-white/60 backdrop-blur-md border-blue-100 shadow-xl shadow-blue-900/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">إعدادات المتجر</CardTitle>
              <CardDescription>قم بتخصيص بيانات متجرك التي تظهر في الفواتير</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shop_name" className="text-slate-600 font-bold flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-500" />
                  اسم المتجر
                </Label>
                <Input
                  id="shop_name"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="مثال: متجري الذكي"
                  className="h-12 bg-white/50 border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop_address" className="text-slate-600 font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  عنوان المتجر
                </Label>
                <Input
                  id="shop_address"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="مثال: القاهرة، شارع التحرير"
                  className="h-12 bg-white/50 border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={updateSettingsMutation.isPending}
                className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                {updateSettingsMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                حفظ التغييرات
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsSection;
