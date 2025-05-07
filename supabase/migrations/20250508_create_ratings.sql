
-- Create simplified ratings table
CREATE TABLE IF NOT EXISTS public.interviewer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interviewer_id UUID NOT NULL REFERENCES public.interviewers(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT
);

-- Create index for faster lookups by interviewer
CREATE INDEX IF NOT EXISTS idx_interviewer_ratings_interviewer_id ON public.interviewer_ratings(interviewer_id);

-- Enable Row Level Security
ALTER TABLE public.interviewer_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for accessing ratings
CREATE POLICY "Anyone can view ratings"
  ON public.interviewer_ratings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create ratings"
  ON public.interviewer_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own ratings"
  ON public.interviewer_ratings
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.email());

CREATE POLICY "Users can delete their own ratings"
  ON public.interviewer_ratings
  FOR DELETE
  TO authenticated
  USING (created_by = auth.email());
