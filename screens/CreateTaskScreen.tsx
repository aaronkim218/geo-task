// screens/SettingsScreen.tsx
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { TaskStackParamList } from '../types';
import { useDB } from '../context';

type Props = NativeStackScreenProps<TaskStackParamList, 'CreateTask'>;

const CreateTaskScreen: React.FC<Props> = ({ navigation }) => {
  const db = useDB();
  const [name, setName] = useState<string>('')
  const [items, setItems] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {}, [db])

  const addItem = () => {
    setItems([...items, ''])
  }

  const handleItemChange = (text: string, index: number) => {
    const updatedItems = [...items];
    updatedItems[index] = text;
    setItems(updatedItems)
  }

  if (saving) {
    return (
      <View>
        <Text>Saving...</Text>
      </View>
    )
  }

  // would it be better/ make more sense to depend on loading state var, instead of directly if db initialized or not?
  if (!db) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    )
  } else {
    const saveTask = async () => {
      try {
        setSaving(true)
        const result = await db.runAsync('INSERT INTO tasks (name) VALUES (?);', name);
        const taskId = result.lastInsertRowId;
        for (const item of items) {
          await db.runAsync('INSERT INTO items (task_id, details) VALUES (?, ?)', taskId, item)
        }
        console.log('Task saved successfully')
        navigation.navigate('TaskList')
      } catch (error) {
        console.log('Error inserting task and items: ', error)
      } finally {
        setSaving(false)
      }

    }

    return (
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
  
        <Button
          title='Save'
          onPress={saveTask}
        />
      </View>
    )
  }

}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default CreateTaskScreen;