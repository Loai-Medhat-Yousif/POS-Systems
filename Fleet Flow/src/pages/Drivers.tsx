import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Driver } from '@/db/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Define statuses once – labels are translation keys
const DRIVER_STATUSES = [
  { value: 'available', labelKey: 'drivers.available' },
  { value: 'busy', labelKey: 'drivers.busy' }
] as const;

export default function Drivers() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleType: '',
    status: 'available' as 'available' | 'busy'
  });

  const drivers = useLiveQuery(
    () => db.drivers
      .filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search))
      .toArray(),
    [search]
  );

  const handleOpenDialog = (driver?: Driver) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        name: driver.name,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        status: driver.status
      });
    } else {
      setEditingDriver(null);
      setFormData({ name: '', phone: '', vehicleType: '', status: 'available' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await db.drivers.update(editingDriver.id, formData);
        toast.success(t('common.save') + ' ' + t('drivers.edit'));
      } else {
        await db.drivers.add({
          id: crypto.randomUUID(),
          ...formData
        });
        toast.success(t('common.save') + ' ' + t('drivers.add'));
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(t('common.errorSavingDriver'));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.deleteDriverConfirm'))) {
      await db.drivers.delete(id);
      toast.success(t('common.driverDeleted'));
    }
  };

  // Helper to get translated status label
  const getStatusLabel = (status: string) => {
    const found = DRIVER_STATUSES.find(s => s.value === status);
    return found ? t(found.labelKey) : status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#1F3B61]">{t('drivers.title')}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-[#1F3B61] hover:bg-[#152a47]">
              <Plus className="mr-2 h-4 w-4" />
              {t('drivers.add')}
            </Button>
          </DialogTrigger>
          <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>{editingDriver ? t('drivers.edit') : t('drivers.add')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('drivers.name')}</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('drivers.phone')}</Label>
                <Input
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('drivers.vehiclePlate')}</Label>
                <Input
                  required
                  value={formData.vehicleType}
                  onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('drivers.status')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'available' | 'busy') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {getStatusLabel(formData.status)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {DRIVER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {t(status.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="bg-[#1F3B61] hover:bg-[#152a47]">
                  {t('common.save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('drivers.search')}
              className="ps-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('drivers.name')}</TableHead>
                <TableHead>{t('drivers.phone')}</TableHead>
                <TableHead>{t('drivers.vehiclePlate')}</TableHead>
                <TableHead>{t('drivers.status')}</TableHead>
                <TableHead className={isRTL ? 'text-left' : 'text-right'}>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    {t('drivers.noDrivers')}
                  </TableCell>
                </TableRow>
              ) : (
                drivers?.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>{driver.vehicleType}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={driver.status === 'available' ? 'default' : 'secondary'}
                        className={driver.status === 'available' ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        {getStatusLabel(driver.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(driver)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(driver.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}