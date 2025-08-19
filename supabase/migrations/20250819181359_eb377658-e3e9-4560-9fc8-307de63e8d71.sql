-- Phase 1: Fix Critical RLS Policy Issue
-- Add RLS policies to user_roles table to allow security definer functions to work

-- Allow users to read their own role (needed for security definer functions to work)
CREATE POLICY "Users can read own role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow admins to manage all user roles
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Phase 3: Fix Security Issues - Add search_path to security definer functions
-- Update has_role function with proper search_path
CREATE OR REPLACE FUNCTION public.has_role(user_uuid uuid, required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = user_uuid
    AND role = required_role
  );
$function$;

-- Update is_admin function with proper search_path
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT public.has_role(user_uuid, 'admin');
$function$;