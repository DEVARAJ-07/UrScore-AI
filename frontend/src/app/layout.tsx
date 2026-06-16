import './globals.css';
import React from 'react';

export const metadata = {
  title: 'UrScore AI - measure your level by your profiles',
  description: 'Stateless parallel analysis scanner & verification engine cross-referencing public codebase assets with resumes.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-[#020306] text-slate-100 selection:bg-emerald-500 selection:text-black">
      <body className="antialiased min-h-screen text-xs">
        {children}
      </body>
    </html>
  );
}

