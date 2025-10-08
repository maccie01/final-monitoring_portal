/**
 * Energy Module
 *
 * Central export point for all energy-related functionality.
 * This module handles energy data operations including day compensation data,
 * consumption metrics, and external energy database connections.
 */

// Export types
export * from './energy.types';

// Export repository
export * from './energy.repository';

// Export service
export * from './energy.service';

// Export controller
export * from './energy.controller';

// Export routes as default
export { default as energyRoutes } from './energy.routes';
