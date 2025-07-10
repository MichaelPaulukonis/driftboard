import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BoardsPage } from './pages/BoardsPage';
import { BoardDetailPage } from './pages/BoardDetailPage';
import './App.css';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<BoardsPage />} />
        <Route path="/boards" element={<BoardsPage />} />
        <Route path="/boards/:id" element={<BoardDetailPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
