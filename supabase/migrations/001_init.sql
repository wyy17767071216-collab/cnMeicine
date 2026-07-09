-- UUID extension (kept for compatibility; gen_random_uuid() used instead)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ────────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  role         VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'viewer')),
  display_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_record" ON public.users
  FOR ALL USING (auth.uid() = id);

-- ─── AUTO-SYNC TRIGGER ────────────────────────────────────────────────────
-- Automatically create a public.users row when a new auth user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, role, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    'viewer',
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── MEDICATIONS ──────────────────────────────────────────────────────────
CREATE TABLE public.medications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  dosage           NUMERIC(10,2) NOT NULL,
  unit             VARCHAR(20) NOT NULL DEFAULT 'mg',
  stock            INTEGER NOT NULL DEFAULT 0,
  image_url        TEXT,
  usage_suggestion TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "viewer_select" ON public.medications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "admin_all" ON public.medications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ─── SCHEDULES ────────────────────────────────────────────────────────────
CREATE TABLE public.schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  time          VARCHAR(5) NOT NULL,   -- HH:MM
  days_of_week  INTEGER[] NOT NULL,    -- 0..6
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "viewer_select" ON public.schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "admin_all" ON public.schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ─── MEDICATION LOGS ──────────────────────────────────────────────────────
CREATE TABLE public.medication_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id   UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  taken_at      TIMESTAMPTZ,
  status        VARCHAR(10) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'taken', 'missed', 'future')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- Both roles can read logs; viewer can update (mark taken); admin has full access
CREATE POLICY "viewer_select" ON public.medication_logs
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid())
  );

CREATE POLICY "viewer_update" ON public.medication_logs
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid())
  )
  WITH CHECK (status = 'taken');

CREATE POLICY "admin_all" ON public.medication_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ─── PUSH SUBSCRIPTIONS ───────────────────────────────────────────────────
CREATE TABLE public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ─── INDEXES ──────────────────────────────────────────────────────────────
CREATE INDEX idx_medications_user_id   ON public.medications(user_id);
CREATE INDEX idx_schedules_med_id      ON public.schedules(medication_id);
CREATE INDEX idx_logs_scheduled_at     ON public.medication_logs(scheduled_at);
CREATE INDEX idx_logs_status           ON public.medication_logs(status);
CREATE INDEX idx_push_subs_user_id     ON public.push_subscriptions(user_id);
