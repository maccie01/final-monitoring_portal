// Gemeinsame API Utility-Funktionen zur Reduzierung von Code-Duplikation

// Standard HTTP Headers für JSON APIs
export const JSON_HEADERS = {
  'Content-Type': 'application/json',
} as const;

// HTTP Headers mit Credentials
export const JSON_HEADERS_WITH_CREDENTIALS = {
  'Content-Type': 'application/json',
  'credentials': 'include',
} as const;

// API Request Helper - Reduziert Duplikation von fetch-Aufrufen
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Record<string, any> | string;
  headers?: HeadersInit;
  credentials?: boolean;
}

export async function apiRequest(url: string, options: ApiRequestOptions = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    credentials = false
  } = options;

  const requestHeaders = {
    ...(body && typeof body === 'object' ? JSON_HEADERS : {}),
    ...headers,
  };

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
    ...(credentials && { credentials: 'include' }),
    ...(body && {
      body: typeof body === 'string' ? body : JSON.stringify(body)
    }),
  };

  const response = await fetch(url, requestInit);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response;
}

// Shorthand für häufige API-Operationen
export const api = {
  // GET Request
  get: (url: string, headers?: HeadersInit) => 
    apiRequest(url, { method: 'GET', headers }),

  // POST Request mit JSON Body
  post: (url: string, body?: Record<string, any>, headers?: HeadersInit) =>
    apiRequest(url, { method: 'POST', body, headers }),

  // PATCH Request mit JSON Body  
  patch: (url: string, body?: Record<string, any>, headers?: HeadersInit) =>
    apiRequest(url, { method: 'PATCH', body, headers }),

  // PUT Request mit JSON Body
  put: (url: string, body?: Record<string, any>, headers?: HeadersInit) =>
    apiRequest(url, { method: 'PUT', body, headers }),

  // DELETE Request
  delete: (url: string, body?: Record<string, any>, headers?: HeadersInit) =>
    apiRequest(url, { method: 'DELETE', body, headers }),
};

// Hook für Loading States - Reduziert Duplikation
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState);
  
  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);
  
  return {
    isLoading,
    setIsLoading,
    startLoading,
    stopLoading,
  };
}

// React import für Hook
import React from "from "react"";