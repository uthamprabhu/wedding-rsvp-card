/**
 * Route-level loading UI. Covers the gap during a hard navigation to
 * /admin/dashboard (address bar, refresh, or first paint after login),
 * before the page's own Suspense boundary takes over.
 */

import DashboardSkeleton from './DashboardSkeleton';

export default function Loading() {
  return <DashboardSkeleton />;
}
