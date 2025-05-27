
import { SyncOperation } from './types';
import { supabase } from '@/integrations/supabase/client';
import { syncQueueDB } from './database';

export async function processInterviewOperation(operation: SyncOperation): Promise<boolean> {
  try {
    console.log(`[InterviewProcessor] Processing ${operation.type} operation:`, operation.id);
    
    switch (operation.type) {
      case 'INTERVIEW_START':
        return await processInterviewStart(operation);
      case 'INTERVIEW_END':
        return await processInterviewEnd(operation);
      case 'INTERVIEW_UPDATE':
        return await processInterviewUpdate(operation);
      case 'INTERVIEW_DELETE':
        return await processInterviewDelete(operation);
      case 'INTERVIEW_RESULT':
        return await processInterviewResult(operation);
      default:
        console.warn(`[InterviewProcessor] Unknown operation type: ${operation.type}`);
        return false;
    }
  } catch (error) {
    console.error(`[InterviewProcessor] Error processing operation ${operation.id}:`, error);
    return false;
  }
}

async function processInterviewStart(operation: SyncOperation): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .insert([operation.data])
      .select()
      .single();
      
    if (error) {
      console.error('[InterviewProcessor] Error creating interview:', error);
      return false;
    }
    
    // Update related operations with the new online ID
    if (operation.offlineId && data.id) {
      await syncQueueDB.updateRelatedOperationsOnlineId(
        operation.offlineId,
        data.id,
        operation.id
      );
    }
    
    console.log(`[InterviewProcessor] Interview created successfully: ${data.id}`);
    return true;
  } catch (error) {
    console.error('[InterviewProcessor] Error in processInterviewStart:', error);
    return false;
  }
}

async function processInterviewEnd(operation: SyncOperation): Promise<boolean> {
  try {
    const interviewId = operation.onlineId;
    if (!interviewId) {
      console.error('[InterviewProcessor] No interview ID for INTERVIEW_END operation');
      return false;
    }
    
    const { error } = await supabase
      .from('interviews')
      .update(operation.data)
      .eq('id', interviewId);
      
    if (error) {
      console.error('[InterviewProcessor] Error ending interview:', error);
      return false;
    }
    
    console.log(`[InterviewProcessor] Interview ended successfully: ${interviewId}`);
    return true;
  } catch (error) {
    console.error('[InterviewProcessor] Error in processInterviewEnd:', error);
    return false;
  }
}

async function processInterviewUpdate(operation: SyncOperation): Promise<boolean> {
  try {
    const interviewId = operation.onlineId;
    if (!interviewId) {
      console.error('[InterviewProcessor] No interview ID for INTERVIEW_UPDATE operation');
      return false;
    }
    
    const { error } = await supabase
      .from('interviews')
      .update(operation.data)
      .eq('id', interviewId);
      
    if (error) {
      console.error('[InterviewProcessor] Error updating interview:', error);
      return false;
    }
    
    console.log(`[InterviewProcessor] Interview updated successfully: ${interviewId}`);
    return true;
  } catch (error) {
    console.error('[InterviewProcessor] Error in processInterviewUpdate:', error);
    return false;
  }
}

async function processInterviewDelete(operation: SyncOperation): Promise<boolean> {
  try {
    const interviewId = operation.onlineId;
    if (!interviewId) {
      console.error('[InterviewProcessor] No interview ID for INTERVIEW_DELETE operation');
      return false;
    }
    
    const { error } = await supabase
      .from('interviews')
      .delete()
      .eq('id', interviewId);
      
    if (error) {
      console.error('[InterviewProcessor] Error deleting interview:', error);
      return false;
    }
    
    console.log(`[InterviewProcessor] Interview deleted successfully: ${interviewId}`);
    return true;
  } catch (error) {
    console.error('[InterviewProcessor] Error in processInterviewDelete:', error);
    return false;
  }
}

async function processInterviewResult(operation: SyncOperation): Promise<boolean> {
  try {
    const interviewId = operation.onlineId;
    if (!interviewId) {
      console.error('[InterviewProcessor] No interview ID for INTERVIEW_RESULT operation');
      return false;
    }
    
    const { error } = await supabase
      .from('interviews')
      .update({
        result: operation.data.result,
        is_active: false
      })
      .eq('id', interviewId);
      
    if (error) {
      console.error('[InterviewProcessor] Error setting interview result:', error);
      return false;
    }
    
    console.log(`[InterviewProcessor] Interview result set successfully: ${interviewId}`);
    return true;
  } catch (error) {
    console.error('[InterviewProcessor] Error in processInterviewResult:', error);
    return false;
  }
}
