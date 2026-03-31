import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Order } from '@/db/db';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash2, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function Orders() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    deliveryFee: 0,
    paymentType: 'Cash' as 'Cash' | 'Paid',
    status: 'Pending' as 'Pending' | 'Assigned' | 'Delivered' | 'Failed',
    cashCollected: 0
  });

  // ─── Translation maps ───────────────────────────────────────────────────────
  const paymentTypeLabels: Record<string, string> = {
    Cash: t('orders.cash'),
    Paid: t('orders.paid'),
  };

  const statusLabels: Record<string, string> = {
    Pending:   t('orders.pending'),
    Assigned:  t('orders.assigned'),
    Delivered: t('orders.delivered'),
    Failed:    t('orders.failed'),
  };

  const driverStatusLabels: Record<string, string> = {
    Available: t('drivers.available'),
    Busy:      t('drivers.busy'),
    Offline:   t('drivers.offline'),
  };
  // ────────────────────────────────────────────────────────────────────────────

  const orders = useLiveQuery(
    () => db.orders
      .filter(o => o.customerName.toLowerCase().includes(search.toLowerCase()) || o.phone.includes(search))
      .reverse()
      .sortBy('createdAt'),
    [search]
  );

  const drivers = useLiveQuery(() => db.drivers.toArray());

  const activeOrders = orders?.filter(order =>
    order.status === 'Pending' || order.status === 'Assigned'
  ) || [];

  const historyOrders = orders?.filter(order =>
    order.status === 'Delivered' || order.status === 'Failed'
  ) || [];

  const handleOpenDialog = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        deliveryFee: order.deliveryFee,
        paymentType: order.paymentType,
        status: order.status,
        cashCollected: order.cashCollected || 0
      });
    } else {
      setEditingOrder(null);
      setFormData({
        customerName: '',
        phone: '',
        address: '',
        deliveryFee: 0,
        paymentType: 'Cash',
        status: 'Pending',
        cashCollected: 0
      });
    }
    setIsDialogOpen(true);
  };

  const handleOpenAssignDialog = (order: Order) => {
    setEditingOrder(order);
    setSelectedDriverId(order.driverId || '');
    setIsAssignDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrder) {
        await db.orders.update(editingOrder.id, {
          ...formData,
          updatedAt: Date.now()
        });

        if (
          (formData.status === 'Delivered' || formData.status === 'Failed') &&
          editingOrder.driverId
        ) {
          const otherActiveOrders = await db.orders
            .where('driverId')
            .equals(editingOrder.driverId)
            .filter(o => o.id !== editingOrder.id && (o.status === 'Pending' || o.status === 'Assigned'))
            .count();
          if (otherActiveOrders === 0) {
            await db.drivers.update(editingOrder.driverId, { status: 'Available' });
          }
        }

        toast.success(t('common.save') + ' ' + t('orders.edit'));
      } else {
        await db.orders.add({
          id: crypto.randomUUID(),
          ...formData,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        toast.success(t('common.save') + ' ' + t('orders.add'));
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Error saving order');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const isUnassigned = selectedDriverId === 'unassigned' || !selectedDriverId;
    const previousDriverId = editingOrder.driverId;

    try {
      await db.orders.update(editingOrder.id, {
        driverId: isUnassigned ? undefined : selectedDriverId,
        status: isUnassigned ? 'Pending' : 'Assigned',
        updatedAt: Date.now()
      });

      if (!isUnassigned) {
        await db.drivers.update(selectedDriverId, { status: 'Busy' });
      }

      if (previousDriverId && (isUnassigned || previousDriverId !== selectedDriverId)) {
        const otherActiveOrders = await db.orders
          .where('driverId')
          .equals(previousDriverId)
          .filter(o => o.id !== editingOrder.id && (o.status === 'Pending' || o.status === 'Assigned'))
          .count();
        if (otherActiveOrders === 0) {
          await db.drivers.update(previousDriverId, { status: 'Available' });
        }
      }

      toast.success(t('orders.assignDriver'));
      setIsAssignDialogOpen(false);
    } catch (error) {
      toast.error('Error assigning driver');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      await db.orders.delete(id);
      toast.success('Order deleted');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-500 hover:bg-green-600';
      case 'Failed':    return 'bg-red-500 hover:bg-red-600';
      case 'Assigned':  return 'bg-blue-500 hover:bg-blue-600';
      default:          return 'bg-orange-500 hover:bg-orange-600';
    }
  };

  const OrdersTable = ({ orderList, showAssign }: { orderList: Order[], showAssign: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('orders.customerName')}</TableHead>
          <TableHead>{t('orders.phone')}</TableHead>
          <TableHead>{t('orders.address')}</TableHead>
          <TableHead>{t('orders.deliveryFee')}</TableHead>
          <TableHead>{t('orders.status')}</TableHead>
          <TableHead>{t('nav.drivers')}</TableHead>
          <TableHead className="text-end">{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
              {showAssign ? t('orders.noActiveOrders') : t('orders.noHistoryOrders')}
            </TableCell>
          </TableRow>
        ) : (
          orderList.map((order) => {
            const driver = drivers?.find(d => d.id === order.driverId);
            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.customerName}</TableCell>
                <TableCell>{order.phone}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={order.address}>
                  {order.address}
                </TableCell>
                <TableCell>
                  {order.deliveryFee} {t('common.egp')}
                </TableCell>
                <TableCell>
                  <Badge className={`text-white ${getStatusBadgeVariant(order.status)}`}>
                    {statusLabels[order.status] ?? order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {driver
                    ? driver.name
                    : <span className="text-muted-foreground text-sm">{t('orders.unassigned')}</span>
                  }
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex items-center justify-end gap-1">
                    {showAssign && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenAssignDialog(order)}
                        title={t('orders.assignDriver')}
                      >
                        <Truck className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(order)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(order.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#1F3B61]">
          {t('orders.title')}
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-[#1F3B61] hover:bg-[#152a47]">
              <Plus className="me-2 h-4 w-4" />
              {t('orders.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>{editingOrder ? t('orders.edit') : t('orders.add')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('orders.customerName')}</Label>
                  <Input
                    required
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('orders.phone')}</Label>
                  <Input
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>{t('orders.address')}</Label>
                  <Input
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('orders.deliveryFee')}</Label>
                  <Input
                    type="number"
                    min={0}
                    required
                    value={formData.deliveryFee}
                    onChange={e => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                  />
                </div>

                {/* ── paymentType Select ── */}
                <div className="space-y-2">
                  <Label>{t('orders.paymentType')}</Label>
                  <Select
                    value={formData.paymentType}
                    onValueChange={(value: 'Cash' | 'Paid') => setFormData({ ...formData, paymentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {paymentTypeLabels[formData.paymentType]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">{t('orders.cash')}</SelectItem>
                      <SelectItem value="Paid">{t('orders.paid')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingOrder && (
                  <>
                    {/* ── status Select ── */}
                    <div className="space-y-2">
                      <Label>{t('orders.status')}</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'Pending' | 'Assigned' | 'Delivered' | 'Failed') =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {statusLabels[formData.status]}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">{t('orders.pending')}</SelectItem>
                          <SelectItem value="Assigned">{t('orders.assigned')}</SelectItem>
                          <SelectItem value="Delivered">{t('orders.delivered')}</SelectItem>
                          <SelectItem value="Failed">{t('orders.failed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.status === 'Delivered' && formData.paymentType === 'Cash' && (
                      <div className="space-y-2">
                        <Label>{t('orders.cashCollected')}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.cashCollected}
                          onChange={e => setFormData({ ...formData, cashCollected: Number(e.target.value) })}
                        />
                      </div>
                    )}
                  </>
                )}
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

      {/* Table Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('orders.search')}
              className="ps-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">{t('orders.active')}</TabsTrigger>
              <TabsTrigger value="history">{t('orders.history')}</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <OrdersTable orderList={activeOrders} showAssign={true} />
            </TabsContent>
            <TabsContent value="history">
              <OrdersTable orderList={historyOrders} showAssign={false} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Assign Driver Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('orders.assignDriver')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('nav.drivers')}</Label>
              {/* ── driver Select ── */}
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('orders.unassigned')}>
                    {!selectedDriverId || selectedDriverId === 'unassigned'
                      ? t('orders.unassigned')
                      : (() => {
                          const d = drivers?.find(d => d.id === selectedDriverId);
                          return d
                            ? `${d.name} (${driverStatusLabels[d.status] ?? d.status})`
                            : t('orders.unassigned');
                        })()
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t('orders.unassigned')}</SelectItem>
                  {drivers?.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name} ({driverStatusLabels[driver.status] ?? driver.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
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
  );
}