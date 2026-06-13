-- ================================================================
-- PRODE DIGITAL TECNOPROP 2026
-- Schema completo — ejecutar en Supabase SQL Editor
-- ================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- TIPOS ENUM
-- ================================================================

CREATE TYPE user_status AS ENUM ('pending_verification', 'active', 'suspended');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished', 'cancelled');
CREATE TYPE match_phase AS ENUM ('group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final');
CREATE TYPE point_reason AS ENUM (
  'exact_result',
  'correct_winner',
  'correct_draw',
  'champion_bonus',
  'runner_up_bonus',
  'top_scorer_bonus',
  'final_exact_bonus',
  'referral_bonus'
);

-- ================================================================
-- TABLA: users (perfil público, referencia a auth.users)
-- ================================================================

CREATE TABLE public.users (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Datos personales
  nombre                TEXT NOT NULL,
  apellido              TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  whatsapp              TEXT,
  instagram_handle      TEXT NOT NULL UNIQUE,
  instagram_confirmed   BOOLEAN NOT NULL DEFAULT FALSE,
  ciudad                TEXT,

  -- Estado y rol
  status                user_status NOT NULL DEFAULT 'pending_verification',
  role                  user_role NOT NULL DEFAULT 'user',
  email_verified_at     TIMESTAMPTZ,

  -- Sistema de puntos (desnormalizado para performance en ranking)
  total_points          INTEGER NOT NULL DEFAULT 0,

  -- Referidos
  referral_code         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  referred_by           UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Índices para ranking y búsquedas frecuentes
CREATE INDEX idx_users_total_points ON public.users(total_points DESC);
CREATE INDEX idx_users_status       ON public.users(status);
CREATE INDEX idx_users_ciudad       ON public.users(ciudad);
CREATE INDEX idx_users_referral     ON public.users(referral_code);

-- ================================================================
-- TABLA: matches (fixture del Mundial 2026)
-- ================================================================

CREATE TABLE public.matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identificación
  match_number    INTEGER,
  phase           match_phase NOT NULL DEFAULT 'group',
  group_name      TEXT,                        -- "Grupo A", null si es fase eliminatoria

  -- Equipos
  team_home       TEXT NOT NULL,
  team_away       TEXT NOT NULL,
  flag_home       TEXT,                        -- emoji o URL de Cloudinary
  flag_away       TEXT,
  country_code_home TEXT,                      -- ISO 3166-1 alpha-2 para APIs
  country_code_away TEXT,

  -- Sede
  stadium         TEXT,
  city_venue      TEXT,
  country_venue   TEXT,

  -- Fecha y estado
  match_date      TIMESTAMPTZ NOT NULL,
  status          match_status NOT NULL DEFAULT 'scheduled',
  is_locked       BOOLEAN NOT NULL DEFAULT FALSE,  -- se activa al inicio del partido

  -- Resultado oficial
  score_home      INTEGER,
  score_away      INTEGER,

  -- Sincronización con API-Football
  api_match_id    TEXT UNIQUE
);

CREATE INDEX idx_matches_date   ON public.matches(match_date);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_phase  ON public.matches(phase);

-- ================================================================
-- TABLA: predictions (pronósticos de usuarios)
-- ================================================================

CREATE TABLE public.predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id        UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,

  pred_home       INTEGER NOT NULL CHECK (pred_home >= 0 AND pred_home <= 30),
  pred_away       INTEGER NOT NULL CHECK (pred_away >= 0 AND pred_away <= 30),

  -- null hasta que termine el partido, luego 0, 1 o 3
  points_earned   INTEGER,

  UNIQUE(user_id, match_id)
);

CREATE INDEX idx_predictions_user  ON public.predictions(user_id);
CREATE INDEX idx_predictions_match ON public.predictions(match_id);

-- ================================================================
-- TABLA: special_predictions (bonuses: campeón, goleador, etc.)
-- ================================================================

