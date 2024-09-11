import React from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Task, TaskStackParamList } from '../types';
import { useDB } from '../context';
import ErrorScreen from './ErrorScreen';
import { useTasksActions, useTasks } from '../hooks/tasks';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

type Props = NativeStackScreenProps<TaskStackParamList, 'TaskList'>;

const TasksScreen: React.FC<Props> = ({ navigation }) => {
  const db = useDB();
  const { selectTasks } = useTasks()
  const tasks = useSelector((state: RootState) => selectTasks(state))
  const { dispatchAddTask, dispatchDeleteTask } = useTasksActions()

  if (tasks) {
    const deleteTask = async (id: number) => {
      try {
        await db.runAsync('DELETE FROM tasks WHERE id = ?', id)
        dispatchDeleteTask(id)
        console.log('Task deleted successfully')
      } catch (error) {
        console.error('Error deleting task: ', error)
      }
    }

    const handleAddTask = async () => {
      try {
        const result = await db.runAsync(`INSERT INTO tasks (name, updatedAt) VALUES (?, ?)`, 'Untitled', new Date().toISOString())
        const row = await db.getFirstAsync(`SELECT id, name, updatedAt FROM tasks WHERE id = ?`, result.lastInsertRowId) as Task
        dispatchAddTask(row)
        navigation.navigate('CreateTask', { task: row })
      } catch (error) {
        console.error('Error creating new task: ', error)
      }
    }

    const renderRightActions = (id: number) => {
      return (
        <TouchableOpacity onPress={() => {
          deleteTask(id)
        }} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      );
    };

    const renderItem = ({ item }: { item: Task }) => {
      return (
        <Swipeable renderRightActions={() => renderRightActions(item.id)} >
          <View style={styles.taskRow}>
            <Button
                title={item.name}
                onPress={() => navigation.navigate('CreateTask', { task: item })}
              />
          </View>
        </Swipeable>
      );
    } 

    return (
      <View style={styles.container}>
        <Button
          title='Add task'
          onPress={handleAddTask}
        />
        <Text>Tasks:</Text>
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      </View>
    )
  } else {
    return (
      <ErrorScreen />
    )
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bruh: {flexDirection: 'row'},
  taskRow: {
    backgroundColor: '#fff',
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  taskText: {
    fontSize: 18,
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TasksScreen;