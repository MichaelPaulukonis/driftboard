import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetBoardByIdQuery } from '../api/boardsApi';

export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: board, error, isLoading } = useGetBoardByIdQuery(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-semibold mb-2">Error loading board</h2>
            <p className="mb-4">Board not found or failed to load.</p>
            <Link 
              to="/boards" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Boards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link 
              to="/boards" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Boards
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">{board.name}</h1>
          {board.description && (
            <p className="text-gray-600 mt-2">{board.description}</p>
          )}
        </div>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Add List
        </button>
      </div>

      {/* Board Content */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        {board.lists && board.lists.length > 0 ? (
          board.lists.map((list) => (
            <div key={list.id} className="bg-gray-100 rounded-lg p-4 min-w-80 max-w-80">
              {/* List Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{list.name}</h3>
                <button className="text-gray-500 hover:text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>

              {/* Cards */}
              <div className="space-y-3 mb-4">
                {list.cards && list.cards.length > 0 ? (
                  list.cards.map((card) => (
                    <div 
                      key={card.id} 
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <h4 className="font-medium text-gray-800 mb-1">{card.title}</h4>
                      {card.description && (
                        <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                      )}
                      
                      {/* Card metadata */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {card.labels && card.labels.length > 0 && (
                            <div className="flex gap-1">
                              {card.labels.map((label) => (
                                <span
                                  key={label.id}
                                  className="inline-block w-3 h-3 rounded-full"
                                  style={{ backgroundColor: label.color }}
                                  title={label.name}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {card.dueDate && (
                          <span className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded">
                            Due: {new Date(card.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No cards yet</p>
                  </div>
                )}
              </div>

              {/* Add Card Button */}
              <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded font-medium transition-colors text-sm">
                + Add a card
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 w-full">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lists yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first list.</p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Create First List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
