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

export const cacheInterviewer = async (interviewer: Interviewer): Promise<void> => {
  try {
    await db.interviewers.put({
      id: interviewer.id,
      code: interviewer.code,
      firstName: interviewer.first_name,
      lastName: interviewer.last_name,
      email: interviewer.email || null,
      phone: interviewer.phone || null,
      island: interviewer.island || null
    });
    console.log(`[OfflineDB] Cached interviewer: ${interviewer.code}`);
  } catch (error) {
    console.error('[OfflineDB] Error caching interviewer:', error);
    throw error;
  }
};
