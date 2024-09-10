export type TaskStackParamList = {
  TaskList: undefined;
  CreateTask: { task: Task };
};

export type Task = {
  id: number;
  name: string;
  updatedAt: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export type Item = {
  id: number;
  taskId: number;
  details: string;
  done: number;
}

export type CountResult = {
  count: number
}

export type NameResult = {
  name: string
}
