import { Router } from "express";
import { objectController } from "../controllers/objectController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// =============================================================================
// Object Management API Routes (Objektverwaltung)
// =============================================================================

// All object routes require authentication
router.use(requireAuth);

// Core CRUD operations
router.get('/objects', objectController.getObjects);
router.get('/objects/by-objectid/:objectId', objectController.getObjectByObjectId);
router.get('/objects/hierarchy/:mandantId', objectController.getObjectHierarchy);
router.get('/objects/:id', objectController.getObject);
router.get('/objects/:id/children', objectController.getObjectChildren);
router.post('/objects', objectController.createObject);
router.put('/objects/:id', objectController.updateObject);
router.delete('/objects/:id', objectController.deleteObject);

export default router;