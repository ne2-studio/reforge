import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { Flame, User, Crown, LogOut } from 'lucide-react';
import { Button } from '@/design-system/components/ui/button';
import { SidebarTrigger } from '@/design-system/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/design-system/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/design-system/components/ui/dropdown-menu';
import { useProfileStore } from '@/store/profileStore';
import { useFeaturesStore } from '@/store/featuresStore';
import { loadProfile } from '@/features/profile/useCases';

const goalEmojis: Record<string, string> = {
  'lose-fat': '🔥',
  'gain-muscle': '💪',
  recomp: '⚡',
  maintain: '🎯',
};

const goalLabels: Record<string, string> = {
  'lose-fat': 'Perder grasa',
  'gain-muscle': 'Ganar músculo',
  recomp: 'Recomposición',
  maintain: 'Mantener',
};

// Ported from the prototype's App.tsx header — logo + avatar menu. Loads the profile itself
// (rather than relying on ProfileRoute having run first) since it's mounted on every
// authenticated route via AppLayout, and needs the goal/gender to render.
export function Header() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { profile, isLoading } = useProfileStore();
  const { subscriptions: subscriptionsEnabled } = useFeaturesStore();

  useEffect(() => {
    if (!profile && !isLoading) {
      void loadProfile();
    }
  }, [profile, isLoading]);

  return (
    <div className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-lg bg-card/80 h-[60px]">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="bg-primary text-primary-foreground rounded-xl p-2 shadow-lg shadow-primary/50">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Reforge
              </h1>
              {profile?.goal && (
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {goalEmojis[profile.goal]} {goalLabels[profile.goal]}
                </p>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary/50">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {profile?.gender === 'male' ? '👨' : profile?.gender === 'female' ? '👩' : '👤'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/perfil')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            {subscriptionsEnabled && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/suscripcion')}
                  className="cursor-pointer text-accent focus:text-accent"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  <span>Mi suscripción</span>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void auth.signoutRedirect()}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
