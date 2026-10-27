import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from 'react-oidc-context';
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

import App from './app/App';
import { getEnv } from './runtimeConfig';
import './styles/index.css';

// Scopes sign-in to Reforge's own Zitadel org, so its login policy and Google IdP apply. Unset
// locally, where fake-oidc stands in for Zitadel and has no notion of orgs.
const organizationId = getEnv('VITE_ZITADEL_ORGANIZATION_ID');
const scope = organizationId
  ? `openid profile email urn:zitadel:iam:org:id:${organizationId}`
  : 'openid profile email';

// Instantiated ourselves (rather than letting <AuthProvider> build one implicitly) so it's
// explicit and reusable if a native/callback edge case needs direct access later — mirrors
// el-baul's main.tsx, minus the Capacitor-specific deep-link wiring Reforge doesn't need yet.
const userManager = new UserManager({
  authority: getEnv('VITE_OIDC_AUTHORITY'),
  client_id: getEnv('VITE_OIDC_CLIENT_ID'),
  redirect_uri: getEnv('VITE_OIDC_CALLBACK_URI'),
  post_logout_redirect_uri: getEnv('VITE_OIDC_CALLBACK_URI'),
  scope,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
});

createRoot(document.getElementById('root')!).render(
  <AuthProvider
    userManager={userManager}
    onSigninCallback={() => {
      window.history.replaceState({}, document.title, '/');
    }}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>
);
