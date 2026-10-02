import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, trend, color = 'blue' }) => {
  const colorSchemes = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`rounded-xl p-3 border ${scheme}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      {(subtext || trend) && (
        <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-1">
          {trend && (
            <span className={`font-semibold ${trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
};
