import { Archive } from 'lucide-react';
import { Button } from '@/design-system/components/ui/button';

interface WelcomeScreenProps {
  onSignIn: () => void;
}

// Presentational — no react-router-dom/store/useCases imports (see
// docs/architecture/frontend.md's components/ boundary). Adapted from reforge-frontend's
// WelcomeScreen: drops the Supabase email/password form and Google-only button in favor of
// a single OIDC sign-in action (fake-oidc locally, Zitadel in production).
export function WelcomeScreen({ onSignIn }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center shadow-lg">
            <Archive className="w-12 h-12 text-primary-foreground" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-4xl mb-3 text-foreground font-bold">Reforge</h1>

        <p className="text-lg text-muted-foreground mb-8">
          Tu coach de recomposición corporal privado
        </p>

        <Button onClick={onSignIn} size="lg" className="w-full">
          Iniciar sesión
        </Button>
      </div>
    </div>
  );
}
