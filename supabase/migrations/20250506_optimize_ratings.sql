
-- Function to get average rating for a specific interviewer
CREATE OR REPLACE FUNCTION get_interviewer_average_rating(interviewer_id_param UUID)
RETURNS FLOAT AS $$
  SELECT AVG(rating)::FLOAT 
  FROM interviewer_evaluations
  WHERE interviewer_id = interviewer_id_param;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to get average ratings for all interviewers
CREATE OR REPLACE FUNCTION get_all_interviewer_ratings()
RETURNS TABLE(interviewer_id UUID, average_rating FLOAT) AS $$
  SELECT 
    interviewer_id,
    AVG(rating)::FLOAT as average_rating
  FROM 
    interviewer_evaluations
  GROUP BY 
    interviewer_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Add indexes to improve performance if they don't exist already
DO $$
BEGIN
    -- Check if the indexes exist before creating them
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'evaluation_tags_junction' AND indexname = 'idx_evaluation_tags_junction_evaluation_id'
    ) THEN
        CREATE INDEX idx_evaluation_tags_junction_evaluation_id ON public.evaluation_tags_junction(evaluation_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'evaluation_tags_junction' AND indexname = 'idx_evaluation_tags_junction_tag_id'
    ) THEN
        CREATE INDEX idx_evaluation_tags_junction_tag_id ON public.evaluation_tags_junction(tag_id);
    END IF;
    
    -- Ensure we have proper indexes on interviewer_evaluations too
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'interviewer_evaluations' AND indexname = 'idx_interviewer_evaluations_interviewer_id'
    ) THEN
        CREATE INDEX idx_interviewer_evaluations_interviewer_id ON public.interviewer_evaluations(interviewer_id);
    END IF;
END $$;
