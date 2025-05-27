
import { SyncOperation } from './types';
import { supabase } from '@/integrations/supabase/client';
import { syncQueueDB } from './database';

export async function processSessionOperation(operation: SyncOperation): Promise<boolean> {
  try {
    console.log(`[SessionProcessor] Processing ${operation.type} operation:`, operation.id);
    
    switch (operation.type) {
      case 'SESSION_START':
        return await processSessionStart(operation);
      case 'SESSION_END':
        return await processSessionEnd(operation);
      case 'SESSION_UPDATE':
        return await processSessionUpdate(operation);
      case 'SESSION_DELETE':
        return await processSessionDelete(operation);
      default:
        console.warn(`[SessionProcessor] Unknown operation type: ${operation.type}`);
        return false;
    }
  } catch (error) {
    console.error(`[SessionProcessor] Error processing operation ${operation.id}:`, error);
    return false;
  }
}

async function processSessionStart(operation: SyncOperation): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert([operation.data])
      .select()
      .single();
      
    if (error) {
      console.error('[SessionProcessor] Error creating session:', error);
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
    
    console.log(`[SessionProcessor] Session created successfully: ${data.id}`);
    return true;
  } catch (error) {
    console.error('[SessionProcessor] Error in processSessionStart:', error);
    return false;
  }
}

async function processSessionEnd(operation: SyncOperation): Promise<boolean> {
  try {
    const sessionId = operation.onlineId;
    if (!sessionId) {
      console.error('[SessionProcessor] No session ID for SESSION_END operation');
      return false;
    }
    
    const { error } = await supabase
      .from('sessions')
      .update(operation.data)
      .eq('id', sessionId);
      
    if (error) {
      console.error('[SessionProcessor] Error ending session:', error);
      return false;
    }
    
    console.log(`[SessionProcessor] Session ended successfully: ${sessionId}`);
    return true;
  } catch (error) {
    console.error('[SessionProcessor] Error in processSessionEnd:', error);
    return false;
  }
}

async function processSessionUpdate(operation: SyncOperation): Promise<boolean> {
  try {
    const sessionId = operation.onlineId;
    if (!sessionId) {
      console.error('[SessionProcessor] No session ID for SESSION_UPDATE operation');
      return false;
    }
    
    const { error } = await supabase
      .from('sessions')
      .update(operation.data)
      .eq('id', sessionId);
      
    if (error) {
      console.error('[SessionProcessor] Error updating session:', error);
      return false;
    }
    
    console.log(`[SessionProcessor] Session updated successfully: ${sessionId}`);
    return true;
  } catch (error) {
    console.error('[SessionProcessor] Error in processSessionUpdate:', error);
    return false;
  }
}

async function processSessionDelete(operation: SyncOperation): Promise<boolean> {
  try {
    const sessionId = operation.onlineId;
    if (!sessionId) {
      console.error('[SessionProcessor] No session ID for SESSION_DELETE operation');
      return false;
    }
    
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);
      
    if (error) {
      console.error('[SessionProcessor] Error deleting session:', error);
      return false;
    }
    
    console.log(`[SessionProcessor] Session deleted successfully: ${sessionId}`);
    return true;
  } catch (error) {
    console.error('[SessionProcessor] Error in processSessionDelete:', error);
    return false;
  }
}
