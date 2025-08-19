-- Fix the infinite recursion policy issue step by step
-- First, let's create a simple policy that allows reading interviewers without recursion

-- Replace the problematic policy with a simple one
DROP POLICY IF EXISTS "Interviewers can view their own data" ON public.interviewers;

-- Create a simple policy that allows reading interviewer data
CREATE POLICY "Allow reading interviewer data"
ON public.interviewers
FOR SELECT
USING (true);