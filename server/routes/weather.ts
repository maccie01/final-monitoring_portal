import { Router } from "express";
import { weatherController } from "../controllers/weatherController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// =============================================================================
// Daily Outdoor Temperatures API Routes (Tages-Außentemperaturen)
// =============================================================================

// Note: All public weather endpoints are registered in routes/index.ts
// No authenticated weather endpoints are currently in use

export default router;