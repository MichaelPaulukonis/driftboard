import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export const ProfilePage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return (
      <div className="text-center p-10">
        <h2 className="text-2xl font-semibold">User not found.</h2>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">My Profile</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Display Name</label>
            <p className="text-lg text-gray-900">{user.displayName || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email Address</label>
            <p className="text-lg text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">User ID</label>
            <p className="text-sm text-gray-600 break-all">{user.uid}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
