'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from '../components/Dashboard';

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#030408] text-slate-100 flex flex-col">
        {/* App Navbar */}
        <nav className="w-full bg-[#030509]/85 backdrop-blur-md border-b border-emerald-500/10 px-8 py-4 flex items-center justify-between z-20 relative">
          <div className="flex items-center gap-4 pl-2">
            <img src="/logo.png" className="w-11 h-11 object-contain rounded-xl shadow-md border border-emerald-500/10" alt="UrScore AI Logo" />
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent pt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              UrScore AI
            </span>
          </div>
          <div className="flex items-center">
            {/* Right side logo metadata removed as requested */}
          </div>
        </nav>

        {/* Dashboard Main Content Area */}
        <main className="flex-1">
          <Dashboard />
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-slate-900/60 py-6 text-center text-xs text-slate-600 bg-[#05060b] z-20 relative font-semibold">
          &copy; {new Date().getFullYear()} UrScore AI Platform. Powered by parallel worker engine. All rights reserved.
        </footer>
      </div>
    </QueryClientProvider>
  );
}

