-- Fix remaining functions that need search_path for security
-- Update all data aggregation functions to include search_path

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = user_uuid 
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_sessions_duration_data(p_rows text[], p_columns text[], p_values text[], p_filters jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Get sessions with duration data
  WITH session_data AS (
    SELECT
      DATE(s.start_time) AS interview_date,
      i.id AS interviewer_id,
      i.first_name || ' ' || i.last_name AS interviewer_name,
      p.id AS project_id,
      p.name AS project_name,
      COUNT(s.id) AS total_sessions,
      SUM(CASE WHEN s.end_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (s.end_time - s.start_time))/60 
      ELSE 0 END) AS total_duration,
      AVG(CASE WHEN s.end_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (s.end_time - s.start_time))/60 
      ELSE NULL END) AS avg_session_duration,
      MAX(CASE WHEN s.end_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (s.end_time - s.start_time))/60 
      ELSE NULL END) AS max_session_duration,
      MIN(CASE WHEN s.end_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (s.end_time - s.start_time))/60 
      ELSE NULL END) AS min_session_duration
    FROM
      sessions s
      JOIN interviewers i ON s.interviewer_id = i.id
      LEFT JOIN projects p ON s.project_id = p.id
    GROUP BY
      DATE(s.start_time), i.id, i.first_name, i.last_name, p.id, p.name
  )
  -- Build dynamic query based on parameters
  SELECT
    jsonb_agg(json_build_object(
      -- Add selected fields dynamically
      'interview_date', sd.interview_date,
      'interviewer_id', sd.interviewer_id,
      'interviewer_name', sd.interviewer_name,
      'project_id', sd.project_id,
      'project_name', sd.project_name,
      'total_sessions', sd.total_sessions,
      'total_duration', sd.total_duration,
      'avg_session_duration', sd.avg_session_duration,
      'max_session_duration', sd.max_session_duration,
      'min_session_duration', sd.min_session_duration
    ))
  INTO
    result
  FROM
    session_data sd;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_interviewers_sessions_data(p_rows text[], p_columns text[], p_values text[], p_filters jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Join interviewers and sessions data
  WITH combined_data AS (
    SELECT
      i.id AS interviewer_id,
      i.first_name || ' ' || i.last_name AS interviewer_name,
      i.code AS interviewer_code,
      i.island,
      s.id AS session_id,
      s.start_time AS session_start_time,
      s.end_time AS session_end_time,
      CASE 
        WHEN s.end_time IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (s.end_time - s.start_time))/60 
        ELSE NULL 
      END AS session_duration,
      s.is_active,
      s.project_id,
      p.name AS project_name,
      COUNT(s.id) OVER (PARTITION BY i.id) AS sessions_count,
      AVG(CASE WHEN s.end_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (s.end_time - s.start_time))/60 
      END) OVER (PARTITION BY i.id) AS avg_duration
    FROM
      interviewers i
      LEFT JOIN sessions s ON i.id = s.interviewer_id
      LEFT JOIN projects p ON s.project_id = p.id
  )
  -- Build dynamic query based on parameters
  SELECT
    jsonb_agg(json_build_object(
      -- Add selected fields dynamically
      'interviewer_id', cd.interviewer_id,
      'interviewer_name', cd.interviewer_name,
      'interviewer_code', cd.interviewer_code,
      'island', cd.island,
      'session_id', cd.session_id,
      'session_start_time', cd.session_start_time,
      'session_end_time', cd.session_end_time,
      'session_duration', cd.session_duration,
      'is_active', cd.is_active,
      'project_id', cd.project_id,
      'project_name', cd.project_name,
      'sessions_count', cd.sessions_count,
      'avg_duration', cd.avg_duration
    ))
  INTO
    result
  FROM
    combined_data cd;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_interviews_results_data(p_rows text[], p_columns text[], p_values text[], p_filters jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Get interview data with results
  WITH interview_data AS (
    SELECT
      iv.id AS interview_id,
      iv.candidate_name,
      iv.result,
      iv.session_id,
      i.id AS interviewer_id,
      i.first_name || ' ' || i.last_name AS interviewer_name,
      p.id AS project_id,
      p.name AS project_name,
      DATE(iv.start_time) AS interview_date,
      iv.start_time,
      iv.end_time,
      CASE 
        WHEN iv.end_time IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (iv.end_time - iv.start_time))/60 
        ELSE NULL 
      END AS duration,
      COUNT(iv.id) OVER (PARTITION BY i.id) AS interviews_count,
      CAST(
        COUNT(CASE WHEN iv.result = 'success' THEN 1 ELSE NULL END) OVER (PARTITION BY i.id) AS FLOAT
      ) / 
      NULLIF(COUNT(iv.id) OVER (PARTITION BY i.id), 0) * 100 AS success_rate
    FROM
      interviews iv
      JOIN sessions s ON iv.session_id = s.id
      JOIN interviewers i ON s.interviewer_id = i.id
      LEFT JOIN projects p ON s.project_id = p.id OR iv.project_id = p.id
  )
  -- Build dynamic query based on parameters
  SELECT
    jsonb_agg(json_build_object(
      -- Add selected fields dynamically
      'interview_id', id.interview_id,
      'candidate_name', id.candidate_name,
      'result', id.result,
      'session_id', id.session_id,
      'interviewer_id', id.interviewer_id,
      'interviewer_name', id.interviewer_name,
      'project_id', id.project_id,
      'project_name', id.project_name,
      'interview_date', id.interview_date,
      'start_time', id.start_time,
      'end_time', id.end_time,
      'duration', id.duration,
      'interviews_count', id.interviews_count,
      'success_rate', id.success_rate
    ))
  INTO
    result
  FROM
    interview_data id;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_projects_interviewers_data(p_rows text[], p_columns text[], p_values text[], p_filters jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Join projects and interviewers data through project_interviewers
  WITH combined_data AS (
    SELECT
      p.id AS project_id,
      p.name AS project_name,
      p.start_date,
      p.end_date,
      p.response_rate,
      p.non_response_rate,
      i.id AS interviewer_id,
      i.first_name || ' ' || i.last_name AS interviewer_name,
      i.code AS interviewer_code,
      i.island,
      COUNT(DISTINCT pi.interviewer_id) OVER (PARTITION BY p.id) AS interviewers_count,
      COUNT(DISTINCT pi.project_id) OVER (PARTITION BY i.id) AS projects_count
    FROM
      projects p
      JOIN project_interviewers pi ON p.id = pi.project_id
      JOIN interviewers i ON pi.interviewer_id = i.id
  )
  -- Build dynamic query based on parameters
  SELECT
    jsonb_agg(json_build_object(
      -- Add selected fields dynamically
      'project_id', cd.project_id,
      'project_name', cd.project_name,
      'start_date', cd.start_date,
      'end_date', cd.end_date,
      'response_rate', cd.response_rate,
      'non_response_rate', cd.non_response_rate,
      'interviewer_id', cd.interviewer_id,
      'interviewer_name', cd.interviewer_name,
      'interviewer_code', cd.interviewer_code,
      'island', cd.island,
      'interviewers_count', cd.interviewers_count,
      'projects_count', cd.projects_count
    ))
  INTO
    result
  FROM
    combined_data cd;

  RETURN result;
END;
$function$;