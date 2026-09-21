'use client';

/**
 * Error boundary for the dashboard route.
 *
 * The query layer throws on Supabase failures rather than returning partial
 * data, so a dropped connection or a missing service key surfaces here as a
 * recoverable screen with a retry, instead of an unstyled crash page.
 *
 * Note: `reset()` re-runs the server component, which is the right retry for
 * a transient network or database blip.
 */

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side detail is redacted in production builds; log what we have
    // so it is visible in the browser console during debugging.
    console.error('Dashboard failed to load:', error);
  }, [error]);

  return (
    <div className="admin-dashboard">
      <div className="admin-error-wrap" role="alert">
        <div className="admin-error-card">
          <div className="admin-error-icon">
            <AlertTriangle size={26} strokeWidth={1.5} />
          </div>
          <h2>We could not load the responses</h2>
          <p>
            Something went wrong reaching the database. This is usually temporary —
            try again in a moment.
          </p>
          {error.digest && <code className="admin-error-digest">Ref: {error.digest}</code>}
          <button type="button" onClick={reset} className="admin-error-retry">
            <RotateCcw size={15} strokeWidth={1.8} />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
