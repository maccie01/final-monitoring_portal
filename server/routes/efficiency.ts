import { Router } from "express";
import { efficiencyController } from "../controllers/efficiencyController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// =============================================================================
// Efficiency Analysis API Routes (Effizienz-Analyse)
// =============================================================================

// All efficiency routes require authentication
router.use(requireAuth);

// Efficiency analysis endpoints (nur echte DB-Daten, keine Mock-Daten)
router.get('/efficiency-analysis/:objectId', efficiencyController.getEfficiencyAnalysis);

export default router;