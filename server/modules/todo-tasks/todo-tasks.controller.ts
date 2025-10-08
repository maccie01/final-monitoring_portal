import type { Request, Response } from "express";
import { todoTasksService } from "./todo-tasks.service";
import { asyncHandler, createAuthError, createValidationError, createNotFoundError } from "../../middleware/error";

/**
 * TodoTasks Controller
 *
 * HTTP request/response handling for todo tasks endpoints.
 * Handles CRUD operations for todo tasks.
 */

export const todoTasksController = {
  // ============================================================================
  // TODO TASKS ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/todo-tasks
   * Get todo tasks with optional filters
   * Auth: Requires authentication
   * Query params: objectId, status, priority, assignedTo (all optional)
   * Returns: Array of todo tasks
   */
  getTodoTasksHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Parse query parameters
    const filters: any = {};
    if (req.query.objectId) {
      filters.objectId = BigInt(req.query.objectId as string);
    }
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    if (req.query.priority) {
      filters.priority = req.query.priority as string;
    }
    if (req.query.assignedTo) {
      filters.assignedTo = req.query.assignedTo as string;
    }

    const tasks = await todoTasksService.getTodoTasks(filters);
    res.json(tasks);
  }),

  /**
   * API: GET /api/todo-tasks/:id
   * Get single todo task by ID
   * Auth: Requires authentication
   * Returns: Todo task
   */
  getTodoTaskHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { id } = req.params;

    if (!id) {
      throw createValidationError("Task ID ist erforderlich");
    }

    const task = await todoTasksService.getTodoTask(parseInt(id));

    if (!task) {
      throw createNotFoundError("Todo task nicht gefunden");
    }

    res.json(task);
  }),

  /**
   * API: POST /api/todo-tasks
   * Create new todo task
   * Auth: Requires authentication
   * Body: Todo task data (title, description, objectId, logbookEntryId, dueDate, priority, assignedTo, status)
   * Returns: Created todo task
   */
  createTodoTaskHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const taskData = req.body;

    // Validate required fields
    if (!taskData.title) {
      throw createValidationError("Title ist erforderlich");
    }

    const newTask = await todoTasksService.createTodoTask(taskData);
    res.status(201).json(newTask);
  }),

  /**
   * API: PUT /api/todo-tasks/:id
   * Update todo task
   * Auth: Requires authentication
   * Body: Partial todo task data
   * Returns: Updated todo task
   */
  updateTodoTaskHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { id } = req.params;

    if (!id) {
      throw createValidationError("Task ID ist erforderlich");
    }

    const taskData = req.body;

    if (!taskData || Object.keys(taskData).length === 0) {
      throw createValidationError("Keine Daten zum Aktualisieren vorhanden");
    }

    const updatedTask = await todoTasksService.updateTodoTask(parseInt(id), taskData);

    if (!updatedTask) {
      throw createNotFoundError("Todo task nicht gefunden");
    }

    res.json(updatedTask);
  }),

  /**
   * API: DELETE /api/todo-tasks/:id
   * Delete todo task
   * Auth: Requires authentication
   * Returns: Success message
   */
  deleteTodoTaskHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { id } = req.params;

    if (!id) {
      throw createValidationError("Task ID ist erforderlich");
    }

    await todoTasksService.deleteTodoTask(parseInt(id));

    res.json({ message: "Todo task erfolgreich gelöscht" });
  }),
};
