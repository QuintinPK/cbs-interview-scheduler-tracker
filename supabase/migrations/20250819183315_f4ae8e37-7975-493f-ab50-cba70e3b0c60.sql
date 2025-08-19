-- Fix infinite recursion in interviewers table RLS policies
-- Drop the problematic policies and create safer ones

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Interviewers can view their own data" ON public.interviewers;
DROP POLICY IF EXISTS "Enable all access to interviewers" ON public.interviewers;

-- Create new, safe policies
-- Allow anyone to read interviewer data by code (needed for interviewer login)
CREATE POLICY "Allow reading interviewers by code"
ON public.interviewers
FOR SELECT
USING (true);

-- Allow admins to do everything
CREATE POLICY "Admins can manage interviewers"
ON public.interviewers
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Allow authenticated users to insert/update (needed for interviewer registration/updates)
CREATE POLICY "Allow authenticated users to modify interviewers"
ON public.interviewers
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update interviewers"
ON public.interviewers
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);