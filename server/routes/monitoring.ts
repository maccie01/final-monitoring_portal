import { Router } from "from "express"";
import { monitoringController } from "from "../controllers/monitoringController"";
import { requireRole } from "from "../middleware/auth"";

const router = Router();

/**
 * Monitoring Routes
 * Note: All monitoring endpoints currently unused by client
 */

export default router;
