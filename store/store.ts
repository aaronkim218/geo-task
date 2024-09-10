import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './tasksSlice';
import regionsReducer from './regionsSlice'

const store = configureStore({
  reducer: {
    tasks: taskReducer,
    regions: regionsReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;