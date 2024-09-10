import { useDispatch } from 'react-redux';
import { addItem, updateItem, deleteItem, setItems, decrementCurrentTempID } from '../store/itemsSlice';
import { Item } from '../types';
import { RootState } from '../store/store';
import { createSelector } from 'reselect';

export const useItems = () => {
  const selectItems = (state: RootState) => state.items.items;
  const selectTaskId = (_state: RootState, taskId: number) => taskId;
  
  const selectItemsByTaskId = createSelector(
    [selectItems, selectTaskId],
    (items, taskId) => items.filter(item => item.taskId === taskId)
  );

  const selectCurrentTempID = (state: RootState) => state.items.currentTempID

  return {
    selectItems,
    selectItemsByTaskId,
    selectCurrentTempID
  }
}

export const useItemsActions = () => {
  const dispatch = useDispatch();

  const dispatchSetItems = (items: Item[]) => {
    dispatch(setItems(items));
  };

  const dispatchAddItem = (item: Item) => {
    dispatch(addItem(item));
  };

  const dispatchUpdateItem = (id: number, updates: Partial<Item>) => {
    dispatch(updateItem({ id, updates }));
  };

  const dispatchDeleteItem = (id: number) => {
    dispatch(deleteItem(id));
  };

  const dispatchDecrementCurrentTempID = () => {
    dispatch(decrementCurrentTempID())
  }

  return {
    dispatchSetItems,
    dispatchAddItem,
    dispatchUpdateItem,
    dispatchDeleteItem,
    dispatchDecrementCurrentTempID
  };
};