/**
 * Task status / priority display metadata.
 *
 * Single source of truth for how the Kanban columns, task rows, badges and
 * icons are rendered across the tasks pages — previously duplicated switch
 * statements in three files that could (and did) drift apart.
 */

import { AlertCircle, CheckCircle2, Circle, Clock, Eye, Inbox, type LucideIcon } from 'lucide-react';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Badge variants accepted by components/ui/badge. */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/** Every status, in board-column order. */
export const TASK_STATUSES: readonly TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'BLOCKED',
];

export interface StatusMeta {
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon's color. */
  iconClassName: string;
  badgeVariant: BadgeVariant;
}

const STATUS_META: Record<TaskStatus, StatusMeta> = {
  BACKLOG: {
    label: 'Backlog',
    icon: Inbox,
    iconClassName: 'text-gray-400',
    badgeVariant: 'outline',
  },
  TODO: {
    label: 'To do',
    icon: Circle,
    iconClassName: 'text-gray-400',
    badgeVariant: 'outline',
  },
  IN_PROGRESS: {
    label: 'In progress',
    icon: Clock,
    iconClassName: 'text-blue-500',
    badgeVariant: 'secondary',
  },
  IN_REVIEW: {
    label: 'In review',
    icon: Eye,
    iconClassName: 'text-purple-500',
    badgeVariant: 'outline',
  },
  DONE: {
    label: 'Done',
    icon: CheckCircle2,
    iconClassName: 'text-green-500',
    badgeVariant: 'default',
  },
  BLOCKED: {
    label: 'Blocked',
    icon: AlertCircle,
    iconClassName: 'text-red-500',
    badgeVariant: 'destructive',
  },
};

/** Display metadata for a status; unknown values fall back to Backlog. */
export function statusMeta(status: string): StatusMeta {
  return STATUS_META[(status as TaskStatus) in STATUS_META ? (status as TaskStatus) : 'BACKLOG'];
}

/** Status icon component + its default color classes for a status. */
export function statusIcon(status: string): { icon: LucideIcon; iconClassName: string } {
  const { icon, iconClassName } = statusMeta(status);
  return { icon, iconClassName };
}

const PRIORITY_BADGE_VARIANTS: Record<TaskPriority, BadgeVariant> = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'default',
  CRITICAL: 'destructive',
};

/** Badge variant for a priority; unknown values fall back to outline. */
export function priorityBadgeVariant(priority: string): BadgeVariant {
  return PRIORITY_BADGE_VARIANTS[(priority as TaskPriority) in PRIORITY_BADGE_VARIANTS
    ? (priority as TaskPriority)
    : 'LOW'];
}
