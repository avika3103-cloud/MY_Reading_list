import { useEffect, useMemo, useState } from 'react';
import { Plus, BookOpen, Library, Trash2, Check, X, AlertCircle } from 'lucide-react';
import type { Book, ReadingStatus } from '@/types';
import { STATUS_META, STATUS_ORDER } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type Filter = ReadingStatus | 'all';

const STORAGE_KEY = 'reading-list:books';
const MAX_TITLE = 60;

export default function App() {
  const [books, setBooks] = useLocalStorage<Book[]>(STORAGE_KEY, []);
  const [filter, setFilter] = useState<Filter>('all');
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Reading List';
  }, []);

  const counts = useMemo(() => {
    return books.reduce(
      (acc, b) => {
        acc[b.status] += 1;
        acc.all += 1;
        return acc;
      },
      { all: 0, want: 0, reading: 0, finished: 0 } as Record<Filter, number>,
    );
  }, [books]);

  const visible = useMemo(() => {
    const list = filter === 'all' ? books : books.filter((b) => b.status === filter);
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [books, filter]);

  const addBook = () => {
    const title = draft.trim();
    if (!title) return;
    if (title.length > MAX_TITLE) {
      setError('Book title must be 60 characters or fewer.');
      return;
    }
    const normalized = title.toLowerCase().replace(/\s+/g, ' ');
    if (books.some((b) => b.title.toLowerCase().replace(/\s+/g, ' ') === normalized)) {
      setError('This book is already in your reading list.');
      return;
    }
    setBooks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title, status: 'want', createdAt: Date.now() },
    ]);
    setDraft('');
    setError('');
    setAdding(false);
  };

  const setStatus = (id: string, status: ReadingStatus) =>
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));

  const removeBook = (id: string) =>
    setBooks((prev) => prev.filter((b) => b.id !== id));

  const cancelAdd = () => {
    setDraft('');
    setError('');
    setAdding(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <Header count={counts.all} />

        <FilterBar filter={filter} setFilter={setFilter} counts={counts} />

        <Summary counts={counts} />

        <div className="mt-6">
          {visible.length === 0 ? (
            <EmptyState hasBooks={books.length > 0} filter={filter} />
          ) : (
            <ul className="space-y-3">
              {visible.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onSetStatus={setStatus}
                  onRemove={removeBook}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <AddBar
        draft={draft}
        setDraft={setDraft}
        onAdd={addBook}
        onCancel={cancelAdd}
        adding={adding}
        setAdding={setAdding}
        error={error}
        setError={setError}
      />
    </div>
  );
}

function Header({ count }: { count: number }) {
  return (
    <header className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-sm">
        <BookOpen className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
          Reading List
        </h1>
        <p className="text-sm text-stone-500">
          {count === 0
            ? 'Track what you want to read'
            : `${count} book${count === 1 ? '' : 's'} on your shelf`}
        </p>
      </div>
    </header>
  );
}

function FilterBar({
  filter,
  setFilter,
  counts,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  counts: Record<Filter, number>;
}) {
  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    ...STATUS_ORDER.map((s) => ({ key: s as Filter, label: STATUS_META[s].label })),
  ];

  return (
    <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
      {tabs.map((tab) => {
        const active = filter === tab.key;
        const meta = tab.key !== 'all' ? STATUS_META[tab.key as ReadingStatus] : null;
        return (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={[
              'flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
              active
                ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50',
            ].join(' ')}
          >
            {meta && <span className={`h-2 w-2 rounded-full ${meta.dot}`} />}
            <span>{tab.label}</span>
            <span
              className={[
                'rounded-full px-1.5 py-0.5 text-xs tabular-nums',
                active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500',
              ].join(' ')}
            >
              {counts[tab.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Summary({ counts }: { counts: Record<Filter, number> }) {
  const items = [
    { label: 'Total Books', value: counts.all, icon: BookOpen, tone: 'bg-stone-900 text-white' },
    { label: 'Currently Reading', value: counts.reading, icon: BookOpen, tone: 'bg-sky-500 text-white' },
    { label: 'Finished', value: counts.finished, icon: Check, tone: 'bg-emerald-500 text-white' },
  ];

  return (
    <div className="mt-4 grid grid-cols-3 gap-2.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white p-3 shadow-sm"
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tone}`}>
            <item.icon className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <span className="mt-2 text-2xl font-bold tabular-nums text-stone-900">
            {item.value}
          </span>
          <span className="text-center text-[11px] font-medium leading-tight text-stone-500">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasBooks, filter }: { hasBooks: boolean; filter: Filter }) {
  return (
    <div className="mt-16 flex flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <Library className="h-7 w-7" strokeWidth={1.8} />
      </div>
      {hasBooks && filter !== 'all' ? (
        <p className="mt-4 text-sm text-stone-500">
          No books in this category yet.
        </p>
      ) : (
        <p className="mt-4 max-w-xs text-sm text-stone-500">
          Your reading list is empty. Add your first book.
        </p>
      )}
    </div>
  );
}

function BookCard({
  book,
  onSetStatus,
  onRemove,
}: {
  book: Book;
  onSetStatus: (id: string, status: ReadingStatus) => void;
  onRemove: (id: string) => void;
}) {
  const meta = STATUS_META[book.status];

  return (
    <li className="group rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-stone-900">
            {book.title}
          </h3>
          <span
            className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>
        <button
          onClick={() => onRemove(book.id)}
          aria-label="Remove book"
          className="shrink-0 rounded-lg p-1.5 text-stone-300 transition hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {STATUS_ORDER.map((s) => {
          const m = STATUS_META[s];
          const active = book.status === s;
          return (
            <button
              key={s}
              onClick={() => onSetStatus(book.id, s)}
              className={[
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
                active
                  ? `${m.badge} ring-1 ${m.ring} ring-offset-0`
                  : 'border-stone-200 bg-white text-stone-500 hover:bg-stone-50',
              ].join(' ')}
            >
              {active ? <Check className="h-3 w-3" /> : <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />}
              {m.label}
            </button>
          );
        })}
        <button
          onClick={() => onRemove(book.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </li>
  );
}

function AddBar({
  draft,
  setDraft,
  onAdd,
  onCancel,
  adding,
  setAdding,
  error,
  setError,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  adding: boolean;
  setAdding: (v: boolean) => void;
  error: string;
  setError: (v: string) => void;
}) {
  const remaining = MAX_TITLE - draft.length;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
        {adding ? (
          <div>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onAdd();
                  if (e.key === 'Escape') onCancel();
                }}
                placeholder="Book title"
                className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
              <button
                onClick={onAdd}
                disabled={!draft.trim()}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
              <button
                onClick={onCancel}
                aria-label="Cancel"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-500 transition hover:bg-stone-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1">
              {error ? (
                <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {error}
                </p>
              ) : (
                <span />
              )}
              <span
                className={`text-xs tabular-nums ${remaining < 0 ? 'text-red-500' : 'text-stone-400'}`}
              >
                {remaining}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
          >
            <Plus className="h-4 w-4" />
            Add a book
          </button>
        )}
      </div>
    </div>
  );
}
