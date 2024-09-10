import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CountResult, Task, TaskStackParamList } from '../types';
import { useDB } from '../context';
import { useFocusEffect } from '@react-navigation/native';
import ErrorScreen from './ErrorScreen';
import { useTasksActions } from '../hooks/tasks';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

type Props = NativeStackScreenProps<TaskStackParamList, 'TaskList'>;

const TasksScreen: React.FC<Props> = ({ navigation }) => {
  const db = useDB();
  const tasks = useSelector((state: RootState) => state.tasks.tasks)
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
      const result = await db.runAsync(`INSERT INTO tasks (name) VALUES (?)`, 'Untitled')
      const row = await db.getFirstAsync(`SELECT id, name, createdAt FROM tasks WHERE id = ?`, result.lastInsertRowId) as Task
      dispatchAddTask(row)
      navigation.navigate('CreateTask', { task: row })
    }

    return (
      <View style={styles.container}>
        <Button
          title='Add task'
          onPress={handleAddTask}
        />
        <Text>Tasks:</Text>
        {tasks.map(task => (
          <View style={styles.bruh} key={task.id}>
            <Button
              title={task.name}
              onPress={() => navigation.navigate('CreateTask', { task: task })}
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
      <ErrorScreen />
    )
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bruh: {flexDirection: 'row'},
});

export default TasksScreen;