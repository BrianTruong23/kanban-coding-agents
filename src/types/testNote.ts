export type TestType = 'unit' | 'integration' | 'e2e' | 'manual';

export interface TestNote {
  id: string;
  taskId: string;
  note: string;
  testType?: TestType;
  createdAt: number;
  updatedAt: number;
}
