import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './tasksSlice';
import regionsReducer from './regionsSlice'
import itemsReducer from './itemsSlice';

const store = configureStore({
  reducer: {
    tasks: taskReducer,
    regions: regionsReducer,
    items: itemsReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;