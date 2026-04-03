import Dexie, { type EntityTable } from 'dexie';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  status: 'available' | 'busy';
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryFee: number;
  paymentType: 'Cash' | 'Paid';
  status: 'Pending' | 'Assigned' | 'Delivered' | 'Failed';
  driverId?: string;
  cashCollected?: number;
  createdAt: number;
  updatedAt: number;
}

const db = new Dexie('FleetFlowDB') as Dexie & {
  drivers: EntityTable<Driver, 'id'>;
  orders: EntityTable<Order, 'id'>;
};

db.version(1).stores({
  drivers: 'id, name, status',
  orders: 'id, customerName, status, driverId, createdAt'
});

export { db };
