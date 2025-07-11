import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthState {
  user: (Pick<FirebaseUser, 'uid' | 'email' | 'displayName'> & { idToken?: string }) | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: true, // Start with loading true to check for persisted login
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const { setLoading, setUser, setError, logout } = authSlice.actions;

export default authSlice.reducer;
