import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    // Stelle sicher, dass der Hook bei 401-Fehlern nicht endlos lädt
    staleTime: 0,
    gcTime: 0,
  });

  const [, setLocation] = useLocation();
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const [wasAuthenticated, setWasAuthenticated] = useState(false); // Track if user was previously authenticated
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(0);

  const isSuperadmin = (user as any)?.role === 'superadmin';
  const isAuthenticated = !!user && !error;

  // Track authentication state changes
  useEffect(() => {
    if (isAuthenticated && !wasAuthenticated) {
      setWasAuthenticated(true);
    }
  }, [isAuthenticated, wasAuthenticated]);

  // Session timeout configuration
  const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
  const LOGOUT_WARNING_TIME = INACTIVITY_TIMEOUT - WARNING_TIME;

  // Automatic logout function
  const performLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      setLocation("/");
      // Entfernt: window.location.reload() - nur Navigation ohne Neuladen
    }
  };

  // Send heartbeat to server to extend session (throttled)
  const sendHeartbeat = async () => {
    const now = Date.now();
    // Only send heartbeat every 5 minutes to avoid spam
    if (now - lastHeartbeatRef.current < 5 * 60 * 1000) return;
    
    try {
      await apiRequest("POST", "/api/auth/heartbeat");
      lastHeartbeatRef.current = now;
    } catch (error) {
      // Silent fail for heartbeat - don't spam console with warnings
      // Only log severe errors, not network timeouts
      if (error && typeof error === 'object' && 'message' in error && !(error as Error).message.includes('fetch')) {
        console.warn("Heartbeat failed:", error);
      }
    }
  };

  // Reset inactivity timer and send heartbeat
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    setSessionWarning(null);

    if (isAuthenticated) {
      // Send heartbeat to extend server session
      sendHeartbeat();

      // Set warning timer (5 minutes before logout)
      warningTimerRef.current = setTimeout(() => {
        setSessionWarning("Ihre Session läuft in 5 Minuten ab. Jede Aktivität verlängert die Session automatisch.");
      }, LOGOUT_WARNING_TIME);

      // Set logout timer (2 hours of inactivity)
      inactivityTimerRef.current = setTimeout(() => {
        setSessionWarning("Session abgelaufen. Bitte melden Sie sich erneut an.");
        // Entfernt: automatischer Logout - nur Nachricht anzeigen
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timers if user is not authenticated
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      setSessionWarning(null);
      return;
    }

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimer = () => resetInactivityTimer();
    
    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Initialize timer
    resetInactivityTimer();

    return () => {
      // Cleanup event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
      // Clear timers
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [isAuthenticated]);

  // Handle server-side session expiration and 401 errors
  useEffect(() => {
    if (error && wasAuthenticated) {
      const errorStatus = (error as any)?.status || (error as any)?.response?.status;
      const errorMessage = (error as any)?.message;
      
      // Only show message if user was previously authenticated (session actually expired)
      if (errorStatus === 401 || errorMessage?.includes("Session expired") || errorMessage?.includes("Unauthorized")) {
        const reason = (error as any)?.reason;
        if (reason === "inactivity_timeout") {
          setSessionWarning("Session wegen Inaktivität abgelaufen. Bitte melden Sie sich erneut an.");
        } else if (reason === "absolute_timeout") {
          setSessionWarning("Maximale Session-Dauer erreicht (24h). Bitte melden Sie sich erneut an.");
        } else {
          setSessionWarning("Session abgelaufen. Bitte melden Sie sich erneut an.");
        }
        // Reset authentication state after showing warning
        setWasAuthenticated(false);
      }
    }
  }, [error, wasAuthenticated]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isSuperadmin,
    sessionWarning,
    dismissWarning: () => setSessionWarning(null),
    logout: performLogout,
  };
}
