import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Utensils, Dumbbell, MessageCircle, TrendingDown, Calendar } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/design-system/components/ui/sidebar';

const NAV_ITEMS = [
  { path: '/home', label: 'Inicio', icon: Home, isActive: (p: string) => p === '/home' },
  { path: '/comidas', label: 'Comidas', icon: Utensils, isActive: (p: string) => p.startsWith('/comidas') },
  {
    path: '/actividad',
    label: 'Actividad',
    icon: Dumbbell,
    isActive: (p: string) => p.startsWith('/actividad') || p.startsWith('/entrenamientos'),
  },
  { path: '/chat', label: 'Coach', icon: MessageCircle, isActive: (p: string) => p.startsWith('/chat') },
  {
    path: '/progreso/medidas',
    label: 'Medidas y evolución',
    icon: TrendingDown,
    isActive: (p: string) => p.startsWith('/progreso/medidas'),
  },
  {
    path: '/progreso/semanal',
    label: 'Resumen semanal',
    icon: Calendar,
    isActive: (p: string) => p.startsWith('/progreso/semanal'),
  },
];

// Collapsible menu built on the shadcn sidebar primitives (design-system/components/ui/sidebar):
// open by default on desktop, an offcanvas sheet closed by default on mobile — both come for
// free from SidebarProvider's own useIsMobile check, see AppLayout.
export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  const goTo = (path: string) => {
    navigate(path);
    setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarMenu className="p-2 gap-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon, isActive }) => (
            <SidebarMenuItem key={path}>
              <SidebarMenuButton size="lg" isActive={isActive(location.pathname)} onClick={() => goTo(path)}>
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};
