import './globals.css';
import React from 'react';

export const metadata = {
  title: 'UrScore AI - Developer Placement Intelligence',
  description: 'Stateless parallel analysis scanner & verification engine cross-referencing public codebase assets with resumes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-[#020306] text-slate-100 selection:bg-emerald-500 selection:text-black">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
