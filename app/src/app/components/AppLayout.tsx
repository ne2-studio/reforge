import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/design-system/components/ui/sidebar';
import { Header } from './Header';
import { Navigation } from './Navigation';

// Shared shell for authenticated routes. SidebarProvider's own wrapper is forced into a column
// (flex-col) so Header renders as a full-width bar above everything, rather than as a row item
// squeezed next to the sidebar; the sidebar panel itself (Navigation) is offset below it — see
// its own `top`/`height` override — instead of spanning the full viewport height.
export function AppLayout() {
  return (
    <SidebarProvider className="flex-col">
      <Header />
      <div className="flex flex-1">
        <Navigation />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
