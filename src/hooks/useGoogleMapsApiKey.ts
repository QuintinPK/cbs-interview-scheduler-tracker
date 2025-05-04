
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGoogleMapsApiKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('config')
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
          console.warn('Google Maps API key not found in config');
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
    };
    
    fetchApiKey();
  }, [toast]);
  
  return { apiKey, loading, error };
};
