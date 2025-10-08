import type { SystemAlert, InsertSystemAlert } from "@shared/schema";

/**
 * Monitoring Module Types
 *
 * This module handles monitoring-related types including system alerts,
 * critical systems, energy classifications, and dashboard KPIs.
 */

// Re-export shared types
export type {
  SystemAlert,
  InsertSystemAlert,
};

// Dashboard KPIs interface
export interface DashboardKPIs {
  criticalSystems: number;
  totalFacilities: number;
  activeFacilities: number;
  averageEfficiency: number;
  averageRenewableShare: number;
}

// Critical System interface
export interface CriticalSystem {
  id: number;
  objectId: number;
  name: string;
  status: string;
  mandantId: number | null;
  location: string;
  lastAlert: Date | null;
  energyConsumption: any;
  description: string | null;
  severity: string;
}

// System by Energy Class interface
export interface SystemByEnergyClass {
  id: number;
  objectId: number;
  name: string;
  energyClass: string;
  consumption: number;
  mandantId: number | null;
  location: string;
  status: string;
  efficiency: number;
}

// Monitoring filters for query operations
export interface MonitoringFilters {
  systemId?: number;
  unresolved?: boolean;
  mandantIds?: number[];
  isAdmin?: boolean;
}

// API Response types
export interface AlertResponse {
  id: number;
  objectId: bigint | null;
  alertType: string;
  message: string;
  isResolved: boolean;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

export interface CriticalSystemsResponse {
  systems: CriticalSystem[];
  total: number;
}

export interface SystemsByEnergyClassResponse {
  systems: SystemByEnergyClass[];
  total: number;
}
