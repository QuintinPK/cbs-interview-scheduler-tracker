
import { supabase } from '@/integrations/supabase/client';
import { SyncOperation } from './types';
import { syncQueueDB } from './database';

// Process session-related operations
export async function processSessionOperation(operation: SyncOperation): Promise<boolean> {
  switch (operation.type) {
    case 'SESSION_START':
      return await syncSessionStart(operation);
    case 'SESSION_END':
      return await syncSessionEnd(operation);
    case 'SESSION_UPDATE':
      // Future implementation
      return false;
    default:
      console.warn(`[SessionProcessor] Unsupported operation type: ${operation.type}`);
      return false;
  }
}

// Sync a session start operation
async function syncSessionStart(operation: SyncOperation): Promise<boolean> {
  const { interviewer_id, project_id, start_time, start_latitude, start_longitude, start_address } = operation.data;
  
  // First check if this session was already synced (prevent duplicates)
  if (operation.onlineId) {
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', operation.onlineId)
      .single();
      
    if (existingSession) {
      console.log(`[SessionProcessor] Session ${operation.onlineId} already exists, marking as completed`);
      return true;
    }
  }
  
  // Insert new session
  const { data: session, error } = await supabase
    .from('sessions')
    .insert([{
      interviewer_id,
      project_id,
      start_time,
      start_latitude: start_latitude || null,
      start_longitude: start_longitude || null,
      start_address: start_address || null,
      is_active: true
    }])
    .select()
    .single();
    
  if (error) {
    console.error('[SessionProcessor] Error creating session:', error);
    return false;
  }
  
  console.log(`[SessionProcessor] Created session ${session.id} from offline ID ${operation.offlineId}`);
  
  // Update the operation with the online ID
  await syncQueueDB.updateOperationStatus(operation.id, operation.status, {
    onlineId: session.id
  });
  
  // Update all related operations with the same offline ID
  if (operation.offlineId) {
    await syncQueueDB.updateRelatedOperationsOnlineId(operation.offlineId, session.id, operation.id);
  }
  
  return true;
}

// Sync a session end operation
async function syncSessionEnd(operation: SyncOperation): Promise<boolean> {
  const { end_time, end_latitude, end_longitude, end_address } = operation.data;
  const sessionId = operation.onlineId;
  
  if (!sessionId) {
    console.error('[SessionProcessor] Cannot end session without online ID');
    return false;
  }
  
  // Update the session
  const { error } = await supabase
    .from('sessions')
    .update({
      end_time,
      end_latitude: end_latitude || null,
      end_longitude: end_longitude || null,
      end_address: end_address || null,
      is_active: false
    })
    .eq('id', sessionId);
    
  if (error) {
    console.error('[SessionProcessor] Error ending session:', error);
    return false;
  }
  
  return true;
}
