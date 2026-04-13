import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: {
    username: 'Demo User',
    profilePicture: null
  },
  isAuthenticated: false,
  loading: false,
  error: null,
  suggestedUsers: []
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setSuggestedUsers: (state, action) => {
      state.suggestedUsers = action.payload;
    }
  }
});

export const { setUser, clearUser, setLoading, setError, setSuggestedUsers } = authSlice.actions;

export default authSlice.reducer;