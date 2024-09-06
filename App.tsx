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
import { NameResult, TaskStackParamList } from './types';
import { DBContext, TaskNameContext } from './context';
import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'
import { Button, Text, View, StyleSheet, AppState, Linking } from 'react-native';
import ErrorScreen from './screens/ErrorScreen';
import * as Notifications from 'expo-notifications'

const EXPO_PUBLIC_LOCATION_TASK_NAME = process.env.EXPO_PUBLIC_LOCATION_TASK_NAME;

if (!EXPO_PUBLIC_LOCATION_TASK_NAME) {
  throw new Error('Failed to load environment variables')
}

TaskManager.defineTask(EXPO_PUBLIC_LOCATION_TASK_NAME, async ({ data: { eventType, region }, error }: { data: { eventType: Location.GeofencingEventType, region: Location.LocationRegion }, error: TaskManager.TaskManagerError | null }) => {
  if (error) {
    console.error('Error handling geofencing event - code: ', error.code, ' message: ', error.message)
    return;
  }
  if (region.identifier) {
    const db = await SQLite.openDatabaseAsync('tasks.db')
    const { name } = await db.getFirstAsync(`SELECT name FROM tasks WHERE id = ?`, region.identifier) as NameResult
    if (eventType === Location.GeofencingEventType.Enter) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "You've entered a task's location!",
          body: `You entered the region attached to task: ${name}`,
        },
        trigger: null,
      });
      console.log("You've entered region with name: ", name, " with object:" , region);
    } else if (eventType === Location.GeofencingEventType.Exit) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "You've exited a tasks's location!",
          body: `You left the region attached to task: ${name}`,
        },
        trigger: null,
      });
      console.log("You've left region with name: ", name, " with object:" , region);
    }
  } else {
    console.error('Region had no identifier!')
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
  const [permissionsEnabled, setPermissionsEnabled] = useState(false)
  const [dbLoading, setDBLoading] = useState(true)
  const [initialPermissions, setInitialPermissions] = useState<boolean | undefined>(undefined)
  const [permissionsRequested, setPermissionsRequested] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

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

    if (!notificationsEnabled) {
      const { status: backgroundStatus } = await Notifications.requestPermissionsAsync();
      if (backgroundStatus === 'granted') {
        setNotificationsEnabled(true)
      } 
    }

    setPermissionsRequested(true)
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
      const n = await Notifications.getPermissionsAsync();
      if (n.granted) {
        setNotificationsEnabled(true)
      }

      if (initialPermissions === undefined) {
        if (fg.granted && bg.granted && n.granted) {
          setInitialPermissions(true)
          setPermissionsEnabled(true)
          console.log('Permissions already enabled')
        } else {
          setInitialPermissions(false)
        }
      }
    } catch (error) {
      console.error('Error getting permissions: ', error)
    }
  }

  // USE USEFOCUSEFFECT INSTEAD
  const handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === 'active') {
      await getPermissions();
    }
  };

  useEffect(() => {
    // USE USEFOCUSEFFECT INSTEAD
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (!db) {
      initDB()
    }

    if (!permissionsEnabled) {
      if (foregroundLocationEnabled && backgroundLocationEnabled && notificationsEnabled) {
        setPermissionsEnabled(true)
      } else {
        getPermissions()
      }
    }

    return () => {
      subscription.remove();
    };
  }, [foregroundLocationEnabled, backgroundLocationEnabled, notificationsEnabled, permissionsEnabled, dbLoading]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  if (initialPermissions === undefined || dbLoading) {
    return (
      <View style={styles.container}>
        <Text>App Loading...</Text>
      </View>
    ) 
  }

  if (permissionsRequested && !permissionsEnabled) {
    return (
      <View style={styles.container}>
        <Text>Please go to settings and allow location services at all times and then click enable location services button again!</Text>
        <Button onPress={() => Linking.openSettings()} title="Go to Settings" />
        <Button onPress={requestPermissions} title="Enable Permissions" />
      </View>
    )
  }

  if (!permissionsEnabled) {
    return (
      <View style={styles.container}>
        <Button onPress={requestPermissions} title="Enable Permissions" />
      </View>
    )
  }

  return db ? (
    <DBContext.Provider value={db}>
      <TaskNameContext.Provider value={EXPO_PUBLIC_LOCATION_TASK_NAME}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
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