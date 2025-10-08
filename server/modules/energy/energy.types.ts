import type { DayComp, InsertDayComp } from "@shared/schema";

/**
 * Energy Module Types
 *
 * This module handles energy-related types including day compensation data,
 * energy consumption metrics, and external energy data responses.
 */

// Re-export shared types
export type {
  DayComp,
  InsertDayComp,
};

// Energy data filters for query operations
export interface EnergyDataFilters {
  objectId: number;
  startDate?: Date;
  endDate?: Date;
  timeRange?: string; // e.g., '1d', '7d', '30d', 'now-1y', 'now-2y'
}

// API Response types
export interface EnergyResponse {
  id: string;
  objectId: number;
  time: string;
  energy: number;
  volume: number;
  energyDiff: number;
  volumeDiff: number;
  month: string;
}

export interface DailyConsumptionResponse {
  date: string;
  consumption: number;
  avgTemp: number;
  maxPower: number;
}

export interface ExternalEnergyDataResponse {
  id: string;
  objectId: string;
  time: string;
  energy: number;
  volume: number;
  energyDiff: number;
  volumeDiff: number;
  month: string;
}

export interface MeterEnergyData {
  meterId: number;
  meterType: string;
  name?: string;
  data: EnergyResponse[];
}

export interface AllMetersEnergyResponse {
  [meterKey: string]: MeterEnergyData;
}

export interface DailyConsumptionData {
  date: string;
  diffEn: number;
  energy: number;
}

export interface MeterDailyData {
  meterId: number;
  name: string;
  dailyData: DailyConsumptionData[];
}

export interface DailyConsumptionDataResponse {
  [meterKey: string]: MeterDailyData;
}
