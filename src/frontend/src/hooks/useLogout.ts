import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { logout as logoutAction } from '@/store/authSlice';
import { api } from '@/api/api';

export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await signOut(auth);
      dispatch(logoutAction());
      dispatch(api.util.resetApiState()); // Reset RTK Query cache
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Optionally, dispatch an error to the store
    }
  };

  return logout;
};
