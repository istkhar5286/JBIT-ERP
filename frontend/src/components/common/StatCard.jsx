import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
  className = ''
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50/80',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      glow: 'group-hover:border-indigo-300'
    },
    emerald: {
      bg: 'bg-emerald-50/80',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      glow: 'group-hover:border-emerald-300'
    },
    amber: {
      bg: 'bg-amber-50/80',
      text: 'text-amber-600',
      border: 'border-amber-100',
      glow: 'group-hover:border-amber-300'
    },
    rose: {
      bg: 'bg-rose-50/80',
      text: 'text-rose-600',
      border: 'border-rose-100',
      glow: 'group-hover:border-rose-300'
    },
    sky: {
      bg: 'bg-sky-50/80',
      text: 'text-sky-600',
      border: 'border-sky-100',
      glow: 'group-hover:border-sky-300'
    },
    purple: {
      bg: 'bg-purple-50/80',
      text: 'text-purple-600',
      border: 'border-purple-100',
      glow: 'group-hover:border-purple-300'
    }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white p-5 shadow-soft border ${scheme.border} ${scheme.glow} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {value}
            </h3>
            {trend && (
              <span className={`text-xs font-semibold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend.text}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 pt-0.5">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${scheme.bg} ${scheme.text} shadow-sm transition-transform group-hover:scale-105`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Bottom accent glow */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
    </div>
  );
};
