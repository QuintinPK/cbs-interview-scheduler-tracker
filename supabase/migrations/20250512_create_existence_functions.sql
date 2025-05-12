
-- Create custom functions to check for session and interview existence
-- This helps to reduce type instantiation on the client side

CREATE OR REPLACE FUNCTION check_session_exists(p_unique_key TEXT)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.sessions
  WHERE unique_key = p_unique_key
  LIMIT 1;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_interview_exists(p_unique_key TEXT)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.interviews
  WHERE unique_key = p_unique_key
  LIMIT 1;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure unique_key columns exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'sessions' 
                 AND column_name = 'unique_key') THEN
    ALTER TABLE public.sessions ADD COLUMN unique_key TEXT;
    CREATE UNIQUE INDEX idx_sessions_unique_key ON public.sessions (unique_key);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'interviews' 
                 AND column_name = 'unique_key') THEN
    ALTER TABLE public.interviews ADD COLUMN unique_key TEXT;
    CREATE UNIQUE INDEX idx_interviews_unique_key ON public.interviews (unique_key);
  END IF;
END;
$$;
