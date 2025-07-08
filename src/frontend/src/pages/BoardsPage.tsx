import React from 'react';
import { useGetBoardsQuery } from '../api/boardsApi';

export function BoardsPage() {
  const { data: boards, error, isLoading } = useGetBoardsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          <h2 className="text-xl font-semibold mb-2">Error loading boards</h2>
          <p>Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Boards</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Create Board
        </button>
      </div>

      {boards && boards.length > 0 ? (
        <div className="board-grid">
          {boards.map((board) => (
            <div key={board.id} className="board-card">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {board.name}
              </h3>
              {board.description && (
                <p className="text-gray-600 mb-4">{board.description}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{board.lists?.length || 0} lists</span>
                <span>
                  {board.lists?.reduce((total, list) => total + (list.cards?.length || 0), 0) || 0} cards
                </span>
              </div>
              <div className="mt-4">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded font-medium transition-colors">
                  Open Board
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No boards yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first board.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Create Your First Board
          </button>
        </div>
      )}
    </div>
  );
}
