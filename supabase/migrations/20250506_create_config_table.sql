
-- Create the config table for storing application configuration
CREATE TABLE IF NOT EXISTS public.config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read config
CREATE POLICY "Allow authenticated read access" ON public.config
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_config_key ON public.config(key);

-- Insert Google Maps API key if not exists
INSERT INTO public.config (key, value, description)
VALUES (
  'google_maps_api_key', 
  '', 
  'API key for Google Maps integration'
) ON CONFLICT (key) DO NOTHING;
