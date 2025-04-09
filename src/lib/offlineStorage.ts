
import { Session } from "@/types";

// Get IndexedDB or fall back to localStorage if not available
const getStorage = () => {
  if ('indexedDB' in window) {
    return 'indexedDB';
  }
  return 'localStorage';
};

// Prefix to identify our app's stored data
const APP_PREFIX = 'cbs_interviewer_';

// Keys for storing specific data
export const STORAGE_KEYS = {
  PENDING_SESSIONS: `${APP_PREFIX}pending_sessions`,
  ACTIVE_SESSION: `${APP_PREFIX}active_session`,
  OFFLINE_START_TIME: `${APP_PREFIX}offline_start_time`,
  OFFLINE_START_LOCATION: `${APP_PREFIX}offline_start_location`,
};

// Save data to local storage
export const saveToStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to local storage:', error);
  }
};

// Get data from local storage
export const getFromStorage = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting from local storage:', error);
    return null;
  }
};

// Remove data from local storage
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from local storage:', error);
  }
};

// Save a pending session to sync later
export const savePendingSession = (session: Partial<Session>): void => {
  try {
    const pendingSessions = getPendingSessions();
    // Add a client-side ID to identify this session
    const sessionWithClientId = {
      ...session,
      client_id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    pendingSessions.push(sessionWithClientId);
    saveToStorage(STORAGE_KEYS.PENDING_SESSIONS, pendingSessions);
  } catch (error) {
    console.error('Error saving pending session:', error);
  }
};

// Get all pending sessions that need to be synced
export const getPendingSessions = (): Array<Partial<Session> & { client_id: string }> => {
  return getFromStorage(STORAGE_KEYS.PENDING_SESSIONS) || [];
};

// Remove a pending session after successful sync
export const removePendingSession = (clientId: string): void => {
  try {
    const pendingSessions = getPendingSessions();
    const updatedSessions = pendingSessions.filter(session => session.client_id !== clientId);
    saveToStorage(STORAGE_KEYS.PENDING_SESSIONS, updatedSessions);
  } catch (error) {
    console.error('Error removing pending session:', error);
  }
};

// Clear all pending sessions
export const clearPendingSessions = (): void => {
  removeFromStorage(STORAGE_KEYS.PENDING_SESSIONS);
};

// Save active offline session
export const saveActiveOfflineSession = (
  interviewerId: string,
  startTime: string,
  startLocation?: { latitude: number; longitude: number; address?: string }
): void => {
  saveToStorage(STORAGE_KEYS.ACTIVE_SESSION, {
    interviewer_id: interviewerId,
    start_time: startTime,
    start_latitude: startLocation?.latitude || null,
    start_longitude: startLocation?.longitude || null,
    start_address: startLocation?.address || null,
    is_active: true,
    created_offline: true
  });
};

// Get active offline session
export const getActiveOfflineSession = (): Partial<Session> | null => {
  return getFromStorage(STORAGE_KEYS.ACTIVE_SESSION);
};

// Clear active offline session
export const clearActiveOfflineSession = (): void => {
  removeFromStorage(STORAGE_KEYS.ACTIVE_SESSION);
};
