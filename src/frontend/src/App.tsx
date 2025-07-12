import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';

import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BoardsPage } from './pages/BoardsPage';
import { BoardDetailPage } from './pages/BoardDetailPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage'; // Import SignUpPage
import { auth } from './firebase';
import { setUser, setLoading } from './store/authSlice';
import './App.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        dispatch(setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          idToken,
        }));
      } else {
        dispatch(setUser(null));
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} /> {/* Add sign-up route */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<BoardsPage />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/boards/:id" element={<BoardDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
