import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminLoginForm from './AdminLoginForm';

export const metadata = {
  title: 'Admin Login - Wedding RSVP',
  robots: 'noindex, nofollow',
};

export default async function AdminLoginPage() {
  // If already authenticated, redirect to dashboard
  const isAuthenticated = await isAdminAuthenticated();
  if (isAuthenticated) {
    redirect('/admin/dashboard');
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-bg" />
      <div className="admin-login-wrap">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-login-monogram">F <span>&</span> B</div>
            <h1>Family Dashboard</h1>
            <p>Access your wedding RSVP management</p>
          </div>
          <AdminLoginForm />
        </div>
        <p className="admin-login-footer">
          Farzeen & Bilal Wedding · 2026
        </p>
      </div>
    </main>
  );
}
