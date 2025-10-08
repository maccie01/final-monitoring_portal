import type { TodoTask, InsertTodoTask } from "@shared/schema";

/**
 * TodoTasks Module Types
 *
 * This module handles todo task-related types including tasks,
 * filters, and API responses.
 */

// Re-export shared types
export type {
  TodoTask,
  InsertTodoTask,
};

// TodoTask filters for query operations
export interface TodoTaskFilters {
  objectId?: bigint;
  status?: string;
  priority?: string;
  assignedTo?: string;
}

// API Response types
export interface TodoTaskResponse {
  id: number;
  objectId: string | null;
  logbookEntryId: number | null;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: string;
  assignedTo: string | null;
  status: string;
  completedAt: Date | null;
  completedBy: string | null;
  createdAt: Date;
  objectName?: string;
}

export interface TodoTasksListResponse {
  tasks: TodoTaskResponse[];
  total: number;
}
