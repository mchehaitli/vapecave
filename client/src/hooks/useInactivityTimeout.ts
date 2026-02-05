import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface UseInactivityTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onLogout?: () => void;
}

export function useInactivityTimeout({
  timeoutMinutes = 30,
  warningMinutes = 2,
  onLogout,
}: UseInactivityTimeoutOptions = {}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/delivery/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    if (onLogout) {
      onLogout();
    }
    
    toast({
      title: "Session Expired",
      description: "You have been logged out due to inactivity.",
      variant: "destructive",
    });
    
    setLocation("/delivery/login");
  }, [onLogout, setLocation, toast]);

  const showWarning = useCallback(() => {
    toast({
      title: "Session Expiring Soon",
      description: `Your session will expire in ${warningMinutes} minutes due to inactivity.`,
    });
  }, [toast, warningMinutes]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
    const logoutTime = timeoutMinutes * 60 * 1000;

    warningTimeoutRef.current = setTimeout(showWarning, warningTime);
    timeoutRef.current = setTimeout(handleLogout, logoutTime);
  }, [timeoutMinutes, warningMinutes, showWarning, handleLogout]);

  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > 1000) {
        resetTimer();
      }
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [resetTimer]);

  return { resetTimer };
}
