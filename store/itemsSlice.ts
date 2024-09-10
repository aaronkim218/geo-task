import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Item } from '../types';

interface ItemsState {
  items: Item[];
  currentTempID: number;
}

const initialState: ItemsState = {
  items: [],
  currentTempID: 0
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    setItems(state, action: PayloadAction<Item[]>) {
      state.items = action.payload;
    },
    addItem(state, action: PayloadAction<Item>) {
      state.items.push(action.payload);
    },
    updateItem(state, action: PayloadAction<{ id: number; updates: Partial<Item> }>) {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload.updates
        };
      }
    },
    deleteItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    decrementCurrentTempID(state) {
      state.currentTempID -= 1
    }
  },
});

export const { setItems, addItem, updateItem, deleteItem, decrementCurrentTempID } = itemsSlice.actions;

export default itemsSlice.reducer;