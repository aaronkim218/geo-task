import React, { createContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import * as SQLite from 'expo-sqlite';
import HomeScreen from './screens/HomeScreen';
import TasksScreen from './screens/TasksScreen';
import TaskDetailsScreen from './screens/TaskDetailsScreen';
import SettingsScreen from './screens/SettingsScreen';
import CreateTaskScreen from './screens/CreateTaskScreen';
import { TaskStackParamList } from './types';
import { DBContext } from './context';

type BottomTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<TaskStackParamList>();

const TodoStackNavigator: React.FC = () => (
  <Stack.Navigator initialRouteName="TaskList">
    <Stack.Screen name="TaskList" component={TasksScreen} options={{ title: 'Tasks' }} />
    <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} options={{ title: 'Task Details' }} />
    <Stack.Screen name="CreateTask" component={CreateTaskScreen} options={{ title: 'Create Task' }} />
  </Stack.Navigator>
);

const App: React.FC = () => {
  const [db, setDB] = useState<SQLite.SQLiteDatabase | undefined>(undefined)

  useEffect(() => {
    const initDB = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('tasks.db')
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            details TEXT NOT NULL,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
          );
        `);
        await db.execAsync(`
          DELETE FROM tasks;
          DELETE FROM items;
        `);
        await db.execAsync(`INSERT INTO tasks (name) VALUES ('Prepare presentation')`);
        setDB(db)
        console.log("successfully intialized database")
      } catch (error) {
        console.error("Error initializing database: ", error)
      }
    }

    initDB()
  }, []);

  return (
    <DBContext.Provider value={db}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false, // Hide header for bottom tabs
            tabBarIcon: ({ color, size }) => {
              let iconName: string;

              if (route.name === 'Home') {
                iconName = 'home-outline';
              } else if (route.name === 'Tasks') {
                iconName = 'list-outline';
              } else if (route.name === 'Settings') {
                iconName = 'settings-outline';
              } else {
                iconName = 'ellipse';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: 'tomato',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Tasks" component={TodoStackNavigator} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </DBContext.Provider>
  )
};

export default App;