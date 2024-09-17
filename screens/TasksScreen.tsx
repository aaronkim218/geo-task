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
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

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
            <TouchableOpacity 
              style={styles.taskButton}
              onPress={() => navigation.navigate('CreateTask', { task: item })}
            >
              <Text style={styles.taskButtonText}>{item.name}</Text>
            </TouchableOpacity>
          </View>
        </Swipeable>
      );
    } 

    return (
      <View style={styles.container}>
        <View style={styles.tasksContainer}>
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
          />
        </View>
        <MaterialIcon name='add-circle-outline' onPress={handleAddTask} style={styles.addTaskButton} />
      </View>
    )
  } else {
    return (
      <ErrorScreen />
    )
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskRow: {
    justifyContent: 'center',
    backgroundColor: '#999797',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  taskButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  taskButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: '33%',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addTaskButton: {
    position: 'absolute',
    bottom: '5%',
    right: '10%',
    fontSize: 50,
    color: '#fff',
  },
  tasksContainer: {
    flex: 1,
    backgroundColor: '#9ccdff'
  }
});

export default TasksScreen;