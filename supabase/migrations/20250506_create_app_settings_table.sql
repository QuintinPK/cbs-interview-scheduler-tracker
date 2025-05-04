
-- Create the app_settings table for storing application configuration if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_by TEXT
);

-- Add Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read app_settings
CREATE POLICY "Allow authenticated read access" ON public.app_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);

-- Insert Google Maps API key if not exists
INSERT INTO public.app_settings (key, value, updated_at)
VALUES (
  'google_maps_api_key', 
  '', 
  now()
) ON CONFLICT (key) DO NOTHING;
