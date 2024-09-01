import { createContext, useContext } from "react";
import * as SQLite from 'expo-sqlite';

export const DBContext = createContext<SQLite.SQLiteDatabase | undefined>(undefined);

export const useDB = () => {
  return useContext(DBContext)
}

