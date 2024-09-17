import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ScrollView, Dimensions } from 'react-native';
import { Task, TaskStackParamList, Item, CountResult } from '../types';
import { useDB, useTaskName } from '../context';
import * as Location from 'expo-location'
import MapView, { LatLng, Marker, MapPressEvent, Circle, Region } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import ErrorScreen from './ErrorScreen';
import Checkbox from 'expo-checkbox';
import { useTasks, useTasksActions } from '../hooks/tasks';
import { useRegions, useRegionsActions } from '../hooks/regions';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useItems, useItemsActions } from '../hooks/items';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native-gesture-handler';

type Props = NativeStackScreenProps<TaskStackParamList, 'CreateTask'>;
const { height } = Dimensions.get('window')

const CreateTaskScreen: React.FC<Props> = ({ route }) => {
  const db = useDB();
  const taskName = useTaskName();
  const { selectTaskById } = useTasks()
  const task = useSelector((state: RootState) => selectTaskById(state, route.params.task.id))
  const { selectItemsByTaskId, selectCurrentTempID } = useItems()
  const items = useSelector((state: RootState) => selectItemsByTaskId(state, route.params.task.id));
  const [updatedItems, setUpdatedItems] = useState<number[]>([])
  const itemsRef = useRef(items)
  const updatedItemsRef = useRef(updatedItems)
  const currentTempID = useSelector((state: RootState) => selectCurrentTempID(state))
  const { dispatchUpdateTask } = useTasksActions()
  const regions = useRegions()
  const { dispatchAddRegion } = useRegionsActions()
  const taskRef = useRef(task)
  const { dispatchAddItem, dispatchUpdateItem, dispatchDecrementCurrentTempID, dispatchDeleteItem } = useItemsActions()
  const [region, setRegion] = useState<Region | undefined>(undefined);

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
          setRegion({
            latitude: l.coords.latitude,
            longitude: l.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          })
        } catch (error) {
          console.error('Error getting current location: ', error)
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

  if (task && region && items) {
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
      <ScrollView style={styles.container}>
        <View style={styles.nameContainer}>
          <TextInput style={styles.nameText} value={task.name} onChangeText={(text) => {
            dispatchUpdateTask(task.id, { name: text })
          }} />
        </View>
        {items.map((item, index) => (
          <View key={item.id} style={styles.itemRow}>
            <Checkbox style={styles.checkbox} value={item.done === 1} onValueChange={() => toggleDone(item.id)} />
            <TextInput
              style={styles.itemText}
              key={index}
              placeholder={`Item ${index + 1}`}
              value={item.details}
              onChangeText={(text) => handleItemChange(text, item.id)}
            />
          </View>

        ))}

        <TouchableOpacity activeOpacity={1} style={styles.addButtonContainer} onPress={addItem}>
          <Text style={styles.addButton}>Click to Add Item</Text>
        </TouchableOpacity>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            onPress={handleMapPress}
            region={region}
            onRegionChangeComplete={(region) => {setRegion(region)}}
          >
            {(task.latitude && task.longitude) && (
              <>
                <Marker coordinate={{ latitude: task.latitude, longitude: task.longitude }} title='Center' />
                {task.radius ? <Circle center={{ latitude: task.latitude, longitude: task.longitude }} radius={task.radius} fillColor='red' /> : null}
              </>
            )}
          </MapView>
          <View style={styles.zoomButtonsContainer}>
            <MaterialIcon name='zoom-in' style={styles.zoomButton} onPress={() => {
              setRegion({
                ...region,
                latitudeDelta: region.latitudeDelta / 2,
                longitudeDelta: region.longitudeDelta / 2,
              })
            }} />
            <MaterialIcon name='zoom-out' style={styles.zoomButton} onPress={() => {
              setRegion({
                ...region,
                latitudeDelta: region.latitudeDelta * 2,
                longitudeDelta: region.longitudeDelta * 2,
              })
            }} />
          </View>

          <TextInput style={styles.radius} placeholder='Radius' value={task.radius ? task.radius.toString() : undefined} onChangeText={(text) => {
            const parsed = parseFloat(text)
            !Number.isNaN(parsed) ? dispatchUpdateTask(task.id, { radius: parsed }) : dispatchUpdateTask(task.id, { radius: undefined })
          }}/>

        </View>
      </ScrollView>
    )
  } else {
    return <ErrorScreen />
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  itemRow: { flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 20, marginVertical: 5 },
  checkbox: { },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: 20

  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  zoomButtonsContainer: {
    position: 'absolute',
    bottom: '5%',
    right: '5%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  zoomButton: {
    fontSize: 50,
    color: '#000',
  },
  mapContainer: {
    width: '100%',
    height: height * 0.5,
  },
  itemText: {
    fontSize: 16,
    color: '#000',
    marginHorizontal: 10,
  },
  addButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    marginVertical: 5,
  },
  addButton: {
    fontSize: 16,
    color: '#A9A9A9',
  },
  radius: {
    position: 'absolute',
    bottom: '7.5%',
    left: '5%',
    color: '#000',
    backgroundColor: '#fff',
    fontSize: 20,
    padding: 5,
    minWidth: 150
  }
});

export default CreateTaskScreen;