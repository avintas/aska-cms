import { FC, ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

const StatCard: FC<StatCardProps> = ({ title, value, icon, change, changeType = 'neutral' }) => {
  const changeColor =
    changeType === 'positive'
      ? 'text-green-700'
      : changeType === 'negative'
        ? 'text-red-700'
        : 'text-gray-600';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-2xl font-semibold text-gray-900 mb-1">{value}</p>
          {change && (
            <p className={`text-xs ${changeColor} font-medium`}>
              {changeType === 'positive' && '↑ '}
              {changeType === 'negative' && '↓ '}
              {change}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
