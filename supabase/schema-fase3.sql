-- ================================================================
-- FASE 3: Adiciones al schema
-- Ejecutar en Supabase SQL Editor DESPUÉS del schema principal
-- ================================================================

-- ── Función: bonus de referido (llamada desde el webhook) ────────
CREATE OR REPLACE FUNCTION public.apply_referral_bonus(p_referrer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET total_points = total_points + 1
  WHERE id = p_referrer_id AND status = 'active';
END;
$$;

-- ── Función: cálculo de puntos especiales ───────────────────────
-- Llamar manualmente desde el admin cuando termine el torneo
CREATE OR REPLACE FUNCTION public.score_special_predictions(
  p_champion TEXT,
  p_runner_up TEXT,
  p_top_scorer TEXT,
  p_final_home INTEGER,
  p_final_away INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sp   RECORD;
  v_pts  INTEGER;
  v_total INTEGER := 0;
BEGIN
  FOR v_sp IN SELECT * FROM public.special_predictions LOOP
    v_pts := 0;

    IF v_sp.champion_team ILIKE p_champion THEN
      v_pts := v_pts + 10;
      INSERT INTO public.points_log(user_id, reason, points, description)
      VALUES (v_sp.user_id, 'champion_bonus', 10, 'Campeón: ' || p_champion);
    END IF;

    IF v_sp.runner_up_team ILIKE p_runner_up THEN
      v_pts := v_pts + 5;
      INSERT INTO public.points_log(user_id, reason, points, description)
      VALUES (v_sp.user_id, 'runner_up_bonus', 5, 'Subcampeón: ' || p_runner_up);
    END IF;

    IF v_sp.top_scorer ILIKE p_top_scorer THEN
      v_pts := v_pts + 5;
      INSERT INTO public.points_log(user_id, reason, points, description)
      VALUES (v_sp.user_id, 'top_scorer_bonus', 5, 'Goleador: ' || p_top_scorer);
    END IF;

    IF v_sp.final_score_home = p_final_home AND v_sp.final_score_away = p_final_away THEN
      v_pts := v_pts + 5;
      INSERT INTO public.points_log(user_id, reason, points, description)
      VALUES (v_sp.user_id, 'final_exact_bonus', 5,
              'Final exacta: ' || p_final_home || '-' || p_final_away);
    END IF;

    IF v_pts > 0 THEN
      UPDATE public.users SET total_points = total_points + v_pts WHERE id = v_sp.user_id;
      UPDATE public.special_predictions SET points_earned = v_pts WHERE id = v_sp.id;
      v_total := v_total + 1;
    END IF;
  END LOOP;

  RETURN v_total;
END;
$$;

-- ── Vista: estadísticas del torneo ──────────────────────────────
CREATE OR REPLACE VIEW public.tournament_stats AS
SELECT
  COUNT(DISTINCT u.id)                                     AS total_active_users,
  COUNT(DISTINCT p.id)                                     AS total_predictions,
  COUNT(DISTINCT p.id) FILTER (WHERE p.points_earned = 3)  AS exact_results,
  COUNT(DISTINCT p.id) FILTER (WHERE p.points_earned = 1)  AS correct_results,
  COUNT(DISTINCT p.id) FILTER (WHERE p.points_earned = 0)  AS wrong_results,
  ROUND(
    COUNT(DISTINCT p.id) FILTER (WHERE p.points_earned > 0)::NUMERIC /
    NULLIF(COUNT(DISTINCT p.id) FILTER (WHERE p.points_earned IS NOT NULL), 0) * 100, 1
  )                                                         AS accuracy_pct,
  SUM(u.total_points)                                       AS total_points_awarded,
  COUNT(DISTINCT lm.league_id)                             AS total_leagues,
  COUNT(DISTINCT r.id)                                     AS total_referrals
FROM public.users u
LEFT JOIN public.predictions p ON p.user_id = u.id
LEFT JOIN public.league_members lm ON lm.user_id = u.id
LEFT JOIN public.referrals r ON r.referrer_id = u.id
WHERE u.status = 'active';

-- ── Política: admin puede ver stats completas ───────────────────
CREATE POLICY "admin_lee_todo" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
