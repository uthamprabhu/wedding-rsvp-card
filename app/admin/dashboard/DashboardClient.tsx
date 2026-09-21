'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, UserCheck, BedDouble, TrendingUp, Clock,
  Search, LogOut, SlidersHorizontal, X, Mail, Phone,
  Calendar, UserRound, CalendarDays, FilterX, Check,
} from 'lucide-react';
import type {
  AccommodationFilter,
  DashboardStats,
  DayMatchMode,
  RsvpWithDetails,
  SortBy,
} from '@/lib/admin-queries';
import { DAY_IDS, WEDDING_DAYS, getDay, type DayId } from '@/lib/wedding-days';

interface Filters {
  searchTerm: string;
  accommodationFilter: AccommodationFilter;
  sortBy: SortBy;
  days: DayId[];
  dayMatchMode: DayMatchMode;
}

interface DashboardClientProps {
  stats: DashboardStats;
  rsvps: RsvpWithDetails[];
  initialFilters: Filters;
}

const SEARCH_DEBOUNCE_MS = 400;

/* ------------------------------------------------------------------ *
 * Day pills
 * ------------------------------------------------------------------ */
function DayPills({ ids, compact = false }: { ids: DayId[]; compact?: boolean }) {
  if (ids.length === 0) {
    return <span className="admin-day-pills-empty">—</span>;
  }
  return (
    <div className={`admin-day-pills${compact ? ' is-compact' : ''}`}>
      {ids.map((id) => {
        const day = getDay(id);
        if (!day) return null;
        return (
          <span
            key={id}
            className="admin-day-pill"
            style={{ '--pill-accent': day.accent } as CSSProperties}
            title={`${day.date} · ${day.label}`}
          >
            <span className="admin-day-pill-date">{day.shortDate}</span>
            <span className="admin-day-pill-label">{compact ? day.short : day.label}</span>
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Dashboard
 * ------------------------------------------------------------------ */
export default function DashboardClient({ stats, rsvps, initialFilters }: DashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /* The URL is the single source of truth for filters. `useOptimistic` lets
     chips and selects respond on the very next frame while the server round
     trip is still in flight, then hands control back to the real prop once
     the transition settles. This replaces mirroring props into useState and
     re-syncing them in an effect, which caused cascading renders and broke
     on browser back/forward. */
  const [filters, applyOptimisticFilters] = useOptimistic(initialFilters);
  const { accommodationFilter, sortBy, days, dayMatchMode } = filters;

  /* The search box is a genuinely local, uncommitted value — it holds
     keystrokes that have not been pushed to the URL yet. */
  const [searchInput, setSearchInput] = useState(initialFilters.searchTerm);

  const [selectedRsvp, setSelectedRsvp] = useState<RsvpWithDetails | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /** Rebuilds the query string from scratch so stale params can't linger. */
  const pushFilters = useCallback(
    (next: Partial<Filters>) => {
      const merged: Filters = { ...filters, ...next };

      const params = new URLSearchParams();
      if (merged.searchTerm.trim()) params.set('search', merged.searchTerm.trim());
      if (merged.accommodationFilter !== 'all') params.set('accommodation', merged.accommodationFilter);
      if (merged.sortBy !== 'date_desc') params.set('sort', merged.sortBy);
      if (merged.days.length > 0) params.set('days', merged.days.join(','));
      // Only meaningful with more than one day selected.
      if (merged.days.length > 1 && merged.dayMatchMode === 'all') params.set('dayMatch', 'all');

      const qs = params.toString();
      startTransition(() => {
        // Must happen inside the transition for React to track the optimistic
        // value and revert it when the navigation completes.
        applyOptimisticFilters(merged);
        router.push(qs ? `/admin/dashboard?${qs}` : '/admin/dashboard', { scroll: false });
      });
    },
    [filters, applyOptimisticFilters, router],
  );

  /* Debounced search: one request after typing settles, instead of one per
     keystroke. Comparing against the committed server value stops this
     re-firing once the round trip lands. */
  const serverSearch = initialFilters.searchTerm;
  useEffect(() => {
    if (searchInput.trim() === serverSearch.trim()) return;
    const timer = setTimeout(() => pushFilters({ searchTerm: searchInput }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, serverSearch]);

  /* ---------------- Handlers ---------------- */
  const toggleDay = (id: DayId) => {
    const nextSet = new Set(days);
    if (nextSet.has(id)) nextSet.delete(id);
    else nextSet.add(id);
    // Always store in chronological order for stable URLs.
    pushFilters({ days: DAY_IDS.filter((d) => nextSet.has(d)) });
  };

  /** Clicking the active day's stat card again clears the filter. */
  const showOnlyDay = (id: DayId) => {
    pushFilters({ days: days.length === 1 && days[0] === id ? [] : [id] });
  };

  const handleDayMatchChange = (mode: DayMatchMode) => pushFilters({ dayMatchMode: mode });

  const handleAccommodationChange = (value: AccommodationFilter) =>
    pushFilters({ accommodationFilter: value });

  const handleSortChange = (value: SortBy) => pushFilters({ sortBy: value });

  const clearSearch = () => {
    setSearchInput('');
    pushFilters({ searchTerm: '' });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    pushFilters({
      searchTerm: '',
      accommodationFilter: 'all',
      sortBy: 'date_desc',
      days: [],
      dayMatchMode: 'any',
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin');
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) +
    (accommodationFilter !== 'all' ? 1 : 0) +
    (days.length > 0 ? 1 : 0) +
    (sortBy !== 'date_desc' ? 1 : 0);

  /* ---------------- Modal: escape to close + scroll lock ---------------- */
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selectedRsvp) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedRsvp(null);
    };
    document.addEventListener('keydown', onKeyDown);

    // Prevent the page behind the modal scrolling on mobile.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedRsvp]);

  const statCards = useMemo(
    () => [
      { icon: Users, label: 'Total Responses', value: stats.totalResponses, color: '#a6814e' },
      { icon: UserCheck, label: 'Total Guests', value: stats.totalGuests, color: '#6d8a5f' },
      { icon: BedDouble, label: 'Accommodation', value: stats.accommodationNeeded, color: '#8d6e42' },
      { icon: TrendingUp, label: 'Avg Party Size', value: stats.averagePartySize.toFixed(1), color: '#9b7856' },
      { icon: Clock, label: 'Last 7 Days', value: stats.recentResponses, color: '#7a6b5d' },
    ],
    [stats],
  );

  const dayStatById = useMemo(
    () => new Map(stats.perDay.map((d) => [d.id, d])),
    [stats.perDay],
  );

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-header-content">
          <div>
            <div className="admin-dashboard-monogram">F <span>&amp;</span> B</div>
            <h1>Wedding Dashboard</h1>
            <p>Manage your RSVP responses</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="admin-logout-btn"
            title="Logout"
          >
            <LogOut size={18} />
            <span>{isLoggingOut ? 'Logging out…' : 'Logout'}</span>
          </button>
        </div>
      </header>

      <div className="admin-dashboard-content">
        {/* Overall stats */}
        <section className="admin-stats-grid">
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="admin-stat-card">
              <div className="admin-stat-icon" style={{ color }}>
                <Icon size={20} strokeWidth={1.5} />
              </div>
              <div className="admin-stat-content">
                <div className="admin-stat-value">{value}</div>
                <div className="admin-stat-label">{label}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Per-day attendance — the numbers to cater against.
            Each card doubles as a quick filter for that event. */}
        <section className="admin-day-stats" aria-label="Attendance by event">
          {WEDDING_DAYS.map((day) => {
            const stat = dayStatById.get(day.id);
            const isActive = days.length === 1 && days[0] === day.id;
            return (
              <button
                type="button"
                key={day.id}
                onClick={() => showOnlyDay(day.id)}
                className={`admin-day-stat-card${isActive ? ' is-active' : ''}`}
                style={{ '--day-accent': day.accent } as CSSProperties}
                aria-pressed={isActive}
                title={isActive ? 'Clear this filter' : `Show only ${day.label}`}
              >
                <div className="admin-day-stat-head">
                  <span className="admin-day-dot" style={{ background: day.accent }} />
                  <div>
                    <div className="admin-day-stat-date">{day.shortDate}</div>
                    <div className="admin-day-stat-label">{day.label}</div>
                  </div>
                </div>
                <div className="admin-day-stat-figures">
                  <div className="admin-day-stat-figure">
                    <strong>{stat?.guests ?? 0}</strong>
                    <span>guests</span>
                  </div>
                  <div className="admin-day-stat-figure is-secondary">
                    <strong>{stat?.responses ?? 0}</strong>
                    <span>{stat?.responses === 1 ? 'response' : 'responses'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        {/* RSVP list */}
        <section className="admin-rsvp-section">
          <div className="admin-rsvp-header">
            <div>
              <h2>All Responses</h2>
              <p>
                {rsvps.length} {rsvps.length === 1 ? 'response' : 'responses'}
                {activeFilterCount > 0 ? ' matching your filters' : ' in total'}
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearAllFilters} className="admin-clear-filters">
                <FilterX size={14} strokeWidth={1.8} />
                <span>Clear filters</span>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="admin-filters">
            <div className="admin-search-form">
              <Search size={16} />
              <input
                type="search"
                inputMode="search"
                placeholder="Search name, phone, or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search responses"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="admin-search-clear"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Day chips */}
            <div className="admin-day-filter">
              <div className="admin-day-filter-head">
                <CalendarDays size={14} strokeWidth={1.8} />
                <span>Attending</span>
                {days.length > 1 && (
                  <div className="admin-day-match" role="group" aria-label="Match mode">
                    <button
                      type="button"
                      className={dayMatchMode === 'any' ? 'is-active' : ''}
                      onClick={() => handleDayMatchChange('any')}
                      aria-pressed={dayMatchMode === 'any'}
                    >
                      Any
                    </button>
                    <button
                      type="button"
                      className={dayMatchMode === 'all' ? 'is-active' : ''}
                      onClick={() => handleDayMatchChange('all')}
                      aria-pressed={dayMatchMode === 'all'}
                    >
                      All
                    </button>
                  </div>
                )}
              </div>

              <div className="admin-day-chips">
                {WEDDING_DAYS.map((day) => {
                  const selected = days.includes(day.id);
                  return (
                    <button
                      type="button"
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`admin-day-chip${selected ? ' is-selected' : ''}`}
                      style={{ '--chip-accent': day.accent } as CSSProperties}
                      aria-pressed={selected}
                    >
                      <span className="admin-day-chip-check">
                        {selected && <Check size={12} strokeWidth={2.6} />}
                      </span>
                      <span className="admin-day-chip-text">
                        <span className="admin-day-chip-date">{day.shortDate}</span>
                        <span className="admin-day-chip-label">{day.short}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {days.length > 1 && (
                <p className="admin-day-filter-hint">
                  {dayMatchMode === 'all'
                    ? 'Showing guests attending every selected event.'
                    : 'Showing guests attending at least one selected event.'}
                </p>
              )}
            </div>

            <div className="admin-filter-row">
              <label className="admin-filter-group">
                <SlidersHorizontal size={14} />
                <span>Accommodation</span>
                <select
                  value={accommodationFilter}
                  onChange={(e) => handleAccommodationChange(e.target.value as AccommodationFilter)}
                >
                  <option value="all">All</option>
                  <option value="yes">Needed</option>
                  <option value="no">Not needed</option>
                </select>
              </label>

              <label className="admin-filter-group">
                <span>Sort by</span>
                <select value={sortBy} onChange={(e) => handleSortChange(e.target.value as SortBy)}>
                  <option value="date_desc">Newest first</option>
                  <option value="date_asc">Oldest first</option>
                  <option value="name_asc">Name (A–Z)</option>
                  <option value="guests_desc">Most guests</option>
                </select>
              </label>
            </div>
          </div>

          {/* Results — dimmed while a new server response is in flight, so the
              previous data stays readable instead of blanking out. */}
          <div className={`admin-results${isPending ? ' is-pending' : ''}`} aria-busy={isPending}>
            {isPending && (
              <div className="admin-loading-overlay">
                <div className="admin-loading-spinner" />
              </div>
            )}

            {/* Desktop table */}
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Attending</th>
                    <th>Guests</th>
                    <th>Stay</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="admin-table-empty">
                        No responses match these filters
                      </td>
                    </tr>
                  ) : (
                    rsvps.map((rsvp) => (
                      <tr
                        key={rsvp.id}
                        onClick={() => setSelectedRsvp(rsvp)}
                        className="admin-table-row-clickable"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedRsvp(rsvp);
                          }
                        }}
                      >
                        <td>
                          <div className="admin-table-name">
                            <UserRound size={16} />
                            <span>{rsvp.name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="admin-table-contact">
                            <div><Phone size={12} /> {rsvp.phone}</div>
                            {rsvp.email && <div><Mail size={12} /> {rsvp.email}</div>}
                          </div>
                        </td>
                        <td className="admin-table-days">
                          <DayPills ids={rsvp.days_attending} compact />
                        </td>
                        <td>
                          <span className="admin-badge admin-badge-guests">{rsvp.guest_count}</span>
                        </td>
                        <td>
                          <span className={`admin-badge ${rsvp.accommodation_needed ? 'admin-badge-yes' : 'admin-badge-no'}`}>
                            {rsvp.accommodation_needed ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="admin-table-date">{rsvp.formatted_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet cards */}
            <div className="admin-cards">
              {rsvps.length === 0 ? (
                <div className="admin-cards-empty">No responses match these filters</div>
              ) : (
                rsvps.map((rsvp) => (
                  <button
                    type="button"
                    key={rsvp.id}
                    className="admin-card"
                    onClick={() => setSelectedRsvp(rsvp)}
                  >
                    <div className="admin-card-header">
                      <div className="admin-card-name">
                        <UserRound size={18} />
                        <span>{rsvp.name}</span>
                      </div>
                      <span className="admin-badge admin-badge-guests">{rsvp.guest_count}</span>
                    </div>

                    <DayPills ids={rsvp.days_attending} compact />

                    <div className="admin-card-contact">
                      <div><Phone size={13} /> {rsvp.phone}</div>
                      {rsvp.email && <div><Mail size={13} /> {rsvp.email}</div>}
                    </div>

                    <div className="admin-card-footer">
                      <span className={`admin-badge ${rsvp.accommodation_needed ? 'admin-badge-yes' : 'admin-badge-no'}`}>
                        {rsvp.accommodation_needed ? 'Needs stay' : 'No stay'}
                      </span>
                      <span className="admin-card-date">
                        <Calendar size={12} />
                        {rsvp.formatted_date}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Detail modal */}
      {selectedRsvp && (
        <div className="admin-modal-overlay" onClick={() => setSelectedRsvp(null)}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
          >
            <button
              ref={closeButtonRef}
              className="admin-modal-close"
              onClick={() => setSelectedRsvp(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h3 id="admin-modal-title">RSVP Details</h3>
            <div className="admin-modal-content">
              <div className="admin-modal-field">
                <label>Name</label>
                <div>{selectedRsvp.name}</div>
              </div>
              <div className="admin-modal-field">
                <label>Phone</label>
                <div>
                  <a href={`tel:${selectedRsvp.phone}`} className="admin-modal-link">
                    {selectedRsvp.phone}
                  </a>
                </div>
              </div>
              {selectedRsvp.email && (
                <div className="admin-modal-field">
                  <label>Email</label>
                  <div>
                    <a href={`mailto:${selectedRsvp.email}`} className="admin-modal-link">
                      {selectedRsvp.email}
                    </a>
                  </div>
                </div>
              )}
              <div className="admin-modal-field">
                <label>Attending</label>
                <div>
                  <DayPills ids={selectedRsvp.days_attending} />
                </div>
              </div>
              <div className="admin-modal-field">
                <label>Number of Guests</label>
                <div>{selectedRsvp.guest_count}</div>
              </div>
              <div className="admin-modal-field">
                <label>Accommodation Required</label>
                <div>{selectedRsvp.accommodation_needed ? 'Yes' : 'No'}</div>
              </div>
              <div className="admin-modal-field">
                <label>Submitted</label>
                <div>{selectedRsvp.formatted_date}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
