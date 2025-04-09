
-- Create admin function to update hourly rate
CREATE OR REPLACE FUNCTION public.admin_update_hourly_rate(rate numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert the hourly rate (stored as a numeric value, not JSON object)
  INSERT INTO app_settings (key, value, updated_at, updated_by)
  VALUES ('hourly_rate', rate::numeric, now(), 'admin')
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = rate::numeric,
    updated_at = now(),
    updated_by = 'admin';
  
  RETURN true;
END;
$$;

-- Create admin function to update password
CREATE OR REPLACE FUNCTION public.admin_update_password(password_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert the password hash - Store as direct string value, not as JSON object
  INSERT INTO app_settings (key, value, updated_at, updated_by)
  VALUES ('admin_password_hash', password_hash, now(), 'admin')
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = password_hash,
    updated_at = now(),
    updated_by = 'admin';
  
  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_update_hourly_rate TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_hourly_rate TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_password TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_password TO anon;
