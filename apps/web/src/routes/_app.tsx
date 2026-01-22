import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const AppLayout = () => (
  <SidebarProvider className="min-h-screen h-screen">
    <AppSidebar />
    <SidebarInset className="w-full overflow-hidden">
      <Outlet />
    </SidebarInset>
  </SidebarProvider>
);

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});
