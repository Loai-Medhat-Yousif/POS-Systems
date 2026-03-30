import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Session, Device } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function calculateSessionCost(session: Session, device: Device) {
  if (!session || !device) return { timeCost: 0, ordersCost: 0, total: 0 };
  
  const now = session.endTime || Date.now();
  const hours = (now - session.startTime) / (1000 * 60 * 60);
  const rate = session.isMultiplayer ? device.hourlyRateMulti : device.hourlyRateSingle;
  const timeCost = hours * rate;

  const ordersCost = session.orders.reduce((total, order) => total + (order.priceAtTime * order.quantity), 0);

  return {
    timeCost,
    ordersCost,
    total: timeCost + ordersCost
  };
}

export function exportToJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importFromJson(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
