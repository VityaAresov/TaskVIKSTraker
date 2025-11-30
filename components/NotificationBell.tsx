'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

type Notification = {
  id: string;
  type: string;
  payload: Record<string, any>;
  created_at: string;
  is_read: boolean;
};

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);

  const fetchItems = async () => {
    const res = await fetch('/api/notifications');
    const json = await res.json();
    setItems(json.notifications ?? []);
  };

  useEffect(() => {
    fetchItems();
  }, [userId]);

  const unread = items.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    fetchItems();
  };

  return (
    <div className="relative">
      <button
        className="relative rounded-full border border-border bg-white p-2 hover:shadow-sm transition"
        onClick={() => {
          setOpen((v) => !v);
          fetchItems();
        }}
        aria-label="Notifications"
      >
        <span className="block w-5 h-5 text-slate-600">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center px-1">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 z-20">
          <Card className="shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">Notifications</div>
              <Button size="xs" variant="ghost" onClick={markAllRead}>
                Mark all read
              </Button>
            </div>
            <div className="flex flex-col gap-2 max-h-72 overflow-auto">
              {items.length === 0 && <div className="text-xs text-muted">No notifications yet.</div>}
              {items.map((item) => (
                <div key={item.id} className="rounded border border-border px-3 py-2 bg-white">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="uppercase tracking-wide">{item.type}</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-slate-800">
                    {item.payload?.message ?? 'Notification'}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
