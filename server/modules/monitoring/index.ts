/**
 * Monitoring Module
 *
 * Central export point for all monitoring-related functionality.
 * This module handles dashboard KPIs, critical systems monitoring,
 * energy classifications, and system alerts.
 */

export * from './monitoring.types';
export * from './monitoring.repository';
export * from './monitoring.service';
export * from './monitoring.controller';
export { default as monitoringRoutes } from './monitoring.routes';
