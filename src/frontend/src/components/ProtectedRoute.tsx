import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { RootState } from '../store';

export const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    // You can return a loading spinner here
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
