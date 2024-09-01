import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Task, TaskStackParamList } from '../types';
import { useDB } from '../context';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<TaskStackParamList, 'TaskList'>;

type CountResult = {
  count: number
}

const TasksScreen: React.FC<Props> = ({ navigation }) => {
  const db = useDB();
  const [tasks, setTasks] = useState<Task[] | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useFocusEffect(
    React.useCallback(() => {
      if (db) {
        const getTasks = async () => {
          try {
            const cr = await db.getFirstAsync('SELECT COUNT(*) as count FROM tasks') as CountResult;
            if (cr.count === 0) {
              setTasks([])
            } else {
              const rows = await db.getAllAsync(`SELECT id, name, createdAt FROM tasks`) as Task[];
              setTasks(rows)
            }
          } catch (error) {
            console.error('Error retrieving tasks: ', error)
          } finally {
            setLoading(false)
          }
        }
        getTasks();
      }
    }, [db])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )
  }

  if (tasks && db) {
    const deleteTask = async (id: number) => {
      try {
        setDeleting(true)
        await db.runAsync('DELETE FROM tasks WHERE id = ?', id)
        const updatedTasks = tasks.filter(task => task.id !== id)
        setTasks(updatedTasks)
        console.log('Task deleted successfully')
      } catch (error) {
        console.error('Error deleting task: ', error)
      } finally {
        setDeleting(false)
      }
    }

    return (
      <View style={styles.container}>
        <Button
          title='Add task'
          onPress={() => navigation.navigate('CreateTask')}
        />
        <Text>Tasks:</Text>
        {tasks.map(task => (
          <View style={styles.bruh} key={task.id}>
            <Button
              title={task.name}
              onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
            />
            <Button
              title='Delete'
              onPress={() => deleteTask(task.id)}
            />
          </View>
        ))}
      </View>
    )
  } else {
    return (
      <View style={styles.container}>
        <Text>Error loading data</Text>
      </View> 
    )
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bruh: {flexDirection: 'row'},
});

export default TasksScreen;