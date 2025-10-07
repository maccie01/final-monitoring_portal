import { Router } from "from "express"";
import { kiReportController } from "from "../controllers/kiReportController"";
import { requireAuth } from "from "../middleware/auth"";

const router = Router();

// KI Report Routes - alle erfordern Authentifizierung
router.use(requireAuth);

// GET /api/yearly-summary/:objectId - Jahreszusammenfassung
router.get('/yearly-summary/:objectId', kiReportController.getYearlySummary);

export default router;