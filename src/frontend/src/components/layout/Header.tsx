import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/useLogout';

export const Header: React.FC = () => {
  const location = useLocation();
  const isOnBoardsPage = location.pathname === '/' || location.pathname === '/boards';
  const logout = useLogout();

  return (
    <header className="bg-blue-600 text-white shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/boards" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold">DriftBoard</h1>
            </Link>
            <p className="text-blue-100 text-sm">Personal Kanban Board</p>
          </div>

          <nav className="flex items-center gap-4">
            {!isOnBoardsPage && (
              <Link to="/boards">
                <Button variant="ghost" className="text-white hover:bg-blue-700">
                  All Boards
                </Button>
              </Link>
            )}
            
            <Link to="/profile">
              <Button variant="ghost" className="text-white hover:bg-blue-700">
                Profile
              </Button>
            </Link>

            <Button
              variant="ghost"
              className="text-white hover:bg-blue-700"
              onClick={logout}
            >
              Logout
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};