CREATE TABLE public.special_predictions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  user_id             UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

  champion_team       TEXT,     -- +10 pts
  runner_up_team      TEXT,     -- +5 pts
  top_scorer          TEXT,     -- +5 pts (nombre del jugador)
  final_score_home    INTEGER,  -- +5 pts si acierta el marcador exacto de la final
  final_score_away    INTEGER,

  points_earned       INTEGER NOT NULL DEFAULT 0
);

-- ================================================================
-- TABLA: leagues (mini ligas privadas)
-- ================================================================

CREATE TABLE public.leagues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  name            TEXT NOT NULL,
  description     TEXT,
  owner_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invite_code     TEXT NOT NULL UNIQUE DEFAULT upper(encode(gen_random_bytes(3), 'hex')),
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  max_members     INTEGER NOT NULL DEFAULT 50
);

CREATE INDEX idx_leagues_owner  ON public.leagues(owner_id);
CREATE INDEX idx_leagues_invite ON public.leagues(invite_code);

-- ================================================================
-- TABLA: league_members
-- ================================================================

CREATE TABLE public.league_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  league_id       UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  UNIQUE(league_id, user_id)
);

CREATE INDEX idx_league_members_league ON public.league_members(league_id);
CREATE INDEX idx_league_members_user   ON public.league_members(user_id);

-- ================================================================
-- TABLA: points_log (historial inmutable de puntos)
-- ================================================================

CREATE TABLE public.points_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id        UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  prediction_id   UUID REFERENCES public.predictions(id) ON DELETE SET NULL,

  reason          point_reason NOT NULL,
  points          INTEGER NOT NULL,
  description     TEXT
);

CREATE INDEX idx_points_log_user  ON public.points_log(user_id);
CREATE INDEX idx_points_log_match ON public.points_log(match_id);

-- ================================================================
-- TABLA: referrals
-- ================================================================

CREATE TABLE public.referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  referrer_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id     UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  points_awarded  BOOLEAN NOT NULL DEFAULT FALSE
);

-- ================================================================
-- FUNCIÓN: crear perfil automáticamente al confirmar email
-- Se ejecuta como trigger cuando Supabase confirma el email
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Solo crear perfil si el email fue confirmado
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users
    SET
      status = 'active',
      email_verified_at = NEW.email_confirmed_at,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================================
-- FUNCIÓN: calcular y asignar puntos cuando se carga un resultado
-- Llamada desde Edge Function o desde el admin panel
-- ================================================================

