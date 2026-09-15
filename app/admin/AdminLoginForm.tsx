'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn } from 'lucide-react';

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to dashboard
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(data.message || 'Invalid password');
        setPassword('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-login-form">
      <div className="admin-login-field">
        <label htmlFor="admin-password">
          <Lock size={16} />
          <span>Admin Password</span>
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your admin password"
          required
          autoFocus
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="admin-login-error" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="admin-login-submit"
        disabled={isLoading || !password.trim()}
      >
        <LogIn size={18} />
        <span>{isLoading ? 'Verifying...' : 'Access Dashboard'}</span>
      </button>
    </form>
  );
}
