/**
 * Shared API Client for Feature Modules
 *
 * This module provides a centralized API client that all feature modules use
 * for making HTTP requests. It ensures consistent error handling, authentication,
 * and request formatting across the application.
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Base API client with standard fetch wrapper
 * Handles authentication, headers, and error responses consistently
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await fetch(`${url}${queryString}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any): Promise<T> {
    const isFormData = data instanceof FormData;

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * DELETE request
   */
  async delete<T = any>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },
};

/**
 * Legacy compatibility: Re-export apiRequest from queryClient
 * This maintains backward compatibility with existing code
 */
export { apiRequest } from './queryClient';
