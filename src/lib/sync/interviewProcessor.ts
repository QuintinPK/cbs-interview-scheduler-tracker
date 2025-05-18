
import { supabase } from '@/integrations/supabase/client';
import { SyncOperation } from './types';
import { syncQueueDB } from './database';

// Process interview-related operations
export async function processInterviewOperation(operation: SyncOperation): Promise<boolean> {
  switch (operation.type) {
    case 'INTERVIEW_START':
      return await syncInterviewStart(operation);
    case 'INTERVIEW_END':
      return await syncInterviewEnd(operation);
    case 'INTERVIEW_RESULT':
      return await syncInterviewResult(operation);
    case 'INTERVIEW_UPDATE':
      // Future implementation
      return false;
    default:
      console.warn(`[InterviewProcessor] Unsupported operation type: ${operation.type}`);
      return false;
  }
}

// Sync an interview start operation
async function syncInterviewStart(operation: SyncOperation): Promise<boolean> {
  const { 
    session_id, 
    project_id, 
    candidate_name, 
    start_time, 
    start_latitude, 
    start_longitude, 
    start_address 
  } = operation.data;
  
  if (!session_id) {
    console.error('[InterviewProcessor] Cannot start interview without session ID');
    return false;
  }
  
  // First check if interview already exists
  if (operation.onlineId) {
    const { data: existingInterview } = await supabase
      .from('interviews')
      .select('id')
      .eq('id', operation.onlineId)
      .single();
      
    if (existingInterview) {
      console.log(`[InterviewProcessor] Interview ${operation.onlineId} already exists, marking as completed`);
      return true;
    }
  }
  
  // Insert new interview
  const { data: interview, error } = await supabase
    .from('interviews')
    .insert([{
      session_id,
      project_id,
      candidate_name: candidate_name || 'New interview',
      start_time,
      start_latitude: start_latitude || null,
      start_longitude: start_longitude || null,
      start_address: start_address || null,
      is_active: true
    }])
    .select()
    .single();
    
  if (error) {
    console.error('[InterviewProcessor] Error creating interview:', error);
    return false;
  }
  
  console.log(`[InterviewProcessor] Created interview ${interview.id} from offline ID ${operation.offlineId}`);
  
  // Update the operation with the online ID
  await syncQueueDB.updateOperationStatus(operation.id, operation.status, {
    onlineId: interview.id
  });
  
  // Update all related operations with the same offline ID
  if (operation.offlineId) {
    await syncQueueDB.updateRelatedOperationsOnlineId(operation.offlineId, interview.id, operation.id);
  }
  
  return true;
}

// Sync an interview end operation
async function syncInterviewEnd(operation: SyncOperation): Promise<boolean> {
  const { end_time, end_latitude, end_longitude, end_address } = operation.data;
  const interviewId = operation.onlineId;
  
  if (!interviewId) {
    console.error('[InterviewProcessor] Cannot end interview without online ID');
    return false;
  }
  
  // Update the interview
  const { error } = await supabase
    .from('interviews')
    .update({
      end_time,
      end_latitude: end_latitude || null,
      end_longitude: end_longitude || null,
      end_address: end_address || null
    })
    .eq('id', interviewId);
    
  if (error) {
    console.error('[InterviewProcessor] Error ending interview:', error);
    return false;
  }
  
  return true;
}

// Sync an interview result operation
async function syncInterviewResult(operation: SyncOperation): Promise<boolean> {
  const { result } = operation.data;
  const interviewId = operation.onlineId;
  
  if (!interviewId) {
    console.error('[InterviewProcessor] Cannot set interview result without online ID');
    return false;
  }
  
  // Update the interview
  const { error } = await supabase
    .from('interviews')
    .update({
      result,
      is_active: false
    })
    .eq('id', interviewId);
    
  if (error) {
    console.error('[InterviewProcessor] Error setting interview result:', error);
    return false;
  }
  
  return true;
}
