import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TaskStackParamList } from '../types';

// Adjust the Props type to use TaskStackParamList
type Props = NativeStackScreenProps<TaskStackParamList, 'TaskDetails'>;

const TaskDetailsScreen: React.FC<Props> = ({ route }) => (
  <View style={styles.container}>
    <Text>Task Details for ID: {route.params.taskId}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default TaskDetailsScreen;