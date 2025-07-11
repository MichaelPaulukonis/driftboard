import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
};
