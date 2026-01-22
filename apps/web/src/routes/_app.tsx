import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const AppLayout = () => (
  <SidebarProvider>
    <SidebarInset>
      <Outlet />
    </SidebarInset>
  </SidebarProvider>
);

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});
