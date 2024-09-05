import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CountResult, Item, TaskStackParamList } from '../types';
import { useDB } from '../context';
import { useFocusEffect } from '@react-navigation/native';
import ErrorScreen from './ErrorScreen';
import Checkbox from 'expo-checkbox';

// Adjust the Props type to use TaskStackParamList
type Props = NativeStackScreenProps<TaskStackParamList, 'TaskDetails'>;

const TaskDetailsScreen: React.FC<Props> = ({ route }) => {
  const db = useDB();
  const [items, setItems] = useState<Item[] | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [updatedItems, setUpdatedItems] = useState<number[]>([])
  const itemsRef = useRef(items)
  const updatedItemsRef = useRef(updatedItems)

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  
  useEffect(() => {
    updatedItemsRef.current = updatedItems;
  }, [updatedItems]);

  useFocusEffect(
    React.useCallback(() => {
      const getItems = async () => {
        try {
          const cr = await db.getFirstAsync('SELECT COUNT(*) as count FROM items WHERE task_id = ?', route.params.task.id) as CountResult;
          if (cr.count === 0) {
            setItems([])
          } else {
            const rows = await db.getAllAsync(`SELECT id, task_id, details, done FROM items WHERE task_id = ? ORDER BY id ASC`, route.params.task.id) as Item[];
            setItems(rows)
          }
        } catch (error) {
          console.error('Error retrieving items: ', error)
        } finally {
          setLoading(false)
        }
      }

      getItems();

      return () => {
        const iRefVal = itemsRef.current
        const uRefVal = updatedItemsRef.current
        if (iRefVal && uRefVal) {
          const updateItems = async () => {
            try {
              const u = iRefVal.filter((item) => uRefVal.includes(item.id))
              for (const i of u) {
                await db.runAsync(`UPDATE items SET done = ? WHERE ID = ?`, i.done, i.id)
              }
            } catch (error) {
              console.error('Error updating items: ', error)
            }
          }
          updateItems();
        }
      }
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )
  }

  if (items) {
    const toggleDone = async (id: number) => {
      const u = [...updatedItems, id]
      setUpdatedItems(u)
      const updated = items.map(i => {
        return i.id === id ? { ...i, done: i.done === 1 ? 0 : 1 } : i
      })
      setItems(updated)
    }

    return (
      <View style={styles.container}>
        <Text>Task Details for: {route.params.task.name}</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.block}>
            <Checkbox style={styles.checkbox} value={item.done === 1} onValueChange={() => toggleDone(item.id)} />
            {item.done === 1 ? (
              <Text>{item.details} - done</Text>
            ) : (
              <Text>{item.details}</Text>
            )}
          </View>
        ))}
      </View>
    )
  } else {
    return (
      <ErrorScreen />
    )
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', },
  block: { flex: 0, flexDirection: 'row', justifyContent: 'center' },
  checkbox: { }
});

export default TaskDetailsScreen;