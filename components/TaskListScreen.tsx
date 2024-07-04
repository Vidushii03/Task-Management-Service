import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, Button } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

AWS.config.update({
  region: 'eu-north-1',
  accessKeyId: 'replace this with access id',
  secretAccessKey: 'replace this with access key'
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const TaskListScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [viewTaskModalVisible, setViewTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTaskId, setSearchTaskId] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const params = {
      TableName: 'Tasks'
    };
    try {
      const data = await dynamoDb.scan(params).promise();
      setTasks(data.Items);
      setSearchVisible(data.Items.length > 0);
    } catch (error) {
      console.log('Error fetching tasks:', error);
    }
  };

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const addTask = async () => {
    if (newTaskTitle === '' || newTaskDueDate === '') {
      Alert.alert('Error', 'Please enter a task title and due date');
      return;
    }
    if (newTaskTitle.length > 100) {
      Alert.alert('Error', 'Task title cannot exceed 100 characters');
      return;
    }
    if (newTaskDescription.length > 500) {
      Alert.alert('Error', 'Task description cannot exceed 500 characters');
      return;
    }
    const newTask = {
      taskId: uuidv4(),
      title: newTaskTitle,
      description: newTaskDescription,
      dueDate: newTaskDueDate
    };
    const params = {
      TableName: 'Tasks',
      Item: newTask
    };
    try {
      await dynamoDb.put(params).promise();
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
      toggleModal();
    } catch (error) {
      console.log('Error adding task:', error);
    }
  };

  const deleteTaskById = async (taskId) => {
    const params = {
      TableName: 'Tasks',
      Key: {
        taskId: taskId
      }
    };
    try {
      await dynamoDb.delete(params).promise();
      const updatedTasks = tasks.filter(task => task.taskId !== taskId);
      setTasks(updatedTasks);
    } catch (error) {
      console.log('Error deleting task:', error);
    }
  };

  const viewTask = (task) => {
    setSelectedTask(task);
    setViewTaskModalVisible(true);
  };

  const searchTask = () => {
    const foundTask = tasks.find(task => task.taskId === searchTaskId);
    if (foundTask) {
      viewTask(foundTask);
    } else {
      Alert.alert('Error', 'Task not found');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => viewTask(item)}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteTaskById(item.taskId)}>
        <AntDesign name="delete" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Task Management Dashboard by Pedal Start</Text>
          <View style={styles.headerIcons}>
            {(
              <TouchableOpacity style={styles.searchButton} onPress={() => setSearchVisible(!searchVisible)}>
                <AntDesign name="search1" size={30} color="#007bff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.addButton} onPress={toggleModal}>
              <AntDesign name="pluscircleo" size={30} color="#007bff" />
            </TouchableOpacity>
          </View>
        </View>

        {searchVisible && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              placeholder="Search Task by ID"
              value={searchTaskId}
              onChangeText={text => setSearchTaskId(text)}
            />
            <View style={styles.searchButton}>
              <Button title="Search" onPress={searchTask} />
            </View>
          </View>
        )}

        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={item => item.taskId.toString()}
          contentContainerStyle={styles.list}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleModal}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>New Task</Text>
            <TextInput
              style={styles.input}
              placeholder="Task Title"
              value={newTaskTitle}
              onChangeText={text => setNewTaskTitle(text)}
              maxLength={100}
            />
            <TextInput
              style={styles.input}
              placeholder="Task Due Date (YYYY-MM-DD)"
              value={newTaskDueDate}
              onChangeText={text => setNewTaskDueDate(text)}
            />
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Task Description"
              multiline
              value={newTaskDescription}
              onChangeText={text => setNewTaskDescription(text)}
              maxLength={500}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={toggleModal}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonAdd]}
                onPress={addTask}
              >
                <Text style={styles.textStyle}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {selectedTask && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={viewTaskModalVisible}
          onRequestClose={() => setViewTaskModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View style={styles.rowView}>
                <Text style={styles.heading}>Task Id:</Text>
                <Text style={styles.value}>{selectedTask.taskId}</Text>
              </View>
              <View style={styles.rowView}>
                <Text style={styles.heading}>Task Title:</Text>
                <Text style={styles.value}>{selectedTask.title}</Text>
              </View>
              <View style={styles.rowView}>
                <Text style={styles.heading}>Task Description:</Text>
                <Text style={styles.value}>{selectedTask.description}</Text>
              </View>
              <View style={styles.rowView}>
                <Text style={styles.heading}>Task Due Date:</Text>
                <Text style={styles.value}>{selectedTask.dueDate}</Text>
              </View>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setViewTaskModalVisible(false)}
              >
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  tableContainer: {
    marginHorizontal: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  addButton: {
    marginLeft: 20,
  },
  searchButton: {
    marginRight: 20,
    marginLeft: 20,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  list: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  dueDate: {
    fontSize: 12,
    color: '#888',
  },
  rowView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  heading: {
    fontWeight: 'bold',
    flex: 1,
  },
  value: {
    flex: 2,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    width: '100%',
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  button: {
    borderRadius: 5,
    padding: 10,
    width: 100,
    alignItems: 'center',
  },
  buttonClose: {
    backgroundColor: '#aaa',
  },
  buttonAdd: {
    backgroundColor: '#007bff',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default TaskListScreen;
