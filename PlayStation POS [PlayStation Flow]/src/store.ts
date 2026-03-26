import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Device, Product, Session, Settings } from './types';

interface Store extends AppState {
  toggleTheme: () => void;
  addDevice: (device: Omit<Device, 'id'>) => void;
  updateDevice: (id: string, device: Partial<Device>) => void;
  deleteDevice: (id: string) => void;

  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  startSession: (deviceId: string, isMultiplayer: boolean, controllersCount: number) => void;
  endSession: (sessionId: string) => void;
  addOrderToSession: (sessionId: string, productId: string, quantity: number) => void;
  updateSessionControllers: (sessionId: string, count: number) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  loadData: (data: Partial<AppState>) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useStore = create<Store>()(
  persist(
    (set) => ({
      theme: 'light',
      devices: [
        { id: '1', name: 'جهاز 1', room: 'الغرفة العامة', type: 'PS5', hourlyRateSingle: 30, hourlyRateMulti: 40, games: ['FIFA 24', 'GTA V'] },
        { id: '2', name: 'جهاز 2', room: 'الغرفة العامة', type: 'PS4', hourlyRateSingle: 20, hourlyRateMulti: 30, games: ['FIFA 23', 'Crash'] },
        { id: '3', name: 'VIP 1', room: 'غرفة VIP', type: 'PS5', hourlyRateSingle: 50, hourlyRateMulti: 60, games: ['FIFA 24', 'Call of Duty', 'Tekken 8'] },
      ],
      products: [
        { id: '1', name: 'مياه معدنية', price: 5, stock: 100, category: 'drink' },
        { id: '2', name: 'بيبسي', price: 15, stock: 50, category: 'drink' },
        { id: '3', name: 'شيبسي', price: 10, stock: 40, category: 'snack' },
        { id: '4', name: 'إندومي', price: 25, stock: 30, category: 'food' },
      ],
      settings: {
        shopName: 'PlayStation Flow',
        shopAddress: 'القاهرة، شارع النصر',
        footerMessage: 'شكراً لزيارتكم، نتمنى رؤيتكم قريباً!',
      },
      sessions: [],

      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      addDevice: (device) => set((state) => ({ devices: [...state.devices, { ...device, id: generateId() }] })),
      updateDevice: (id, device) => set((state) => ({ devices: state.devices.map(d => d.id === id ? { ...d, ...device } : d) })),
      deleteDevice: (id) => set((state) => ({ devices: state.devices.filter(d => d.id !== id) })),

      addProduct: (product) => set((state) => ({ products: [...state.products, { ...product, id: generateId() }] })),
      updateProduct: (id, product) => set((state) => ({ products: state.products.map(p => p.id === id ? { ...p, ...product } : p) })),
      deleteProduct: (id) => set((state) => ({ products: state.products.filter(p => p.id !== id) })),

      startSession: (deviceId, isMultiplayer, controllersCount) => set((state) => ({
        sessions: [...state.sessions, {
          id: generateId(),
          deviceId,
          startTime: Date.now(),
          isMultiplayer,
          controllersCount,
          orders: [],
          status: 'active'
        }]
      })),
      endSession: (sessionId) => set((state) => ({
        sessions: state.sessions.map(s => s.id === sessionId ? { ...s, status: 'completed', endTime: Date.now() } : s)
      })),
      addOrderToSession: (sessionId, productId, quantity) => set((state) => {
        const product = state.products.find(p => p.id === productId);
        if (!product) return state;

        const updatedProducts = state.products.map(p => p.id === productId ? { ...p, stock: p.stock - quantity } : p);

        const updatedSessions = state.sessions.map(s => {
          if (s.id === sessionId) {
            const existingOrderIndex = s.orders.findIndex(o => o.productId === productId && o.priceAtTime === product.price);
            let newOrders = [...s.orders];
            if (existingOrderIndex >= 0) {
              newOrders[existingOrderIndex].quantity += quantity;
            } else {
              newOrders.push({ id: generateId(), productId, quantity, priceAtTime: product.price });
            }
            return { ...s, orders: newOrders };
          }
          return s;
        });

        return { products: updatedProducts, sessions: updatedSessions };
      }),
      updateSessionControllers: (sessionId, count) => set((state) => ({
        sessions: state.sessions.map(s => s.id === sessionId ? { ...s, controllersCount: count } : s)
      })),
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      loadData: (data) => set((state) => ({ ...state, ...data })),
    }),
    {
      name: 'ps-cafe-storage',
    }
  )
);
