-- Align practice session completion with case conversation_policy (pass score + required objectives).

CREATE OR REPLACE FUNCTION public.submit_learning_turn(
  p_session_id bigint,
  p_turn_number integer,
  p_input_type public.session_input_type,
  p_raw_transcript text,
  p_normalized_transcript text,
  p_target_objective text,
  p_selected_action public.conversation_next_action,
  p_score_result jsonb,
  p_objective_result jsonb,
  p_grammar_result jsonb,
  p_prompt_version_id bigint DEFAULT NULL,
  p_model_configuration_id bigint DEFAULT NULL,
  p_model_name text DEFAULT 'fallback-model',
  p_latency_ms integer DEFAULT NULL,
  p_token_usage jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  completion_eligible boolean,
  completion_status public.learning_completion_status,
  average_score numeric,
  covered_objectives text[]
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_session public.learning_sessions%ROWTYPE;
  v_policy jsonb;
  v_covered text[];
  v_uncovered text[];
  v_required_objectives integer;
  v_completed_required integer;
  v_minimum_required_completed integer;
  v_required_completion numeric;
  v_min_pass numeric;
  v_avg_score numeric(5,2);
  v_completion_eligible boolean;
  v_new_status public.learning_completion_status;
BEGIN
  v_user_id := auth.uid();
  SELECT * INTO v_session FROM public.learning_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_user_id IS DISTINCT FROM v_session.user_id AND NOT public.is_admin_or_reviewer() THEN
    RAISE EXCEPTION 'Unauthorized session access';
  END IF;

  INSERT INTO public.learning_session_turns (
    session_id,
    turn_number,
    speaker,
    input_type,
    raw_transcript,
    normalized_transcript,
    selected_action,
    target_objective,
    objective_result,
    grammar_result,
    score_result,
    prompt_version_id,
    model_configuration_id,
    model_name,
    latency_ms,
    token_usage
  ) VALUES (
    p_session_id,
    p_turn_number,
    'user',
    p_input_type,
    p_raw_transcript,
    p_normalized_transcript,
    p_selected_action,
    p_target_objective,
    COALESCE(p_objective_result, '{}'::jsonb),
    COALESCE(p_grammar_result, '{}'::jsonb),
    COALESCE(p_score_result, '{}'::jsonb),
    p_prompt_version_id,
    p_model_configuration_id,
    p_model_name,
    p_latency_ms,
    COALESCE(p_token_usage, '{}'::jsonb)
  )
  ON CONFLICT (session_id, turn_number, speaker)
  DO UPDATE SET
    input_type = EXCLUDED.input_type,
    raw_transcript = EXCLUDED.raw_transcript,
    normalized_transcript = EXCLUDED.normalized_transcript,
    selected_action = EXCLUDED.selected_action,
    target_objective = EXCLUDED.target_objective,
    objective_result = EXCLUDED.objective_result,
    grammar_result = EXCLUDED.grammar_result,
    score_result = EXCLUDED.score_result,
    prompt_version_id = EXCLUDED.prompt_version_id,
    model_configuration_id = EXCLUDED.model_configuration_id,
    model_name = EXCLUDED.model_name,
    latency_ms = EXCLUDED.latency_ms,
    token_usage = EXCLUDED.token_usage;

  INSERT INTO public.learning_session_scores (
    session_id,
    turn_number,
    task_completion,
    grammar,
    clarity,
    professional_tone,
    vocabulary,
    fluency,
    overall_score
  ) VALUES (
    p_session_id,
    p_turn_number,
    COALESCE((p_score_result ->> 'task_completion')::numeric, 0),
    COALESCE((p_score_result ->> 'grammar')::numeric, 0),
    COALESCE((p_score_result ->> 'clarity')::numeric, 0),
    COALESCE((p_score_result ->> 'professional_tone')::numeric, 0),
    COALESCE((p_score_result ->> 'vocabulary')::numeric, 0),
    COALESCE((p_score_result ->> 'fluency')::numeric, 0),
    COALESCE((p_score_result ->> 'overall_score')::numeric, 0)
  )
  ON CONFLICT (session_id, turn_number)
  DO UPDATE SET
    task_completion = EXCLUDED.task_completion,
    grammar = EXCLUDED.grammar,
    clarity = EXCLUDED.clarity,
    professional_tone = EXCLUDED.professional_tone,
    vocabulary = EXCLUDED.vocabulary,
    fluency = EXCLUDED.fluency,
    overall_score = EXCLUDED.overall_score;

  IF p_target_objective IS NOT NULL THEN
    INSERT INTO public.learning_session_objectives (session_id, objective_code, completed, detected_count, last_turn_number)
    VALUES (
      p_session_id,
      p_target_objective,
      COALESCE((p_objective_result ->> 'completed')::boolean, false),
      CASE WHEN COALESCE((p_objective_result ->> 'detected')::boolean, false) THEN 1 ELSE 0 END,
      p_turn_number
    )
    ON CONFLICT (session_id, objective_code)
    DO UPDATE SET
      completed = public.learning_session_objectives.completed OR COALESCE((p_objective_result ->> 'completed')::boolean, false),
      detected_count = public.learning_session_objectives.detected_count
        + CASE WHEN COALESCE((p_objective_result ->> 'detected')::boolean, false) THEN 1 ELSE 0 END,
      last_turn_number = p_turn_number,
      updated_at = now();
  END IF;

  SELECT COALESCE(ARRAY_AGG(objective_code ORDER BY objective_code), '{}')
  INTO v_covered
  FROM public.learning_session_objectives
  WHERE session_id = p_session_id AND completed = true;

  SELECT COALESCE(ARRAY_AGG(lco.objective_code ORDER BY lco.sort_order), '{}')
  INTO v_uncovered
  FROM public.learning_case_objectives lco
  JOIN public.learning_sessions ls ON ls.case_version_id = lco.case_version_id
  WHERE ls.id = p_session_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.learning_session_objectives lso
      WHERE lso.session_id = p_session_id
        AND lso.objective_code = lco.objective_code
        AND lso.completed = true
    );

  SELECT lcv.conversation_policy
  INTO v_policy
  FROM public.learning_case_versions lcv
  WHERE lcv.id = v_session.case_version_id;

  v_min_pass := COALESCE((v_policy ->> 'minimum_pass_score')::numeric, 70);
  v_required_completion := COALESCE((v_policy ->> 'required_objective_completion')::numeric, 1.0);

  SELECT COUNT(*)
  INTO v_required_objectives
  FROM public.learning_case_objectives lco
  WHERE lco.case_version_id = v_session.case_version_id
    AND lco.required = true;

  SELECT COUNT(*)
  INTO v_completed_required
  FROM public.learning_session_objectives lso
  JOIN public.learning_case_objectives lco
    ON lco.case_version_id = v_session.case_version_id
   AND lco.objective_code = lso.objective_code
  WHERE lso.session_id = p_session_id
    AND lso.completed = true
    AND lco.required = true;

  IF v_required_completion <= 1 THEN
    v_minimum_required_completed := GREATEST(1, CEIL(GREATEST(v_required_objectives, 1) * v_required_completion));
  ELSE
    v_minimum_required_completed := LEAST(GREATEST(v_required_objectives, 1), FLOOR(v_required_completion));
  END IF;

  SELECT COALESCE(ROUND(AVG(overall_score), 2), 0)
  INTO v_avg_score
  FROM public.learning_session_scores
  WHERE session_id = p_session_id;

  v_completion_eligible := (
    v_completed_required >= v_minimum_required_completed
    AND GREATEST(v_session.turn_count, p_turn_number) >= v_session.target_turns
    AND v_avg_score >= v_min_pass
  );

  IF v_completion_eligible THEN
    v_new_status := 'passed';
  ELSIF GREATEST(v_session.turn_count, p_turn_number) >= v_session.max_turns THEN
    v_new_status := 'completed_with_remedial';
  ELSE
    v_new_status := 'in_progress';
  END IF;

  UPDATE public.learning_sessions
  SET
    turn_count = GREATEST(turn_count, p_turn_number),
    covered_objectives = v_covered,
    uncovered_objectives = v_uncovered,
    average_score = v_avg_score,
    completion_eligibility = v_completion_eligible,
    completion_status = v_new_status,
    completed_at = CASE WHEN v_new_status IN ('passed', 'completed_with_remedial') THEN now() ELSE completed_at END
  WHERE id = p_session_id;

  RETURN QUERY
  SELECT
    v_completion_eligible,
    v_new_status,
    v_avg_score,
    v_covered;
END;
$$;

NOTIFY pgrst, 'reload schema';
