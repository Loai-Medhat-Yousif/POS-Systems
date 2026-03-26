export type DeviceType = 'PS4' | 'PS5' | 'PC' | 'VIP';

export interface Device {
  id: string;
  name: string;
  room: string;
  type: DeviceType;
  hourlyRateSingle: number;
  hourlyRateMulti: number;
  games: string[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: 'drink' | 'food' | 'snack' | 'other';
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtTime: number;
}

export interface Session {
  id: string;
  deviceId: string;
  startTime: number;
  endTime?: number;
  isMultiplayer: boolean;
  controllersCount: number;
  orders: OrderItem[];
  status: 'active' | 'completed';
}

export interface Settings {
  shopName: string;
  shopAddress: string;
  footerMessage: string;
}

export interface AppState {
  theme: 'light' | 'dark';
  settings: Settings;
  devices: Device[];
  products: Product[];
  sessions: Session[];
}
