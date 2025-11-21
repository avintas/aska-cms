import { FC } from 'react';
import Link from 'next/link';
import { getSession } from '@/app/actions/auth';
import UserMenu from './UserMenu';

const Header: FC = async () => {
  const { user } = await getSession();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2.5">
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
              href="/source-content-updater"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
            >
              Source Updater
            </Link>
          </nav>
          <div className="flex items-center">
            {user && <UserMenu userEmail={user.email} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
