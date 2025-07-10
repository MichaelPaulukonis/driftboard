import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const Header: React.FC = () => {
  const location = useLocation();
  const isOnBoardsPage = location.pathname === '/' || location.pathname === '/boards';

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
                <Button variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                  All Boards
                </Button>
              </Link>
            )}
            
            {/* Future: User menu, settings, etc. */}
            <div className="text-sm text-blue-100">
              Phase 1 MVP
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
