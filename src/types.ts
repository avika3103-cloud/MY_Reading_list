export type ReadingStatus = 'want' | 'reading' | 'finished';

export interface Book {
  id: string;
  title: string;
  status: ReadingStatus;
  createdAt: number;
}

export const STATUS_META: Record<
  ReadingStatus,
  { label: string; short: string; dot: string; badge: string; ring: string }
> = {
  want: {
    label: 'Want to Read',
    short: 'Want',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    ring: 'focus:ring-amber-400',
  },
  reading: {
    label: 'Reading',
    short: 'Reading',
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    ring: 'focus:ring-sky-400',
  },
  finished: {
    label: 'Finished',
    short: 'Done',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ring: 'focus:ring-emerald-400',
  },
};

export const STATUS_ORDER: ReadingStatus[] = ['want', 'reading', 'finished'];
