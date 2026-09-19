import { useNavigate } from "react-router-dom";
import { Zap, History, Settings, Crown, Eye, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useUserStore } from "../store/useUserStore";

interface HeaderProps {
  onLogout: () => void;
}

const goalEmojis: Record<string, string> = {
  "lose-fat": "🔥",
  "gain-muscle": "💪",
  "recomp": "⚡",
  "maintain": "🎯",
};

const goalLabels: Record<string, string> = {
  "lose-fat": "Perder grasa",
  "gain-muscle": "Ganar músculo",
  "recomp": "Recomposición",
  "maintain": "Mantener",
};

export const Header = ({ onLogout }: HeaderProps) => {
  const navigate = useNavigate();
  const { profile } = useUserStore();

  if (!profile) return null;

  return (
    <div className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-lg bg-card/80 h-[60px]">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => navigate("/")}
        >
          <div className="bg-primary text-primary-foreground rounded-xl p-2 shadow-lg shadow-primary/50">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Coach Recomp
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {goalEmojis[profile.goal]} {goalLabels[profile.goal]}
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary/50">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {profile.gender === 'male' ? '👨' : profile.gender === 'female' ? '👩' : '👤'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/history')} className="cursor-pointer">
              <History className="mr-2 h-4 w-4" />
              <span>Historial de comidas</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/subscription')} className="cursor-pointer text-accent focus:text-accent">
              <Crown className="mr-2 h-4 w-4" />
              <span>Mi suscripción</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/freemium-demo')} className="cursor-pointer text-accent focus:text-accent">
              <Eye className="mr-2 h-4 w-4" />
              <span>Demo Freemium</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
