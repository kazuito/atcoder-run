export type ContestData = {
  id: string;
  tasks: {
    [key: string]: Asset[];
  };
};

export type Task = {
  contestId: string;
  index: string;
};

export type Asset = {
  input: string;
  expected: string;
};