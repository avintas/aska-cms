import { FC, ReactNode } from 'react';
import Link from 'next/link';

interface QuickActionProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}

const QuickAction: FC<QuickActionProps> = ({
  title,
  description,
  icon,
  href,
  color = 'primary',
}) => {
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary-brand hover:bg-primary-brand/90 text-white border-primary-brand',
    secondary: 'bg-gray-700 hover:bg-gray-800 text-white border-gray-700',
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600',
  };

  return (
    <Link
      href={href}
      className={`${colorClasses[color]} rounded-lg border p-4 flex items-center space-x-3 transition-colors hover:shadow-sm`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold mb-0.5">{title}</h3>
        <p className="text-xs opacity-90 leading-tight">{description}</p>
      </div>
    </Link>
  );
};

export default QuickAction;
