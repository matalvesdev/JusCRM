import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface UseInactivityLogoutOptions {
  inactivityTimeout?: number; // em milissegundos
  warningTimeout?: number; // aviso antes do logout
}

export const useInactivityLogout = ({
  inactivityTimeout = 30 * 60 * 1000, // 30 minutos padrão
  warningTimeout = 5 * 60 * 1000, // 5 minutos de aviso
}: UseInactivityLogoutOptions = {}) => {
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  const showInactivityWarning = useCallback(() => {
    // Aqui você pode mostrar um modal de aviso
    const shouldStayLoggedIn = window.confirm(
      `Sua sessão expirará em ${
        warningTimeout / 60000
      } minutos devido à inatividade. ` + "Deseja continuar conectado?"
    );

    if (shouldStayLoggedIn) {
      // Reset do timer será feito pelo resetInactivityTimer
      lastActivityRef.current = Date.now();
    } else {
      logout();
    }
  }, [warningTimeout, logout]);

  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;

    clearTimeouts();
    lastActivityRef.current = Date.now();

    // Timer para o aviso
    warningTimeoutRef.current = setTimeout(() => {
      showInactivityWarning();
    }, inactivityTimeout - warningTimeout);

    // Timer para logout automático
    timeoutRef.current = setTimeout(() => {
      console.log("[InactivityLogout] Logout automático por inatividade");
      logout();
    }, inactivityTimeout);
  }, [
    isAuthenticated,
    inactivityTimeout,
    warningTimeout,
    clearTimeouts,
    showInactivityWarning,
    logout,
  ]);

  const handleActivity = useCallback(() => {
    if (!isAuthenticated) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    // Reset apenas se passou tempo suficiente para evitar muitos resets
    if (timeSinceLastActivity > 10000) {
      // 10 segundos
      resetInactivityTimer();
    }
  }, [isAuthenticated, resetInactivityTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimeouts();
      return;
    }

    // Eventos que indicam atividade do usuário
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Iniciar o timer
    resetInactivityTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearTimeouts();
    };
  }, [isAuthenticated, handleActivity, resetInactivityTimer, clearTimeouts]);

  return {
    resetTimer: resetInactivityTimer,
    lastActivity: lastActivityRef.current,
  };
};
