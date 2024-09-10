import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../types';

interface TasksState {
  tasks: Task[];
}

const initialState: TasksState = {
  tasks: [],
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks(state, action: PayloadAction<Task[]>) {
      state.tasks = action.payload;
    },
    addTask(state, action: PayloadAction<Task>) {
      state.tasks.push(action.payload);
    },
    updateTask(state, action: PayloadAction<{ id: number; updates: Partial<Task> }>) {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = {
          ...state.tasks[index],
          ...action.payload.updates,
          updatedAt: new Date().toISOString()
        };
      }
      state.tasks.sort((a: Task, b: Task) => {
        const aTime = new Date(a.updatedAt).getTime()
        const bTime = new Date(b.updatedAt).getTime()
        return bTime - aTime
      })
    },
    deleteTask(state, action: PayloadAction<number>) {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
    },
  },
});

export const { setTasks, addTask, updateTask, deleteTask } = tasksSlice.actions;

export default tasksSlice.reducer;