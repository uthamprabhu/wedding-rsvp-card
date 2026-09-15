'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, UserCheck, BedDouble, TrendingUp, Clock,
  Search, LogOut, SlidersHorizontal, X, Mail, Phone,
  Calendar, UserRound
} from 'lucide-react';
import type { DashboardStats, RsvpWithDetails } from '@/lib/admin-queries';

interface DashboardClientProps {
  stats: DashboardStats;
  rsvps: RsvpWithDetails[];
  initialFilters: {
    searchTerm: string;
    accommodationFilter: 'all' | 'yes' | 'no';
    sortBy: 'date_desc' | 'date_asc' | 'name_asc' | 'guests_desc';
  };
}

export default function DashboardClient({ stats, rsvps, initialFilters }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm);
  const [accommodationFilter, setAccommodationFilter] = useState(initialFilters.accommodationFilter);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);
  const [selectedRsvp, setSelectedRsvp] = useState<RsvpWithDetails | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const updateFilters = (updates: Partial<typeof initialFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.searchTerm !== undefined) {
      if (updates.searchTerm) {
        params.set('search', updates.searchTerm);
      } else {
        params.delete('search');
      }
    }
    
    if (updates.accommodationFilter !== undefined) {
      if (updates.accommodationFilter === 'all') {
        params.delete('accommodation');
      } else {
        params.set('accommodation', updates.accommodationFilter);
      }
    }
    
    if (updates.sortBy !== undefined) {
      params.set('sort', updates.sortBy);
    }
    
    startTransition(() => {
      router.push(`/admin/dashboard?${params.toString()}`);
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ searchTerm });
  };

  const handleAccommodationChange = (value: 'all' | 'yes' | 'no') => {
    setAccommodationFilter(value);
    updateFilters({ accommodationFilter: value });
  };

  const handleSortChange = (value: typeof sortBy) => {
    setSortBy(value);
    updateFilters({ sortBy: value });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin');
      router.refresh();
    } catch (error) {
      setIsLoggingOut(false);
    }
  };

  const statCards = [
    { icon: Users, label: 'Total Responses', value: stats.totalResponses, color: '#a6814e' },
    { icon: UserCheck, label: 'Total Guests', value: stats.totalGuests, color: '#6d8a5f' },
    { icon: BedDouble, label: 'Accommodation Needed', value: stats.accommodationNeeded, color: '#8d6e42' },
    { icon: TrendingUp, label: 'Avg Party Size', value: stats.averagePartySize.toFixed(1), color: '#9b7856' },
    { icon: Clock, label: 'Last 7 Days', value: stats.recentResponses, color: '#7a6b5d' },
  ];

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-header-content">
          <div>
            <div className="admin-dashboard-monogram">F <span>&</span> B</div>
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
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </header>

      <div className="admin-dashboard-content">
        {/* Stats Grid */}
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

        {/* RSVP List Section */}
        <section className="admin-rsvp-section">
          <div className="admin-rsvp-header">
            <div>
              <h2>All Responses</h2>
              <p>{rsvps.length} {rsvps.length === 1 ? 'response' : 'responses'} found</p>
            </div>
          </div>

          {/* Filters */}
          <div className="admin-filters">
            <form onSubmit={handleSearchSubmit} className="admin-search-form">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    updateFilters({ searchTerm: '' });
                  }}
                  className="admin-search-clear"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            <div className="admin-filter-row">
              <div className="admin-filter-group">
                <SlidersHorizontal size={14} />
                <span>Accommodation:</span>
                <select
                  value={accommodationFilter}
                  onChange={(e) => handleAccommodationChange(e.target.value as typeof accommodationFilter)}
                >
                  <option value="all">All</option>
                  <option value="yes">Needed</option>
                  <option value="no">Not Needed</option>
                </select>
              </div>

              <div className="admin-filter-group">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="guests_desc">Most Guests</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading Overlay */}
          {isPending && (
            <div className="admin-loading-overlay">
              <div className="admin-loading-spinner" />
            </div>
          )}

          {/* Desktop Table */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Guests</th>
                  <th>Accommodation</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">
                      No responses found
                    </td>
                  </tr>
                ) : (
                  rsvps.map((rsvp) => (
                    <tr
                      key={rsvp.id}
                      onClick={() => setSelectedRsvp(rsvp)}
                      className="admin-table-row-clickable"
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
                      <td>
                        <span className="admin-badge admin-badge-guests">
                          {rsvp.guest_count}
                        </span>
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

          {/* Mobile Cards */}
          <div className="admin-cards">
            {rsvps.length === 0 ? (
              <div className="admin-cards-empty">No responses found</div>
            ) : (
              rsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="admin-card"
                  onClick={() => setSelectedRsvp(rsvp)}
                >
                  <div className="admin-card-header">
                    <div className="admin-card-name">
                      <UserRound size={18} />
                      <span>{rsvp.name}</span>
                    </div>
                    <div className="admin-card-badges">
                      <span className="admin-badge admin-badge-guests">{rsvp.guest_count}</span>
                      <span className={`admin-badge ${rsvp.accommodation_needed ? 'admin-badge-yes' : 'admin-badge-no'}`}>
                        {rsvp.accommodation_needed ? 'Accommodation' : 'No accommodation'}
                      </span>
                    </div>
                  </div>
                  <div className="admin-card-contact">
                    <div><Phone size={13} /> {rsvp.phone}</div>
                    {rsvp.email && <div><Mail size={13} /> {rsvp.email}</div>}
                  </div>
                  <div className="admin-card-date">
                    <Calendar size={12} />
                    <span>{rsvp.formatted_date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Detail Modal */}
      {selectedRsvp && (
        <div className="admin-modal-overlay" onClick={() => setSelectedRsvp(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="admin-modal-close"
              onClick={() => setSelectedRsvp(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h3>RSVP Details</h3>
            <div className="admin-modal-content">
              <div className="admin-modal-field">
                <label>Name</label>
                <div>{selectedRsvp.name}</div>
              </div>
              <div className="admin-modal-field">
                <label>Phone</label>
                <div>{selectedRsvp.phone}</div>
              </div>
              {selectedRsvp.email && (
                <div className="admin-modal-field">
                  <label>Email</label>
                  <div>{selectedRsvp.email}</div>
                </div>
              )}
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
