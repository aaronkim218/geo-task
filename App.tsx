import React, { useEffect, useState } from 'react';
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
import { DBContext, TaskNameContext } from './context';
import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'
import { Button, Text, View, StyleSheet, AppState, Linking } from 'react-native';
import ErrorScreen from './screens/ErrorScreen';

const EXPO_PUBLIC_LOCATION_TASK_NAME = process.env.EXPO_PUBLIC_LOCATION_TASK_NAME;

if (!EXPO_PUBLIC_LOCATION_TASK_NAME) {
  throw new Error('Failed to load environment variables')
}

TaskManager.defineTask(EXPO_PUBLIC_LOCATION_TASK_NAME, ({ data: { eventType, region }, error }: { data: { eventType: Location.GeofencingEventType, region: Location.LocationRegion }, error: TaskManager.TaskManagerError | null }) => {
  if (error) {
    console.error('Error handling geofencing event - code: ', error.code, ' message: ', error.message)
    return;
  }
  if (eventType === Location.GeofencingEventType.Enter) {
    console.log("You've entered region:", region);
  } else if (eventType === Location.GeofencingEventType.Exit) {
    console.log("You've left region:", region);
  }
});

type BottomTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<TaskStackParamList>();

const TodoStackNavigator: React.FC = () => (
  <Stack.Navigator initialRouteName="TaskList">
    <Stack.Screen name="TaskList" component={TasksScreen} options={{ title: 'Task List' }} />
    <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} options={{ title: 'Task Details' }} />
    <Stack.Screen name="CreateTask" component={CreateTaskScreen} options={{ title: 'Create Task' }} />
  </Stack.Navigator>
);

const App: React.FC = () => {
  const [db, setDB] = useState<SQLite.SQLiteDatabase | undefined>(undefined)
  const [foregroundLocationEnabled, setForegroundLocationEnabled] = useState(false)
  const [backgroundLocationEnabled, setBackgroundLocationEnabled] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [dbLoading, setDBLoading] = useState(true)
  const [initialLocation, setInitialLocation] = useState<boolean | undefined>(undefined)
  const [locationRequested, setLocationRequested] = useState(false)

  const initDB = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('tasks.db')
      await db.execAsync(`DROP TABLE IF EXISTS tasks;`)
      await db.execAsync(`DROP TABLE IF EXISTS items;`)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          radius REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER,
          details TEXT NOT NULL,
          done INTEGER DEFAULT 0,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
      `);
      await db.execAsync(`
        DELETE FROM tasks;
        DELETE FROM items;
      `);
      setDB(db)
      console.log('Successfully intialized database')
    } catch (error) {
      console.error('Error initializing database: ', error)
    } finally {
      setDBLoading(false)
    }
  }

  const requestPermissions = async () => {
    if (!foregroundLocationEnabled) {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus === 'granted') {
        setForegroundLocationEnabled(true)
      }
    }

    if (!backgroundLocationEnabled) {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus === 'granted') {
        setBackgroundLocationEnabled(true)
      }
    }

    setLocationRequested(true)
  };

  const getPermissions = async () => {
    try {
      const fg = await Location.getForegroundPermissionsAsync();
      if (fg.granted) {
        setForegroundLocationEnabled(true)
      }
      const bg = await Location.getBackgroundPermissionsAsync();
      if (bg.granted) {
        setBackgroundLocationEnabled(true)
      }

      if (initialLocation === undefined) {
        if (fg.granted && bg.granted) {
          setInitialLocation(true)
          setLocationEnabled(true)
          console.log('Location services already enabled')
        } else {
          setInitialLocation(false)
        }
      }
    } catch (error) {
      console.error('Error getting permissions: ', error)
    }
  }

  const handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === 'active') {
      await getPermissions();
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (!db) {
      initDB()
    }

    if (!locationEnabled) {
      if (foregroundLocationEnabled && backgroundLocationEnabled) {
        setLocationEnabled(true)
      } else {
        getPermissions()
      }
    }

    return () => {
      subscription.remove();
    };
  }, [foregroundLocationEnabled, backgroundLocationEnabled, locationEnabled, dbLoading]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  if (initialLocation === undefined || dbLoading) {
    return (
      <View style={styles.container}>
        <Text>App Loading...</Text>
      </View>
    ) 
  }

  if (locationRequested && !locationEnabled) {
    return (
      <View style={styles.container}>
        <Text>Please go to settings and allow location services at all times and then click enable location services button again!</Text>
        <Button onPress={() => Linking.openSettings()} title="Go to settings" />
        <Button onPress={requestPermissions} title="Enable location services" />
      </View>
    )
  }

  if (!locationEnabled) {
    return (
      <View style={styles.container}>
        <Button onPress={requestPermissions} title="Enable location services" />
      </View>
    )
  }

  return db ? (
    <DBContext.Provider value={db}>
      <TaskNameContext.Provider value={EXPO_PUBLIC_LOCATION_TASK_NAME}>
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
      </TaskNameContext.Provider>
    </DBContext.Provider>
  ) : (
    <ErrorScreen />
  )
};

export default App;