CREATE OR REPLACE FUNCTION public.score_match(p_match_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match       RECORD;
  v_pred        RECORD;
  v_pts         INTEGER;
  v_total_scored INTEGER := 0;
  v_winner_home INTEGER;
  v_winner_away INTEGER;
  v_winner_pred INTEGER;
BEGIN
  -- Obtener el partido
  SELECT * INTO v_match FROM public.matches
  WHERE id = p_match_id AND status = 'finished' AND score_home IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partido no encontrado o sin resultado';
  END IF;

  -- Calcular signo del ganador oficial
  v_winner_home := SIGN(v_match.score_home - v_match.score_away);

  -- Iterar sobre todos los pronósticos de este partido
  FOR v_pred IN
    SELECT * FROM public.predictions
    WHERE match_id = p_match_id AND points_earned IS NULL
  LOOP
    v_pts := 0;
    v_winner_pred := SIGN(v_pred.pred_home - v_pred.pred_away);

    -- Resultado exacto → 3 puntos
    IF v_pred.pred_home = v_match.score_home AND v_pred.pred_away = v_match.score_away THEN
      v_pts := 3;
      INSERT INTO public.points_log(user_id, match_id, prediction_id, reason, points, description)
      VALUES (v_pred.user_id, p_match_id, v_pred.id, 'exact_result', 3,
              v_match.team_home || ' ' || v_match.score_home || '-' || v_match.score_away || ' ' || v_match.team_away);

    -- Ganador correcto (no exacto) → 1 punto
    ELSIF v_winner_pred = v_winner_home AND v_winner_home <> 0 THEN
      v_pts := 1;
      INSERT INTO public.points_log(user_id, match_id, prediction_id, reason, points, description)
      VALUES (v_pred.user_id, p_match_id, v_pred.id, 'correct_winner', 1,
              'Ganador correcto: ' || CASE WHEN v_winner_home > 0 THEN v_match.team_home ELSE v_match.team_away END);

    -- Empate correcto (no exacto) → 1 punto
    ELSIF v_winner_pred = 0 AND v_winner_home = 0 THEN
      v_pts := 1;
      INSERT INTO public.points_log(user_id, match_id, prediction_id, reason, points, description)
      VALUES (v_pred.user_id, p_match_id, v_pred.id, 'correct_draw', 1, 'Empate correcto');
    END IF;

    -- Actualizar puntos en la predicción
    UPDATE public.predictions SET points_earned = v_pts WHERE id = v_pred.id;

    -- Sumar al total del usuario
    IF v_pts > 0 THEN
      UPDATE public.users SET total_points = total_points + v_pts WHERE id = v_pred.user_id;
      v_total_scored := v_total_scored + 1;
    END IF;
  END LOOP;

  RETURN v_total_scored;
END;
$$;

-- ================================================================
-- FUNCIÓN: bloquear partido (llamada por cron job)
-- ================================================================

CREATE OR REPLACE FUNCTION public.lock_started_matches()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.matches
  SET is_locked = TRUE, status = 'live'
  WHERE match_date <= NOW()
    AND status = 'scheduled'
    AND is_locked = FALSE;
END;
$$;

-- ================================================================
-- FUNCIÓN: ranking en vista (para queries rápidas)
-- ================================================================

CREATE OR REPLACE VIEW public.ranking_general AS
SELECT
  u.id,
  u.nombre,
  u.apellido,
  u.ciudad,
  u.instagram_handle,
  u.total_points,
  ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.created_at ASC) AS position,
  COUNT(p.id) FILTER (WHERE p.points_earned = 3) AS exact_results,
  COUNT(p.id) FILTER (WHERE p.points_earned > 0) AS correct_results,
  COUNT(p.id) FILTER (WHERE p.points_earned IS NOT NULL) AS total_predicted
FROM public.users u
LEFT JOIN public.predictions p ON p.user_id = u.id
WHERE u.status = 'active'
GROUP BY u.id;

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals         ENABLE ROW LEVEL SECURITY;

-- Helper: ¿el usuario actual es admin? (SECURITY DEFINER evita recursión RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- USERS: solo podés leer tu propia fila (+ admins). Los datos públicos
-- (ranking, landing) salen de la vista ranking_general, que no expone
-- email/whatsapp/referral_code. Ver security-fix-pii.sql para detalles.
CREATE POLICY "leer_perfil_propio" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

CREATE POLICY "editar_propio_perfil" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "insert_propio_perfil" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- MATCHES: lectura pública, solo admin puede modificar
CREATE POLICY "partidos_publicos" ON public.matches
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_modifica_partidos" ON public.matches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- PREDICTIONS: ver las tuyas y las de otros usuarios activos
CREATE POLICY "ver_predicciones_propias" ON public.predictions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insertar_prediccion" ON public.predictions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'active')
    AND NOT EXISTS (SELECT 1 FROM public.matches WHERE id = match_id AND is_locked = TRUE)
  );

CREATE POLICY "actualizar_prediccion" ON public.predictions
  FOR UPDATE USING (
    user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.matches WHERE id = match_id AND is_locked = TRUE)
  );

-- SPECIAL PREDICTIONS: solo las tuyas
CREATE POLICY "special_pred_propias" ON public.special_predictions
  FOR ALL USING (user_id = auth.uid());

-- ================================================================
-- FUNCIÓN: comprobar si un usuario es miembro de una liga
-- ================================================================

