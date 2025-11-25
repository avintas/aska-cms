import React, { FC } from 'react';
import Link from 'next/link';

interface ActionItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  color?: string;
}

interface ActionPanelProps {
  actions: ActionItem[];
}

const ActionPanel: FC<ActionPanelProps> = ({ actions }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-xl shadow-slate-500/10 dark:border-slate-800 dark:bg-slate-900/80">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-200 bg-slate-50 transition-all hover:border-primary-brand/50 hover:bg-primary-brand/5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-primary-brand/50"
          >
            <div className="mb-3 p-2 rounded-xl bg-white dark:bg-slate-800 group-hover:scale-110 transition-transform">
              {action.icon}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">
              {action.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ActionPanel;

