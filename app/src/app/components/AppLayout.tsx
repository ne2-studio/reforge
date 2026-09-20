import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/design-system/components/ui/sidebar';
import { Header } from './Header';
import { Navigation } from './Navigation';

// Shared shell for authenticated routes: a collapsible sidebar (Navigation, open by default on
// desktop, an offcanvas sheet closed by default on mobile — see SidebarProvider) plus the
// sticky Header and page content in the remaining column (SidebarInset).
export function AppLayout() {
  return (
    <SidebarProvider>
      <Navigation />
      <SidebarInset>
        <Header />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
