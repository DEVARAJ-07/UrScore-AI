import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './components/Dashboard';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-slate-100 flex flex-col">
        {/* App Navbar */}
        <nav className="w-full bg-[#0d0f1a] border-b border-slate-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-extrabold text-sm uppercase tracking-widest text-violet-400">
              UrScore AI
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Developer Placement Readiness Hub v1.0.0
          </div>
        </nav>

        {/* Dashboard Main Content Area */}
        <main className="flex-1">
          <Dashboard />
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-slate-900 py-6 text-center text-xs text-slate-500 bg-[#07080f]">
          &copy; {new Date().getFullYear()} UrScore AI Platform. Powered by parallel worker engine. All rights reserved.
        </footer>
      </div>
    </QueryClientProvider>
  );
}
