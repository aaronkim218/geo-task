import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { Task, TaskStackParamList, Item, CountResult } from '../types';
import { useDB, useTaskName } from '../context';
import * as Location from 'expo-location'
import MapView, { LatLng, Marker, MapPressEvent, Circle } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import ErrorScreen from './ErrorScreen';
import Checkbox from 'expo-checkbox';
import { useTasks, useTasksActions } from '../hooks/tasks';
import { useRegions, useRegionsActions } from '../hooks/regions';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useItems, useItemsActions } from '../hooks/items';

type Props = NativeStackScreenProps<TaskStackParamList, 'CreateTask'>;

const CreateTaskScreen: React.FC<Props> = ({ route }) => {
  const db = useDB();
  const taskName = useTaskName();
  const { selectTaskById } = useTasks()
  const task = useSelector((state: RootState) => selectTaskById(state, route.params.task.id))
  const { selectItemsByTaskId, selectCurrentTempID } = useItems()
  const items = useSelector((state: RootState) => selectItemsByTaskId(state, route.params.task.id));
  const [updatedItems, setUpdatedItems] = useState<number[]>([])
  const [location, setLocation] = useState<Location.LocationObjectCoords | undefined | null>(undefined)
  const [loadingLocation, setLoadingLocation] = useState(true)
  const itemsRef = useRef(items)
  const updatedItemsRef = useRef(updatedItems)
  const currentTempID = useSelector((state: RootState) => selectCurrentTempID(state))
  const { dispatchUpdateTask } = useTasksActions()
  const regions = useRegions()
  const { dispatchAddRegion } = useRegionsActions()
  const taskRef = useRef(task)
  const { dispatchAddItem, dispatchUpdateItem, dispatchDecrementCurrentTempID } = useItemsActions()

  useEffect(() => {
    taskRef.current = task;
  }, [task]);
  
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    updatedItemsRef.current = updatedItems;
  }, [updatedItems]);

  useFocusEffect(
    React.useCallback(() => {
      const getLocation = async () => {
        try {
          const l = await Location.getCurrentPositionAsync()
          setLocation(l.coords)
        } catch (error) {
          console.error('Error getting current location: ', error)
        } finally {
          setLoadingLocation(false)
        }
      }

      getLocation()

      return () => {
        const iRefVal = itemsRef.current
        const uRefVal = updatedItemsRef.current
        const tRefVal = taskRef.current
        if (tRefVal) {
          const startGeofence = async () => {
            try {
              const regionsCopy = [...regions]
              if (tRefVal.latitude && tRefVal.longitude && tRefVal.radius) {
                const newRegion = {
                  identifier: tRefVal.id.toString(),
                  latitude: tRefVal.latitude,
                  longitude: tRefVal.longitude,
                  radius: tRefVal.radius,
                  notifyOnEnter: true,
                  notifyOnExit: true,
                }
                dispatchAddRegion(newRegion)
                regionsCopy.push(newRegion)
                await Location.startGeofencingAsync(taskName, regionsCopy)
              }
            } catch (error) {
              console.error('Error starting geofence: ', error)
            }
          }

          startGeofence();

          const saveTask = async () => {
            try {
              await db.runAsync(`UPDATE tasks SET name = ?, updatedAt = ?, latitude = ?, longitude = ?, radius = ? WHERE id = ?`, tRefVal.name, tRefVal.updatedAt, tRefVal.latitude ? tRefVal.latitude : null, tRefVal.longitude ? tRefVal.longitude : null, tRefVal.radius ? tRefVal.radius : null, tRefVal.id)
              if (iRefVal) {
                const u = iRefVal.filter((item) => uRefVal.includes(item.id))
                for (const item of u) {
                  // temp ids marked by negative id
                  if (item.id < 0) {
                    await db.runAsync('INSERT INTO items (taskId, details, done) VALUES (?, ?, ?)', tRefVal.id, item.details, item.done)
                  } else {
                    await db.runAsync('UPDATE items SET details = ?, done = ? WHERE id = ?', item.details, item.done, item.id)
                  }
                }
              }
              console.log('Task saved successfully')
            } catch (error) {
              console.error('Error inserting task and items: ', error)
            }
          }
          saveTask();
        }
      }
    }, [])
  );

  if (loadingLocation && !task?.latitude && !task?.longitude) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    ) 
  }

  if (task && location && items) {
    const addItem = () => {
      const newItem: Item = { id: currentTempID, taskId: task.id, details: '', done: 0 }
      dispatchDecrementCurrentTempID()
      dispatchAddItem(newItem)
      dispatchUpdateTask(task.id, task)
      setUpdatedItems([...updatedItems, newItem.id])
    }
  
    const handleMapPress = (e: MapPressEvent) => {
      dispatchUpdateTask(task.id, { latitude: e.nativeEvent.coordinate.latitude, longitude: e.nativeEvent.coordinate.longitude })
    }

    const handleItemChange = (text: string, id: number) => {
      dispatchUpdateItem(id, { details: text })
      dispatchUpdateTask(task.id, task)
      if (!updatedItems.includes(id)) {
        setUpdatedItems([...updatedItems, id])
      }
    }

    const toggleDone = async (id: number) => {
      const item = items.find((item) => item.id === id)
      if (item) {
        dispatchUpdateItem(id, { done: item.done === 0 ? 1 : 0 })
        dispatchUpdateTask(task.id, task)
        if (!updatedItems.includes(id)) {
          setUpdatedItems([...updatedItems, id])
        }
      }

    }

    return (
      <View style={styles.container}>
        <Text>Create Task Screen</Text>
        <TextInput value={task.name} onChangeText={(text) => {
          dispatchUpdateTask(task.id, { name: text })
        }} />
        <Text>Enter items:</Text>
        {items.map((item, index) => (
          <View key={item.id} style={styles.block}>
            <Checkbox style={styles.checkbox} value={item.done === 1} onValueChange={() => toggleDone(item.id)} />
            <TextInput
              key={index}
              placeholder={`Item ${index + 1}`}
              value={item.details}
              onChangeText={(text) => handleItemChange(text, item.id)}
            />
          </View>

        ))}

        <Button
          title='Add item'
          onPress={addItem}
        />

        <MapView 
          style={styles.map}
          onPress={handleMapPress}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
          }}
        >
          {(task.latitude && task.longitude) && (
            <>
              <Marker coordinate={{ latitude: task.latitude, longitude: task.longitude }} title='Selected location' />
              {task.radius ? <Circle center={{ latitude: task.latitude, longitude: task.longitude }} radius={task.radius} fillColor='red' /> : null}
            </>
          )}
        </MapView>

        <TextInput placeholder='Radius' value={task.radius ? task.radius.toString() : undefined} onChangeText={(text) => {
          const parsed = parseFloat(text)
          Number.isNaN(parsed) ? alert('Please enter a valid radius') : dispatchUpdateTask(task.id, { radius: parsed })
        }}/>
      </View>
    )
  } else {
    return <ErrorScreen />
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  map: { width: 400, height: 400 },
  block: { flex: 0, flexDirection: 'row', justifyContent: 'center' },
  checkbox: { }
});

export default CreateTaskScreen;