'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-gray-900">PC Builder</Link>
          <Link href="/builder" className="text-sm text-gray-600 hover:text-gray-900">Builder</Link>
          {user && (
            <Link href="/builds" className="text-sm text-gray-600 hover:text-gray-900">Mis Builds</Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-500">{user.email}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Login</Link>
              <Link href="/register" className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
