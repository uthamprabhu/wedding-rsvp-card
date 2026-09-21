/**
 * Static skeleton shown while dashboard data streams in.
 *
 * Mirrors the real layout's shape (header → stat cards → filters → rows) so
 * the page doesn't reflow when content arrives. Server component: no JS
 * shipped for this.
 */

import { WEDDING_DAYS } from '@/lib/wedding-days';

export default function DashboardSkeleton() {
  return (
    <div className="admin-dashboard" aria-busy="true" aria-live="polite">
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-header-content">
          <div>
            <div className="admin-dashboard-monogram">F <span>&amp;</span> B</div>
            <h1>Wedding Dashboard</h1>
            <p>Loading your responses…</p>
          </div>
        </div>
      </header>

      <div className="admin-dashboard-content">
        <section className="admin-stats-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="admin-stat-card" key={i}>
              <div className="admin-skeleton admin-skeleton-icon" />
              <div className="admin-stat-content">
                <div className="admin-skeleton admin-skeleton-value" />
                <div className="admin-skeleton admin-skeleton-label" />
              </div>
            </div>
          ))}
        </section>

        <section className="admin-day-stats">
          {WEDDING_DAYS.map((day) => (
            <div className="admin-day-stat-card" key={day.id}>
              <div className="admin-day-stat-head">
                <span className="admin-day-dot" style={{ background: day.accent }} />
                <div>
                  <div className="admin-day-stat-date">{day.shortDate}</div>
                  <div className="admin-day-stat-label">{day.label}</div>
                </div>
              </div>
              <div className="admin-day-stat-figures">
                <div className="admin-skeleton admin-skeleton-value" />
                <div className="admin-skeleton admin-skeleton-label" />
              </div>
            </div>
          ))}
        </section>

        <section className="admin-rsvp-section">
          <div className="admin-rsvp-header">
            <div>
              <h2>All Responses</h2>
              <p>Fetching…</p>
            </div>
          </div>

          <div className="admin-skeleton-rows">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="admin-skeleton admin-skeleton-row" key={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
