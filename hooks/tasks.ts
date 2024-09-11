import { useDispatch } from 'react-redux';
import { addTask, updateTask, deleteTask, setTasks } from '../store/tasksSlice';
import { Task } from '../types';
import { RootState } from '../store/store';

export const useTasks = () => {
  const selectTasks = (state: RootState) => state.tasks.tasks

  const selectTaskById = (state: RootState, id: number) => {
    return state.tasks.tasks.find(task => task.id === id);
  };

  return {
    selectTasks,
    selectTaskById
  }
}


export const useTasksActions = () => {
  const dispatch = useDispatch();

  const dispatchSetTasks = (tasks: Task[]) => {
    dispatch(setTasks(tasks));
  };

  const dispatchAddTask = (task: Task) => {
    dispatch(addTask(task));
  };

  const dispatchUpdateTask = (id: number, updates: Partial<Task>) => {
    dispatch(updateTask({ id, updates }));
  };

  const dispatchDeleteTask = (taskId: number) => {
    dispatch(deleteTask(taskId));
  };

  return {
    dispatchSetTasks,
    dispatchAddTask,
    dispatchUpdateTask,
    dispatchDeleteTask,
  };
};