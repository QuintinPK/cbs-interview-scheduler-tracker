
-- Create a function to efficiently calculate average rating
CREATE OR REPLACE FUNCTION public.get_interviewer_average_rating(p_interviewer_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    avg_rating NUMERIC;
BEGIN
    SELECT ROUND(AVG(rating)::NUMERIC, 1)
    INTO avg_rating
    FROM public.interviewer_evaluations
    WHERE interviewer_id = p_interviewer_id;
    
    RETURN avg_rating;
END;
$$;
