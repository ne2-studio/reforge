import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/design-system/components/ui/tabs';
import { Home, Utensils, Dumbbell, MessageCircle, TrendingDown } from 'lucide-react';

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/home') return 'home';
    if (path.startsWith('/comidas')) return 'meals';
    if (path.startsWith('/actividad') || path.startsWith('/entrenamientos')) return 'workouts';
    if (path.startsWith('/chat')) return 'chat';
    if (path.startsWith('/progreso')) return 'progress';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <Tabs value={activeTab} className="w-full">
      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-10 px-3 pb-3 mobile-nav-bottom">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-5 h-16 bg-card/90 backdrop-blur-lg rounded-2xl border-2 border-border shadow-lg">
          <TabsTrigger
            value="home"
            onClick={() => navigate('/home')}
            className="flex-col gap-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Inicio</span>
          </TabsTrigger>
          <TabsTrigger
            value="meals"
            onClick={() => navigate('/comidas')}
            className="flex-col gap-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Utensils className="h-5 w-5" />
            <span className="text-xs">Comidas</span>
          </TabsTrigger>
          <TabsTrigger
            value="workouts"
            onClick={() => navigate('/actividad')}
            className="flex-col gap-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Dumbbell className="h-5 w-5" />
            <span className="text-xs">Actividad</span>
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            onClick={() => navigate('/chat')}
            className="flex-col gap-1 data-[state=active]:bg-accent/20 data-[state=active]:text-accent relative"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs">Coach</span>
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            onClick={() => navigate('/progreso')}
            className="flex-col gap-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <TrendingDown className="h-5 w-5" />
            <span className="text-xs">Progreso</span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Desktop top nav */}
      <div className="hidden md:block md:fixed md:top-[60px] md:left-0 md:right-0 md:z-10 md:bg-background md:border-b md:border-border md:py-4">
        <div className="container mx-auto px-4">
          <TabsList className="grid w-full grid-cols-5 max-w-5xl mx-auto h-14 bg-card/50 border-2 border-border">
            <TabsTrigger
              value="home"
              onClick={() => navigate('/home')}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Home className="h-5 w-5 mr-2" />
              Inicio
            </TabsTrigger>
            <TabsTrigger
              value="meals"
              onClick={() => navigate('/comidas')}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Utensils className="h-5 w-5 mr-2" />
              Comidas
            </TabsTrigger>
            <TabsTrigger
              value="workouts"
              onClick={() => navigate('/actividad')}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Dumbbell className="h-5 w-5 mr-2" />
              Actividad
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              onClick={() => navigate('/chat')}
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground relative"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Coach
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              onClick={() => navigate('/progreso')}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <TrendingDown className="h-5 w-5 mr-2" />
              Progreso
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
    </Tabs>
  );
};
