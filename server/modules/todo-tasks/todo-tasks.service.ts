import { todoTasksRepository } from "./todo-tasks.repository";
import type { TodoTask, InsertTodoTask, TodoTaskFilters } from "./todo-tasks.types";

/**
 * TodoTasks Service
 *
 * Business logic layer for todo tasks operations.
 * Handles task validation, business rules, and delegates CRUD to repository.
 */

export class TodoTasksService {
  // ============================================================================
  // TODO TASKS OPERATIONS
  // ============================================================================

  /**
   * Get todo tasks with optional filters
   * @param filters - Optional filters for objectId, status, priority, assignedTo
   * @returns Array of todo tasks
   */
  async getTodoTasks(filters?: TodoTaskFilters): Promise<TodoTask[]> {
    // Validate filters if provided
    if (filters) {
      this.validateFilters(filters);
    }

    return await todoTasksRepository.getTodoTasks(filters);
  }

  /**
   * Get single todo task by ID
   * @param id - Todo task ID
   * @returns Todo task or undefined
   */
  async getTodoTask(id: number): Promise<TodoTask | undefined> {
    this.validateId(id);
    return await todoTasksRepository.getTodoTask(id);
  }

  /**
   * Create new todo task with validation
   * @param task - Todo task data to create
   * @returns Created todo task
   */
  async createTodoTask(task: InsertTodoTask): Promise<TodoTask> {
    // Validate task data
    this.validateTodoTask(task);

    return await todoTasksRepository.createTodoTask(task);
  }

  /**
   * Update todo task with validation
   * @param id - Todo task ID
   * @param task - Partial todo task data to update
   * @returns Updated todo task
   */
  async updateTodoTask(id: number, task: Partial<InsertTodoTask>): Promise<TodoTask> {
    this.validateId(id);

    // Validate partial task data
    if (Object.keys(task).length === 0) {
      throw new Error('No fields to update');
    }

    // Validate individual fields if present
    if (task.title !== undefined) {
      this.validateTitle(task.title);
    }
    if (task.status !== undefined) {
      this.validateStatus(task.status);
    }
    if (task.priority !== undefined) {
      this.validatePriority(task.priority);
    }
    if (task.assignedTo !== undefined && task.assignedTo !== null) {
      this.validateAssignedTo(task.assignedTo);
    }

    return await todoTasksRepository.updateTodoTask(id, task);
  }

  /**
   * Delete todo task
   * @param id - Todo task ID
   * @returns void
   */
  async deleteTodoTask(id: number): Promise<void> {
    this.validateId(id);
    return await todoTasksRepository.deleteTodoTask(id);
  }

  // ============================================================================
  // VALIDATION HELPER METHODS
  // ============================================================================

  /**
   * Validate todo task data
   * @param task - Todo task data to validate
   * @throws Error if validation fails
   */
  private validateTodoTask(task: InsertTodoTask): void {
    if (!task) {
      throw new Error('Todo task data is required');
    }

    // Validate required fields
    this.validateTitle(task.title);

    // Validate optional fields if present
    if (task.status) {
      this.validateStatus(task.status);
    }
    if (task.priority) {
      this.validatePriority(task.priority);
    }
    if (task.assignedTo !== undefined && task.assignedTo !== null) {
      this.validateAssignedTo(task.assignedTo);
    }
    if (task.objectId !== undefined && task.objectId !== null) {
      this.validateObjectId(task.objectId);
    }
    if (task.logbookEntryId !== undefined && task.logbookEntryId !== null) {
      this.validateLogbookEntryId(task.logbookEntryId);
    }
  }

  /**
   * Validate task ID
   * @param id - Task ID to validate
   * @throws Error if invalid
   */
  private validateId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Task ID must be a positive integer');
    }
  }

  /**
   * Validate title
   * @param title - Title to validate
   * @throws Error if invalid
   */
  private validateTitle(title: string): void {
    if (!title || typeof title !== 'string') {
      throw new Error('Title is required and must be a string');
    }

    if (title.length === 0) {
      throw new Error('Title cannot be empty');
    }

    if (title.length > 500) {
      throw new Error('Title must not exceed 500 characters');
    }
  }

  /**
   * Validate status
   * @param status - Status to validate
   * @throws Error if invalid
   */
  private validateStatus(status: string): void {
    if (typeof status !== 'string') {
      throw new Error('Status must be a string');
    }

    const validStatuses = ['offen', 'in_bearbeitung', 'erledigt', 'abgebrochen'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  /**
   * Validate priority
   * @param priority - Priority to validate
   * @throws Error if invalid
   */
  private validatePriority(priority: string): void {
    if (typeof priority !== 'string') {
      throw new Error('Priority must be a string');
    }

    const validPriorities = ['niedrig', 'mittel', 'hoch', 'dringend'];
    if (!validPriorities.includes(priority)) {
      throw new Error(`Priority must be one of: ${validPriorities.join(', ')}`);
    }
  }

  /**
   * Validate assignedTo
   * @param assignedTo - AssignedTo to validate
   * @throws Error if invalid
   */
  private validateAssignedTo(assignedTo: string): void {
    if (typeof assignedTo !== 'string') {
      throw new Error('AssignedTo must be a string');
    }

    if (assignedTo.length === 0) {
      throw new Error('AssignedTo cannot be empty');
    }

    if (assignedTo.length > 255) {
      throw new Error('AssignedTo must not exceed 255 characters');
    }
  }

  /**
   * Validate object ID
   * @param objectId - Object ID to validate
   * @throws Error if invalid
   */
  private validateObjectId(objectId: bigint | number): void {
    const numericId = typeof objectId === 'bigint' ? Number(objectId) : objectId;
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new Error('Object ID must be a positive integer');
    }
  }

  /**
   * Validate logbook entry ID
   * @param logbookEntryId - Logbook entry ID to validate
   * @throws Error if invalid
   */
  private validateLogbookEntryId(logbookEntryId: number): void {
    if (!Number.isInteger(logbookEntryId) || logbookEntryId <= 0) {
      throw new Error('Logbook entry ID must be a positive integer');
    }
  }

  /**
   * Validate filters
   * @param filters - Filters to validate
   * @throws Error if invalid
   */
  private validateFilters(filters: TodoTaskFilters): void {
    if (filters.objectId !== undefined) {
      this.validateObjectId(filters.objectId);
    }

    if (filters.status !== undefined) {
      this.validateStatus(filters.status);
    }

    if (filters.priority !== undefined) {
      this.validatePriority(filters.priority);
    }

    if (filters.assignedTo !== undefined && filters.assignedTo !== null) {
      this.validateAssignedTo(filters.assignedTo);
    }
  }
}

// Singleton instance
export const todoTasksService = new TodoTasksService();
