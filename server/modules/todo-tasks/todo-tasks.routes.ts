import { Router } from "express";
import { todoTasksController } from "./todo-tasks.controller";

/**
 * TodoTasks Routes
 *
 * Express router for todo tasks endpoints.
 * Defines routes for CRUD operations on todo tasks.
 */

const router = Router();

// ============================================================================
// TODO TASKS ROUTES
// ============================================================================

/**
 * GET /api/todo-tasks
 * Get todo tasks with optional filters
 * Query params: objectId, status, priority, assignedTo (all optional)
 */
router.get("/", todoTasksController.getTodoTasksHandler);

/**
 * GET /api/todo-tasks/:id
 * Get single todo task by ID
 */
router.get("/:id", todoTasksController.getTodoTaskHandler);

/**
 * POST /api/todo-tasks
 * Create new todo task
 * Body: Todo task data (title, description, objectId, logbookEntryId, dueDate, priority, assignedTo, status)
 */
router.post("/", todoTasksController.createTodoTaskHandler);

/**
 * PUT /api/todo-tasks/:id
 * Update todo task
 * Body: Partial todo task data
 */
router.put("/:id", todoTasksController.updateTodoTaskHandler);

/**
 * DELETE /api/todo-tasks/:id
 * Delete todo task
 */
router.delete("/:id", todoTasksController.deleteTodoTaskHandler);

export default router;
