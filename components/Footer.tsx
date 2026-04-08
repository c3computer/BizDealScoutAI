import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="max-w-7xl mx-auto mt-20 mb-10 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 text-slate-500 text-sm font-mono">
      <p>© {new Date().getFullYear()} C4 Infinity LLC · Acquisition Edge · All Rights Reserved</p>
      <div className="flex gap-6 mt-4 md:mt-0 uppercase tracking-widest text-xs">
        <a href="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</a>
        <a href="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</a>
        <a href="/about" className="hover:text-amber-400 transition-colors">About Us</a>
        <a href="/contact" className="hover:text-amber-400 transition-colors">Contact</a>
      </div>
    </footer>
  );
};
