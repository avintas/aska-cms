'use client';

import { FC, useEffect, useState } from 'react';
import Link from 'next/link';
import { getSession } from '@/app/actions/auth';
import UserMenu from './UserMenu';

/**
 * HeaderWrapper - Client Component that fetches session and renders the header.
 */
const HeaderWrapper: FC = () => {
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchSession(): Promise<void> {
      const { user } = await getSession();
      setUserEmail(user?.email);
    }
    fetchSession();
  }, []);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2.5">
              <div className="w-7 h-7 bg-primary-brand rounded flex items-center justify-center">
                <span className="text-white font-semibold text-sm">A</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Aska CMS</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/wisdom"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
            >
              Wisdom
            </Link>
            <Link
              href="/greetings"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
            >
              Greetings
            </Link>
            <Link
              href="/facts"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
            >
              Facts
            </Link>
            <Link
              href="/motivational"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
            >
              Motivational
            </Link>
            <Link
              href="/trivia-multiple-choice"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
            >
              MC Trivia
            </Link>
            <Link
              href="/trivia-true-false"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
            >
              T/F Trivia
            </Link>
            <Link
              href="/trivia-who-am-i"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
            >
              Who Am I
            </Link>
            <div className="h-6 w-px bg-gray-300 mx-1" />
            <Link
              href="/process-builders/build-trivia-set"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
            >
              Build Trivia Set
            </Link>
            <Link
              href="/sourcing"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
            >
              Sourcing
            </Link>
          </nav>
          <div className="flex items-center">
            {userEmail && <UserMenu userEmail={userEmail} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderWrapper;

