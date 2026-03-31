import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      app: {
        title: 'Fleet Flow',
        subtitle: 'Offline Edition',
      },
      nav: {
        dashboard: 'Dashboard',
        orders: 'Orders',
        drivers: 'Drivers',
        reports: 'Reports',
        logout: 'Logout',
      },
      auth: {
        login: 'Sign In',
        username: 'Username',
        password: 'Password',
        serialLabel: 'Serial Number',
        serialHint: 'Enter the serial number from your license',
        loggingIn: 'Verifying...',
        error: 'An unexpected error occurred.'
      },
      dashboard: {
        totalOrders: 'Total Orders Today',
        deliveredOrders: 'Delivered Orders',
        pendingOrders: 'Pending Orders',
        totalCash: 'Total Cash Collected',
        recentOrders: 'Recent Orders',
        activeDrivers: 'Active Drivers',
      },
      drivers: {
        title: 'Drivers',
        add: 'Add Driver',
        edit: 'Edit Driver',
        delete: 'Delete',
        name: 'Name',
        phone: 'Phone Number',
        vehicleType: 'Vehicle Type',
        status: 'Status',
        available: 'Available',
        busy: 'Busy',
        search: 'Search drivers...',
        noDrivers: 'No drivers found.',
      },
      orders: {
        title: 'Orders',
        add: 'Create Order',
        edit: 'Edit Order',
        customerName: 'Customer Name',
        phone: 'Phone',
        address: 'Address',
        deliveryFee: 'Delivery Fee',
        paymentType: 'Payment Type',
        cash: 'Cash',
        paid: 'Paid',
        status: 'Status',
        pending: 'Pending',
        assigned: 'Assigned',
        delivered: 'Delivered',
        failed: 'Failed',
        assignDriver: 'Assign Driver',
        unassigned: 'Unassigned',
        cashCollected: 'Cash Collected',
        search: 'Search orders...',
        noOrders: 'No orders found.',
        active: 'Active',
        history: 'History',
        noActiveOrders: 'No active orders found.',
        noHistoryOrders: 'No history orders found.',
      },
      reports: {
        title: 'Daily Reports',
        date: 'Date',
        totalOrders: 'Total Orders',
        delivered: 'Delivered',
        failed: 'Failed',
        revenue: 'Total Revenue',
        exportCsv: 'Export to CSV',
        driverSummary: 'Driver Cash Summary',
        expectedCash: 'Expected Cash',
        collectedCash: 'Collected Cash',
        difference: 'Difference',
      },
      charts: {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        orders: 'Orders',
        revenue: 'Revenue',
        deliveredVsFailed: 'Delivered vs Failed',
        delivered: 'Delivered',
        failed: 'Failed',
        ordersTrend: 'Orders Trend',
        revenueTrend: 'Revenue Trend',
      },
      common: {
        save: 'Save',
        cancel: 'Cancel',
        actions: 'Actions',
        egp: 'EGP',
        export: 'Export',
        import: 'Import',
      }
    }
  },

  ar: {
    translation: {
      app: {
        title: 'فليت فلو',
        subtitle: 'النسخة غير المتصلة',
      },
      nav: {
        dashboard: 'لوحة القيادة',
        orders: 'الطلبات',
        drivers: 'السائقين',
        reports: 'التقارير',
        logout: 'تسجيل الخروج',
      },
      auth: {
        login: 'تسجيل الدخول',
        username: 'اسم المستخدم',
        password: 'كلمة المرور',
        serialLabel: 'الرقم التسلسلي',
        serialHint: 'أدخل الرقم التسلسلي الخاص بترخيصك',
        loggingIn: 'جارٍ التحقق...',
        error: 'حدث خطأ غير متوقع.'
      },
      dashboard: {
        totalOrders: 'إجمالي طلبات اليوم',
        deliveredOrders: 'الطلبات المسلمة',
        pendingOrders: 'الطلبات المعلقة',
        totalCash: 'إجمالي النقد المحصل',
        recentOrders: 'الطلبات الحديثة',
        activeDrivers: 'السائقين النشطين',
      },
      drivers: {
        title: 'السائقين',
        add: 'إضافة سائق',
        edit: 'تعديل سائق',
        delete: 'حذف',
        name: 'الاسم',
        phone: 'رقم الهاتف',
        vehicleType: 'نوع المركبة',
        status: 'الحالة',
        available: 'متاح',
        busy: 'مشغول',
        search: 'البحث عن سائقين...',
        noDrivers: 'لم يتم العثور على سائقين.',
      },
      orders: {
        title: 'الطلبات',
        add: 'إنشاء طلب',
        edit: 'تعديل طلب',
        customerName: 'اسم العميل',
        phone: 'رقم الهاتف',
        address: 'العنوان',
        deliveryFee: 'رسوم التوصيل',
        paymentType: 'نوع الدفع',
        cash: 'نقدي',
        paid: 'مدفوع مسبقاً',
        status: 'الحالة',
        pending: 'قيد الانتظار',
        assigned: 'تم التعيين',
        delivered: 'تم التوصيل',
        failed: 'فشل التوصيل',
        assignDriver: 'تعيين سائق',
        unassigned: 'غير معين',
        cashCollected: 'النقد المحصل',
        search: 'البحث عن طلبات...',
        noOrders: 'لم يتم العثور على طلبات.',
        active: 'نشطة',
        history: 'التاريخ',
        noActiveOrders: 'لا توجد طلبات نشطة.',
        noHistoryOrders: 'لا توجد طلبات في التاريخ.',
      },
      reports: {
        title: 'التقارير اليومية',
        date: 'التاريخ',
        totalOrders: 'إجمالي الطلبات',
        delivered: 'تم التوصيل',
        failed: 'فشل التوصيل',
        revenue: 'إجمالي الإيرادات',
        exportCsv: 'تصدير إلى CSV',
        driverSummary: 'ملخص النقد للسائقين',
        expectedCash: 'النقد المتوقع',
        collectedCash: 'النقد المحصل',
        difference: 'الفرق',
      },
      charts: {
        daily: 'يومي',
        weekly: 'أسبوعي',
        monthly: 'شهري',
        orders: 'الطلبات',
        revenue: 'الإيرادات',
        deliveredVsFailed: 'تم التوصيل مقابل الفشل',
        delivered: 'تم التوصيل',
        failed: 'فشل',
        ordersTrend: 'اتجاه الطلبات',
        revenueTrend: 'اتجاه الإيرادات',
      },
      common: {
        save: 'حفظ',
        cancel: 'إلغاء',
        actions: 'إجراءات',
        egp: 'ج.م',
        export: 'تصدير',
        import: 'استيراد',
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;