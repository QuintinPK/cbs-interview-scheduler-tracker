
-- Create a function to efficiently retrieve evaluations with their tags
CREATE OR REPLACE FUNCTION public.get_interviewer_evaluations_with_tags(p_interviewer_id UUID)
RETURNS TABLE (
  evaluation_id UUID,
  interviewer_id UUID,
  project_id UUID,
  session_id UUID,
  rating SMALLINT,
  remarks TEXT,
  created_at TIMESTAMPTZ,
  created_by TEXT,
  tag_id UUID,
  tag_name TEXT,
  tag_category TEXT,
  tag_created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id AS evaluation_id,
    e.interviewer_id,
    e.project_id,
    e.session_id,
    e.rating,
    e.remarks,
    e.created_at,
    e.created_by,
    t.id AS tag_id,
    t.name AS tag_name,
    t.category AS tag_category,
    t.created_at AS tag_created_at
  FROM 
    public.interviewer_evaluations e
  LEFT JOIN 
    public.evaluation_tags_junction j ON e.id = j.evaluation_id
  LEFT JOIN 
    public.evaluation_tags t ON j.tag_id = t.id
  WHERE 
    e.interviewer_id = p_interviewer_id
  ORDER BY 
    e.created_at DESC;
END;
$$;

-- Create an index to improve performance of the join query
CREATE INDEX IF NOT EXISTS idx_evaluation_tags_junction_evaluation_id
ON public.evaluation_tags_junction(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_interviewer_evaluations_interviewer_id
ON public.interviewer_evaluations(interviewer_id);
