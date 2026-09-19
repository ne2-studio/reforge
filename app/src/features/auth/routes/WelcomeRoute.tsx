import { useAuth } from 'react-oidc-context';
import { useSearchParams } from 'react-router-dom';
import { WelcomeScreen } from '../components/WelcomeScreen';

// There's no mock/demo login (docs/architecture/frontend.md) — the only action here is to
// redirect to the configured OIDC provider's /authorize endpoint.
export function WelcomeRoute() {
  const auth = useAuth();
  const [searchParams] = useSearchParams();

  const handleSignIn = () => {
    const redirectTo = searchParams.get('redirectTo');
    void auth.signinRedirect(redirectTo ? { state: { redirectTo } } : undefined);
  };

  return <WelcomeScreen onSignIn={handleSignIn} />;
}
