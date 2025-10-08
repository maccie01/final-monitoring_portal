import { ConnectionPoolManager } from "../../connection-pool";
import { getDb } from "../../db";
import { todoTasks } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { TodoTask, InsertTodoTask } from "@shared/schema";

/**
 * TodoTasks Repository
 *
 * Data access layer for todo tasks operations.
 * Handles direct database queries for todo tasks.
 * Uses both Portal-DB (via ConnectionPoolManager) and Drizzle ORM for operations.
 */

export class TodoTasksRepository {
  // ============================================================================
  // TODO TASKS OPERATIONS
  // ============================================================================

  /**
   * Get todo tasks with optional filters
   * Uses Portal-DB via ConnectionPoolManager for consistent database access
   * @param filters - Optional filters for objectId, status, priority, assignedTo
   * @returns Array of todo tasks with object names
   */
  async getTodoTasks(filters?: {
    objectId?: bigint;
    status?: string;
    priority?: string;
    assignedTo?: string;
  }): Promise<TodoTask[]> {
    console.log('🔍 [STORAGE] getTodoTasks called with filters:', filters);

    try {
      // Use direct SQL via settingsDbManager (same DB as SQL tool)
      const query = `
        SELECT
          t.*,
          o.name as object_name
        FROM todo_tasks t
        LEFT JOIN objects o ON t.object_id = o.objectid
        ORDER BY t.created_at DESC
      `;

      // Use settingsDbManager (Portal-DB) only - korrekte Methode verwenden
      const pool = await ConnectionPoolManager.getInstance().getPool();


      const result = await pool.query(query, []);
      const rawTasks = result.rows || result;
      console.log('🔍 [STORAGE] Portal-DB tasks found:', rawTasks.length);

      // Convert to proper format with BigInt serialization
      const serializedTasks = rawTasks.map((task: any) => ({
        id: task.id,
        objectId: task.object_id ? task.object_id.toString() : null,
        logbookEntryId: task.logbook_entry_id,
        title: task.title,
        description: task.description,
        dueDate: task.due_date,
        priority: task.priority,
        assignedTo: task.assigned_to,
        status: task.status,
        completedAt: task.completed_at,
        completedBy: task.completed_by,
        createdAt: task.created_at,
        objectName: task.object_name
      }));

      console.log('✅ [STORAGE] Returning serialized tasks:', serializedTasks.length);
      return serializedTasks as any;

    } catch (error) {
      console.error('❌ [STORAGE] Error in getTodoTasks:', error);
      throw error;
    }
  }

  /**
   * Get single todo task by ID
   * @param id - Todo task ID
   * @returns Todo task or undefined
   */
  async getTodoTask(id: number): Promise<TodoTask | undefined> {
    const [task] = await getDb()
      .select()
      .from(todoTasks)
      .where(eq(todoTasks.id, id))
      .limit(1);
    return task;
  }

  /**
   * Create new todo task
   * Uses Portal-DB via ConnectionPoolManager for consistent database access
   * @param task - Todo task data to create
   * @returns Created todo task
   */
  async createTodoTask(task: InsertTodoTask): Promise<TodoTask> {
    console.log('🔍 [STORAGE] createTodoTask called with:', task);

    try {
      // Use direct SQL for consistent database access
      const query = `
        INSERT INTO todo_tasks (object_id, logbook_entry_id, title, description, due_date, priority, assigned_to, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        task.objectId || null,
        task.logbookEntryId || null,
        task.title,
        task.description || null,
        task.dueDate || null,
        task.priority || 'niedrig',
        task.assignedTo || null,
        task.status || 'offen'
      ];

      // Use settingsDbManager (Portal-DB) only - korrekte Methode verwenden
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const queryResult = await pool.query(query, values);
      const result = queryResult.rows || queryResult;
      console.log('✅ [STORAGE] Task created via Portal-DB:', result[0]);

      // Convert BigInt for JSON serialization
      const newTask = {
        ...result[0],
        objectId: result[0].object_id ? result[0].object_id.toString() : null
      };

      return newTask as any;

    } catch (error) {
      console.error('❌ [STORAGE] Error creating task:', error);
      throw error;
    }
  }

  /**
   * Update todo task
   * Uses Portal-DB via ConnectionPoolManager for consistent database access
   * @param id - Todo task ID
   * @param task - Partial todo task data to update
   * @returns Updated todo task
   */
  async updateTodoTask(id: number, task: Partial<InsertTodoTask>): Promise<TodoTask> {
    try {
      console.log('🔄 [STORAGE] Updating task via Portal-DB:', id, task);

      // Build dynamic UPDATE query based on provided fields
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (task.title !== undefined) {
        updateFields.push(`title = $${paramCount++}`);
        values.push(task.title);
      }
      if (task.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        values.push(task.description);
      }
      if (task.dueDate !== undefined) {
        updateFields.push(`due_date = $${paramCount++}`);
        values.push(task.dueDate);
      }
      if (task.priority !== undefined) {
        updateFields.push(`priority = $${paramCount++}`);
        values.push(task.priority);
      }
      if (task.assignedTo !== undefined) {
        updateFields.push(`assigned_to = $${paramCount++}`);
        values.push(task.assignedTo);
      }
      if (task.status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        values.push(task.status);

        // Auto-set completion fields when status changes to 'erledigt'
        if (task.status === 'erledigt') {
          updateFields.push(`completed_at = $${paramCount++}`);
          values.push(new Date());
          updateFields.push(`completed_by = $${paramCount++}`);
          values.push(task.completedBy || 'System');
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      // Add task ID as final parameter
      values.push(id);

      const query = `
        UPDATE todo_tasks
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      // Use Portal-DB via settingsDbManager
      const pool = await ConnectionPoolManager.getInstance().getPool();
      console.log('🔄 [STORAGE] Executing UPDATE query:', query);
      console.log('🔄 [STORAGE] With values:', values);
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`Task with ID ${id} not found`);
      }

      const updatedTask = result.rows[0];
      console.log('✅ [STORAGE] Task updated via Portal-DB:', updatedTask.id);

      // Convert to proper format with BigInt serialization
      return {
        id: updatedTask.id,
        objectId: updatedTask.object_id ? updatedTask.object_id.toString() : null,
        logbookEntryId: updatedTask.logbook_entry_id,
        title: updatedTask.title,
        description: updatedTask.description,
        dueDate: updatedTask.due_date,
        priority: updatedTask.priority,
        assignedTo: updatedTask.assigned_to,
        status: updatedTask.status,
        completedAt: updatedTask.completed_at,
        completedBy: updatedTask.completed_by,
        createdAt: updatedTask.created_at,
      } as any;

    } catch (error) {
      console.error('❌ [STORAGE] Error updating task:', error);
      throw error;
    }
  }

  /**
   * Delete todo task
   * Uses Portal-DB via ConnectionPoolManager for consistent database access
   * @param id - Todo task ID
   * @returns void
   */
  async deleteTodoTask(id: number): Promise<void> {
    try {
      console.log('🗑️ [STORAGE] Deleting task via Portal-DB:', id);

      // Use Portal-DB via settingsDbManager
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query('DELETE FROM todo_tasks WHERE id = $1', [id]);

      console.log('✅ [STORAGE] Task deleted via Portal-DB:', id);

    } catch (error) {
      console.error('❌ [STORAGE] Error deleting task:', error);
      throw error;
    }
  }
}

// Singleton instance
export const todoTasksRepository = new TodoTasksRepository();
