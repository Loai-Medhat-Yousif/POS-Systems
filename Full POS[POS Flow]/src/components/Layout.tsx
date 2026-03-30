import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/Appsidebar";
// import AppHeader from "@/components/AppHeader";

/**
 * Root layout:
 *
 *  ┌──────────┬──────────────────────────────┐
 *  │          │  AppHeader (sticky)           │
 *  │ Sidebar  ├──────────────────────────────┤
 *  │          │  <Outlet /> (page content)    │
 *  └──────────┴──────────────────────────────┘
 *
 * RTL layout — sidebar is on the RIGHT in Arabic UI,
 * so we use `flex-row-reverse` to keep sidebar at the visual right.
 */
const Layout = () => {
  return (
    <div className="flex flex-row-reverse h-screen overflow-hidden bg-gray-50/50" dir="ltr">
      {/* Sidebar — fixed height, never scrolls */}
      <AppSidebar />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* <AppHeader /> */}

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;