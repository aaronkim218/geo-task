export type TaskStackParamList = {
  TaskList: undefined;
  TaskDetails: { task: Task };
  CreateTask: undefined;
};

export type Task = {
  id: number;
  name: string;
  createdAt: Date;
  latitude: number;
  longitude: number;
  radius: number;
}

export type Item = {
  id: number;
  task_id: number;
  details: string;
  done: number;
}

export type CountResult = {
  count: number
}