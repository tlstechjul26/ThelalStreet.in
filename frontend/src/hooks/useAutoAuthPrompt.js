import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthModalOpen, setAuthModalTab } from '../store/slices/authSlice';

const INITIAL_DELAY_MS = 300000; // 5 minutes of initial site usage
const REPEAT_DELAY_MS = 120000;  // 2 minutes repeat interval if dismissed
const STORAGE_START_KEY = 'thelalstreet_unauth_start_time';
const STORAGE_TRIGGERED_KEY = 'thelalstreet_auth_prompt_triggered';

const safeStorage = {
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, val) => {
    try {
      sessionStorage.setItem(key, val);
    } catch (_e) {
      // Ignore sessionStorage errors (e.g. private browsing quota)
    }
  },
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (_e) {
      // Ignore sessionStorage errors
    }
  }
};

/**
 * useAutoAuthPrompt:
 * 1. Shows a login popup after 5 minutes of website use if user is not logged in (new user).
 * 2. If user logs in, the popup is immediately removed/closed and no timers run.
 * 3. If user logs out, after 5 minutes of being logged out the popup appears again,
 *    and if closed/dismissed without logging in, it reappears every 2 minutes repeatedly.
 */
export default function useAutoAuthPrompt() {
  const dispatch = useDispatch();
  const { isAuthenticated, authModalOpen } = useSelector(state => state.auth);
  const prevAuthRef = useRef(isAuthenticated);
  const timerRef = useRef(null);

  // Track login/logout transitions
  useEffect(() => {
    // User logged out: reset 1-minute timer from logout moment
    if (prevAuthRef.current && !isAuthenticated) {
      safeStorage.setItem(STORAGE_START_KEY, String(Date.now()));
      safeStorage.removeItem(STORAGE_TRIGGERED_KEY);
    }

    // User logged in: remove timers, clear storage, and ensure popup is closed
    if (!prevAuthRef.current && isAuthenticated) {
      safeStorage.removeItem(STORAGE_START_KEY);
      safeStorage.removeItem(STORAGE_TRIGGERED_KEY);
      dispatch(setAuthModalOpen(false));
    }

    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    // Clear any existing timer when dependencies change or on unmount
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // 1. If user is authenticated, do not show popup
    if (isAuthenticated) {
      safeStorage.removeItem(STORAGE_START_KEY);
      safeStorage.removeItem(STORAGE_TRIGGERED_KEY);
      return;
    }

    // 2. If popup is currently open, do not schedule another timer while user is viewing it
    if (authModalOpen) {
      return;
    }

    // 3. User is unauthenticated and popup is closed
    let startTimeStr = safeStorage.getItem(STORAGE_START_KEY);
    if (!startTimeStr) {
      startTimeStr = String(Date.now());
      safeStorage.setItem(STORAGE_START_KEY, startTimeStr);
    }

    const startTime = parseInt(startTimeStr, 10) || Date.now();
    const elapsed = Date.now() - startTime;
    const hasTriggeredInitial = safeStorage.getItem(STORAGE_TRIGGERED_KEY) === 'true';

    let delayMs;
    if (!hasTriggeredInitial) {
      const remainingInitial = INITIAL_DELAY_MS - elapsed;
      if (remainingInitial > 0) {
        delayMs = remainingInitial;
      } else {
        // 5-minute initial duration has elapsed
        safeStorage.setItem(STORAGE_TRIGGERED_KEY, 'true');
        delayMs = 0;
      }
    } else {
      // 5-minute initial period has passed and popup was dismissed without logging in;
      // re-trigger every 2 minutes repeatedly
      delayMs = REPEAT_DELAY_MS;
    }

    timerRef.current = setTimeout(() => {
      safeStorage.setItem(STORAGE_TRIGGERED_KEY, 'true');
      dispatch(setAuthModalTab('login'));
      dispatch(setAuthModalOpen(true));
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAuthenticated, authModalOpen, dispatch]);
}