CREATE OR REPLACE FUNCTION public.is_league_member(p_league_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.league_members
    WHERE league_id = p_league_id AND user_id = auth.uid()
  );
$$;

-- LEAGUES: lectura según visibilidad, creación solo usuarios activos
CREATE POLICY "ver_ligas_publicas" ON public.leagues
  FOR SELECT USING (is_public = TRUE OR owner_id = auth.uid() OR
    public.is_league_member(id)
  );

CREATE POLICY "crear_liga" ON public.leagues
  FOR INSERT WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'active')
  );

CREATE POLICY "editar_propia_liga" ON public.leagues
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "borrar_propia_liga" ON public.leagues
  FOR DELETE USING (owner_id = auth.uid());

-- LEAGUE_MEMBERS: ver miembros de ligas donde participás
CREATE POLICY "ver_miembros" ON public.league_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    public.is_league_member(league_id)
  );

CREATE POLICY "unirse_liga" ON public.league_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'active')
  );

CREATE POLICY "salir_liga" ON public.league_members
  FOR DELETE USING (user_id = auth.uid());

-- POINTS_LOG: solo podés ver los tuyos
CREATE POLICY "ver_propios_puntos" ON public.points_log
  FOR SELECT USING (user_id = auth.uid());

-- REFERRALS: ver los tuyos
CREATE POLICY "ver_referidos" ON public.referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- ================================================================
-- DATOS INICIALES: primeros partidos del Mundial 2026
-- (Completar fixture completo vía API-Football en producción)
-- ================================================================

INSERT INTO public.matches (match_number, phase, group_name, team_home, team_away, flag_home, flag_away, stadium, city_venue, country_venue, match_date) VALUES
(1,  'group', 'Grupo A', 'México',      'Honduras',  '🇲🇽', '🇭🇳', 'Estadio Azteca',       'Ciudad de México', 'México',    '2026-06-11 19:00:00-05:00'),
(2,  'group', 'Grupo A', 'Estados Unidos','Honduras', '🇺🇸', '🇭🇳', 'MetLife Stadium',       'East Rutherford',  'USA',       '2026-06-14 16:00:00-05:00'),
(3,  'group', 'Grupo A', 'México',      'Estados Unidos','🇲🇽','🇺🇸','AT&T Stadium',         'Dallas',           'USA',       '2026-06-18 16:00:00-05:00'),
(4,  'group', 'Grupo B', 'Argentina',   'España',    '🇦🇷', '🇪🇸', 'MetLife Stadium',       'East Rutherford',  'USA',       '2026-06-12 19:00:00-05:00'),
(5,  'group', 'Grupo B', 'Marruecos',   'Portugal',  '🇲🇦', '🇵🇹', 'SoFi Stadium',          'Los Ángeles',      'USA',       '2026-06-12 16:00:00-05:00'),
(6,  'group', 'Grupo C', 'Brasil',      'Alemania',  '🇧🇷', '🇩🇪', 'SoFi Stadium',          'Los Ángeles',      'USA',       '2026-06-13 19:00:00-05:00'),
(7,  'group', 'Grupo C', 'Francia',     'Uruguay',   '🇫🇷', '🇺🇾', 'Cowboys Stadium',       'Dallas',           'USA',       '2026-06-14 19:00:00-05:00'),
(8,  'group', 'Grupo D', 'Inglaterra',  'Nigeria',   '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇳🇬', 'Levi Stadium',         'San Francisco',    'USA',       '2026-06-15 16:00:00-05:00'),
(9,  'group', 'Grupo D', 'Países Bajos','Egipto',    '🇳🇱', '🇪🇬', 'Rose Bowl',             'Los Ángeles',      'USA',       '2026-06-15 19:00:00-05:00'),
(10, 'group', 'Grupo E', 'Italia',      'Colombia',  '🇮🇹', '🇨🇴', 'Gillette Stadium',      'Boston',           'USA',       '2026-06-16 16:00:00-05:00');

-- ================================================================
-- FIN DEL SCHEMA
-- ================================================================
