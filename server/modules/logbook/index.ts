/**
 * Logbook Module
 *
 * Central export point for all logbook-related functionality.
 * This module handles logbook entries including maintenance records,
 * inspections, repairs, notes, and incidents.
 */

export * from './logbook.types';
export * from './logbook.repository';
export * from './logbook.service';
export * from './logbook.controller';
export { default as logbookRoutes } from './logbook.routes';
