import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'TaskVIKS Tracker',
  description: 'Minimalistic task-tracking app with Supabase'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-slate-900">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-border bg-panel py-3 px-6 flex items-center justify-between">
            <div className="font-semibold">TaskVIKS Tracker</div>
            <div className="text-sm text-muted">Light, focused workspace</div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
