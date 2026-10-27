import React from 'react';
import { Provenance } from '@/lib/domain/types';

interface ProvenanceBadgeProps {
  provenance: Provenance;
  className?: string;
}

const BADGE_CONFIG: Record<
  Provenance,
  { label: string; icon: string; classes: string }
> = {
  user: {
    label: 'Your input',
    icon: '✎',
    classes: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800',
  },
  derived: {
    label: 'Derived',
    icon: '⚙',
    classes: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
  },
  heuristic: {
    label: 'Heuristic',
    icon: '◆',
    classes: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
  },
  ai: {
    label: 'AI estimate',
    icon: '✦',
    classes: 'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800',
  },
  vendor: {
    label: 'Vendor quote',
    icon: '🏷',
    classes: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
  },
};

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  provenance,
  className = '',
}) => {
  const config = BADGE_CONFIG[provenance] || BADGE_CONFIG.derived;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border shadow-xs tracking-wide select-none ${config.classes} ${className}`}
      title={`Provenance: ${config.label}`}
      role="status"
      aria-label={`Data source: ${config.label}`}
    >
      <span aria-hidden="true" className="text-[10px] leading-none">
        {config.icon}
      </span>
      <span>{config.label}</span>
    </span>
  );
};
