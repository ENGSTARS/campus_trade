import React from 'react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-brand-100/60 py-6 mt-10">
      <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-2 text-sm text-slate-600">
          <span>&copy; {new Date().getFullYear()} CampusTrade</span>
          <span className="hidden md:inline">|</span>
          <a href="/" className="hover:text-brand-700">Home</a>
          <a href="/profile" className="hover:text-brand-700">Profile</a>
          <a href="/sell" className="hover:text-brand-700">Sell</a>
          <a href="/messages" className="hover:text-brand-700">Messages</a>
        </div>
        <div className="flex gap-3">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-700">Facebook</a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-700">Twitter</a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-700">Instagram</a>
        </div>
      </div>
    </footer>
  );
}
