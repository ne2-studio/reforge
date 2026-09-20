import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

// Shared shell for authenticated routes: the fixed bottom/top nav from Navigation plus
// padding so page content never sits under it (16 = mobile bottom bar height, 20 = desktop
// top bar height, both in the same units Navigation itself uses).
export function AppLayout() {
  return (
    <>
      <Navigation />
      <div className="pb-16 md:pt-20 md:pb-0">
        <Outlet />
      </div>
    </>
  );
}
