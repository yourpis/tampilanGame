import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  alert: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setAlert: (state, action) => {
      state.alert = action.payload;
    },
  },
});

export const { setUser, setAlert } = userSlice.actions;

export const selectUser = (state) => state.user.user;
export const selectAlert = (state) => state.user.alert;

export default userSlice.reducer;
