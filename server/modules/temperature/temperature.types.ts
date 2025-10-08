import type { DailyOutdoorTemperature, InsertDailyOutdoorTemperature } from "@shared/schema";

/**
 * Temperature Module Types
 *
 * This module handles temperature-related types including daily outdoor temperatures,
 * temperature filters, and temperature efficiency data responses.
 */

// Re-export shared types
export type {
  DailyOutdoorTemperature,
  InsertDailyOutdoorTemperature,
};

// Temperature data filters for query operations
export interface TemperatureFilters {
  postalCode?: string;
  startDate?: Date;
  endDate?: Date;
  resolution?: string; // 'd' (daily), 'w' (weekly), 'm' (monthly)
}

// API Response types
export interface TemperatureResponse {
  id: number;
  date: string;
  postalCode: string;
  city?: string;
  temperatureMin: string;
  temperatureMax: string;
  temperatureMean: string;
  humidity?: string | null;
  pressure?: string | null;
  windSpeed?: string | null;
  windDirection?: string | null;
  precipitation?: string | null;
  dataSource?: string;
  dataQuality?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TemperaturesListResponse {
  temperatures: TemperatureResponse[];
  total: number;
  postalCode?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TemperatureEfficiencyData {
  date: string;
  min: number;
  mean: number;
  max: number;
  efficiency: number;
  threshold: number;
  fullDate: string;
  temperatureDifference: number;
}
