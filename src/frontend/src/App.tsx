import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { BoardsPage } from './pages/BoardsPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">DriftBoard</h1>
        <p className="text-blue-100">Personal Kanban Board</p>
      </header>
      <main className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<BoardsPage />} />
          <Route path="/boards" element={<BoardsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
