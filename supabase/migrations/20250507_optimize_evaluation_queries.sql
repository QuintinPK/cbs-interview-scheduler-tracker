
-- Create or replace the function for getting average ratings with improved performance
CREATE OR REPLACE FUNCTION get_interviewer_average_rating(interviewer_id_param UUID)
RETURNS FLOAT AS $$
DECLARE
  has_evals INTEGER;
  avg_rating FLOAT;
BEGIN
  -- First check if the interviewer has any evaluations (fast path)
  SELECT COUNT(*) INTO has_evals
  FROM interviewer_evaluations
  WHERE interviewer_id = interviewer_id_param
  LIMIT 1;
  
  -- If no evaluations, return null immediately without doing expensive calculation
  IF has_evals = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Otherwise calculate the average
  SELECT AVG(rating)::FLOAT INTO avg_rating
  FROM interviewer_evaluations
  WHERE interviewer_id = interviewer_id_param;
  
  RETURN avg_rating;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Optimize the function for all interviewer ratings
CREATE OR REPLACE FUNCTION get_all_interviewer_ratings()
RETURNS TABLE(interviewer_id UUID, average_rating FLOAT) AS $$
BEGIN
  -- Only return interviewers who actually have evaluations
  RETURN QUERY
  SELECT 
    ie.interviewer_id,
    AVG(ie.rating)::FLOAT as average_rating
  FROM 
    interviewer_evaluations ie
  GROUP BY 
    ie.interviewer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
