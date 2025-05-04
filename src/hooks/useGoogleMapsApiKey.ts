
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGoogleMapsApiKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchApiKey = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use app_settings table instead of config
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'google_maps_api_key')
        .single();
      
      if (error) {
        console.error('Error fetching Google Maps API key:', error);
        setError('Failed to load Google Maps API key');
        toast({
          title: 'Error',
          description: 'Failed to load Google Maps API key',
          variant: 'destructive',
        });
        setApiKey(null);
        return;
      }
      
      if (data && data.value) {
        setApiKey(data.value);
      } else {
        console.warn('Google Maps API key not found in app_settings');
        setApiKey(null);
        setError('Google Maps API key not configured');
      }
    } catch (err) {
      console.error('Unexpected error fetching Google Maps API key:', err);
      setError('An unexpected error occurred');
      setApiKey(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchApiKey();
  }, [fetchApiKey]);
  
  const updateApiKey = useCallback(async (newApiKey: string | null) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('app_settings')
        .update({ value: newApiKey })
        .eq('key', 'google_maps_api_key');
      
      if (error) {
        console.error('Error updating Google Maps API key:', error);
        setError('Failed to update Google Maps API key');
        toast({
          title: 'Error',
          description: 'Failed to update Google Maps API key',
          variant: 'destructive',
        });
        return false;
      }
      
      setApiKey(newApiKey);
      toast({
        title: 'Success',
        description: 'Google Maps API key updated successfully',
      });
      return true;
    } catch (err) {
      console.error('Unexpected error updating Google Maps API key:', err);
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  return { apiKey, loading, error, updateApiKey };
};
