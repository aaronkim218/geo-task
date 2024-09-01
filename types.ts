export type TaskStackParamList = {
  TaskList: undefined;
  TaskDetails: { taskId: number };
  CreateTask: undefined;
};

export type Task = {
  id: number,
  name: string,
  createdAt: Date
}