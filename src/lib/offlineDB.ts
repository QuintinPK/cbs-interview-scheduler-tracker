
// Re-export all functionality from the refactored modules
export { isOnline } from './offline/db';
export type { LocationData, Interviewer, Project } from './offline/db';

// Sessions
export { 
  saveOfflineSession,
  updateOfflineSession,
  getAllOfflineSessions,
  getSessionsForInterviewer,
  getOfflineSession,
  getUnsyncedSessionsCount
} from './offline/sessions';

// Interviews
export {
  saveOfflineInterview,
  updateOfflineInterview,
  updateOfflineInterviewResult,
  getAllOfflineInterviews,
  getInterviewsForOfflineSession,
  getOfflineInterview,
  getUnsyncedInterviewsCount
} from './offline/interviews';
export type { SaveInterviewOptions } from './offline/interviews';

// User-related (Interviewers and Projects)
export {
  cacheInterviewer,
  getInterviewerByCode,
  cacheProjects,
  getCachedProjects
} from './offline/users';

// Sync-related
export {
  syncOfflineSessions,
  acquireSyncLock,
  releaseSyncLock,
  getActiveSyncLock,
  logSync,
  getSyncStatus
} from './offline/sync';
