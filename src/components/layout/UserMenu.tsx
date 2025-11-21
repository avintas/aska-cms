'use client';

import { FC, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/app/actions/auth';

interface UserMenuProps {
  userEmail: string;
}

const UserMenu: FC<UserMenuProps> = ({ userEmail }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async (): Promise<void> => {
    setLoading(true);
    const result = await signOut();

    if (result.success) {
      router.push('/login');
      router.refresh();
    } else {
      setLoading(false);
      alert('Failed to sign out');
    }
  };

  const initials = userEmail
    .split('@')[0]
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
      >
        <span className="text-gray-600 text-xs font-medium">{initials}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">Signed in as</p>
              <p className="text-sm text-gray-600 truncate">{userEmail}</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;

