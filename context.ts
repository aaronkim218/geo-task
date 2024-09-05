import { createContext, useContext } from "react";
import * as SQLite from 'expo-sqlite';

export const DBContext = createContext<SQLite.SQLiteDatabase | undefined>(undefined);

export const useDB = () => {
  const db = useContext(DBContext)
  if (db) {
    return db
  } else {
    throw new Error('DB not initialized')
  }
}

export const TaskNameContext = createContext<string | undefined>(undefined);

export const useTaskName = () => {
  const taskName = useContext(TaskNameContext)
  if (taskName) {
    return taskName
  } else {
    throw new Error('Task name not set')
  }
}
