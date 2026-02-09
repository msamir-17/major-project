import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export const useApi = <T = any>() => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const execute = useCallback(async (
    url: string,
    options: UseApiOptions & { body?: any } = {}
  ): Promise<T> => {
    const {
      method = 'GET',
      headers = {},
      requireAuth = false,
      body
    } = options;

    setIsLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      // Add auth token if required
      if (requireAuth) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          requestHeaders.Authorization = `Bearer ${token}`;
        } else {
          throw new Error('Authentication required');
        }
      }

      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || `HTTP error! status: ${response.status}`);
      }

      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    data,
    error,
    isLoading,
    execute,
    reset: () => {
      setData(null);
      setError(null);
      setIsLoading(false);
    }
  };
};