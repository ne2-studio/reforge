import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';

// Shared shell for authenticated routes: the sticky Header, the fixed bottom/top nav from
// Navigation (which assumes a 60px header above it on desktop — see its `md:top-[60px]`),
// plus padding so page content never sits under either (24 = floating mobile bottom bar height
// + its bottom margin, 37 = desktop header + top bar height, both in the same units Navigation
// itself uses).
export function AppLayout() {
  return (
    <>
      <Header />
      <Navigation />
      <div className="pb-24 md:pt-37 md:pb-0">
        <Outlet />
      </div>
    </>
  );
}
