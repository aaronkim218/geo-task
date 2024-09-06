import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { Task, TaskStackParamList } from '../types';
import { useDB, useTaskName } from '../context';
import * as Location from 'expo-location'
import MapView, { LatLng, Marker, MapPressEvent, Circle } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import ErrorScreen from './ErrorScreen';

type Props = NativeStackScreenProps<TaskStackParamList, 'CreateTask'>;

const CreateTaskScreen: React.FC<Props> = ({ navigation }) => {
  const db = useDB();
  const taskName = useTaskName();
  const [name, setName] = useState<string>('')
  const [items, setItems] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LatLng | undefined>(undefined)
  const [location, setLocation] = useState<Location.LocationObjectCoords | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [radius, setRadius] = useState(0)

  useFocusEffect(
    React.useCallback(() => {
      const getLocation = async () => {
        try {
          const l = await Location.getCurrentPositionAsync()
          setLocation(l.coords)
        } catch (error) {
          console.error('Error getting current location: ', error)
        } finally {
          setLoading(false)
        }
      }

      getLocation()
    }, [])
  );

  const addItem = () => {
    setItems([...items, ''])
  }

  const handleItemChange = (text: string, index: number) => {
    const updatedItems = [...items];
    updatedItems[index] = text;
    setItems(updatedItems)
  }

  const handleMapPress = (e: MapPressEvent) => {
    setSelectedLocation(e.nativeEvent.coordinate)
    console.log(e.nativeEvent.coordinate)
  }

  if (loading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    ) 
  }

  if (saving) {
    return (
      <View>
        <Text>Saving...</Text>
      </View>
    )
  }

  const startGeofence = async () => {
    try {
      const rows = await db.getAllAsync(`SELECT id, name, createdAt, latitude, longitude, radius FROM tasks`) as Task[];
      const regions: Location.LocationRegion[] = rows.map((task) => {
        return {
          identifier: task.id.toString(),
          latitude: task.latitude,
          longitude: task.longitude,
          radius: task.radius,
          notifyOnEnter: true,
          notifyOnExit: true,
        }
      })
      await Location.startGeofencingAsync(taskName, regions)
    } catch (error) {
      console.error('Error starting geofence: ', error)
    }
  }

  const saveTask = async (selectedLocation: LatLng) => {
    try {
      setSaving(true)
      const result = await db.runAsync('INSERT INTO tasks (name, latitude, longitude, radius) VALUES (?, ?, ?, ?);', name, selectedLocation.latitude, selectedLocation.longitude, radius);
      const taskId = result.lastInsertRowId;
      for (const item of items) {
        await db.runAsync('INSERT INTO items (task_id, details, done) VALUES (?, ?, ?)', taskId, item, 0)
      }
      await startGeofence();
      console.log('Task saved successfully')
      navigation.navigate('TaskList')
    } catch (error) {
      console.log('Error inserting task and items: ', error)
    } finally {
      setSaving(false)
    }

  }

  return location ? (
    <View style={styles.container}>
      <Text>Create Task Screen</Text>
      <TextInput placeholder='Name' onChangeText={(text) => setName(text)} />
      <Text>Enter items:</Text>
      {items.map((item, index) => (
        <TextInput
          key={index}
          placeholder={`Item ${index + 1}`}
          value={item}
          onChangeText={(text) => handleItemChange(text, index)}
        />
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
        {selectedLocation && (
          <>
            <Marker coordinate={selectedLocation} title='Selected location' />
            {radius ? <Circle center={selectedLocation} radius={radius} fillColor='red' /> : null}
          </>
        )}
      </MapView>

      <TextInput placeholder='Radius' onChangeText={(text) => {
        const parsed = parseFloat(text)
        Number.isNaN(parsed) ? alert('Please enter a valid radius') : setRadius(parsed)
      }}/>

      <Button
        title='Save'
        onPress={() => {selectedLocation ? saveTask(selectedLocation) : alert('Please select a location first')}}
      />
    </View>
  ) : (
    <ErrorScreen />
  )

}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  map: { width: 400, height: 400 }
});

export default CreateTaskScreen;