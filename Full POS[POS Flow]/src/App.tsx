import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";

import Layout            from "./components/Layout";
import SalesInterface    from "./components/SalesInterface";
import ProductManagement from "./components/ProductManagement";
import PurchaseInvoices  from "./components/PurchaseInvoices";
import ReportsSection    from "./components/ReportsSection";
import SalesInvoices     from "./components/SalesInvoices";
import NotFound          from "./pages/NotFound";
import SettingsSection from "./components/SettingsSection";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          {/* All pages share sidebar + header via Layout */}
          <Route element={<Layout />}>
            <Route path="/"         element={<SalesInterface />}    />
           
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/pos"      element={<PurchaseInvoices />} />
            <Route path="/reports"  element={<ReportsSection />}    />
            <Route path="/sales"    element={<SalesInvoices />}     />
            <Route path="/settings" element={<SettingsSection />}     />
          </Route>

          {/* 404 — no sidebar/header */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;