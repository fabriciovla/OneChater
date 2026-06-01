-- ============================================================
--  OneChater — PostgreSQL schema for Neon
--  Run this in the Neon SQL editor to bootstrap the DB
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Updated-at trigger helper ───────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  USERS  (optional auth — nullable for anonymous mode)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT        UNIQUE,
  name         TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
--  CHAT SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
  -- fingerprint for anonymous / localStorage-migrated sessions
  anon_key     TEXT,
  title        TEXT        NOT NULL DEFAULT 'Nueva conversación',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_anon_key   ON chat_sessions(anon_key);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON chat_sessions(updated_at DESC);

-- ============================================================
--  CONVERSATION TURNS  (one row per user message)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_turns (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_message TEXT        NOT NULL,
  is_fusion    BOOLEAN     NOT NULL DEFAULT FALSE,
  -- preserves insertion order within a session
  position     INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turns_session_id ON conversation_turns(session_id);
CREATE INDEX IF NOT EXISTS idx_turns_position   ON conversation_turns(session_id, position);

-- ============================================================
--  TURN RESPONSES  (one row per provider per turn)
-- ============================================================
-- provider values: openai | anthropic | google | groq |
--                  openrouter | xai | mistral | deepseek
CREATE TABLE IF NOT EXISTS turn_responses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id      UUID        NOT NULL REFERENCES conversation_turns(id) ON DELETE CASCADE,
  provider     TEXT        NOT NULL,
  model        TEXT        NOT NULL,
  content      TEXT        NOT NULL DEFAULT '',
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (turn_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_responses_turn_id ON turn_responses(turn_id);

-- ============================================================
--  FUSED RESPONSES  (one row per fusion turn)
-- ============================================================
CREATE TABLE IF NOT EXISTS fused_responses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id      UUID        NOT NULL REFERENCES conversation_turns(id) ON DELETE CASCADE,
  -- array of providers that were synthesized
  providers    TEXT[]      NOT NULL DEFAULT '{}',
  content      TEXT        NOT NULL DEFAULT '',
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (turn_id)
);

CREATE INDEX IF NOT EXISTS idx_fused_turn_id ON fused_responses(turn_id);

-- ============================================================
--  USER PROVIDER SETTINGS  (api keys, selected models, toggles)
-- ============================================================
-- IMPORTANT: never store raw API keys in production.
-- Encrypt before insert (e.g., pgp_sym_encrypt with app secret,
-- or use Neon Vault / Doppler / env-var proxy).
CREATE TABLE IF NOT EXISTS user_provider_settings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        REFERENCES users(id) ON DELETE CASCADE,
  -- anon_key mirrors chat_sessions.anon_key for localStorage users
  anon_key         TEXT,
  provider         TEXT        NOT NULL,
  -- store pgp_sym_encrypt(api_key, $APP_SECRET) here
  api_key_enc      TEXT,
  is_enabled       BOOLEAN     NOT NULL DEFAULT TRUE,
  selected_model   TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- a user OR an anon session owns the row, never both
  CONSTRAINT chk_owner CHECK (
    (user_id IS NOT NULL AND anon_key IS NULL) OR
    (user_id IS NULL AND anon_key IS NOT NULL)
  ),
  UNIQUE (user_id,  provider),
  UNIQUE (anon_key, provider)
);

CREATE TRIGGER trg_provider_settings_updated_at
  BEFORE UPDATE ON user_provider_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_settings_user_id  ON user_provider_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_anon_key ON user_provider_settings(anon_key);

-- ============================================================
--  MEMORIES  (cross-conversation user memory — the core feature)
-- ============================================================
-- Durable facts about the user, shared across every session AND every
-- model. Injected into each provider's system prompt so the AIs "remember"
-- the user between conversations. id/user_id are TEXT to match the
-- Prisma-managed schema actually deployed (cuid()), not UUID.
CREATE TABLE IF NOT EXISTS memories (
  id           TEXT        PRIMARY KEY,
  user_id      TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL,
  -- stack | project | preference | decision | tone | other
  category     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_user_id      ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_created ON memories(user_id, created_at DESC);

-- ============================================================
--  VIEWS
-- ============================================================

-- Full session with turn count and last message preview
CREATE OR REPLACE VIEW v_session_summary AS
SELECT
  s.id,
  s.user_id,
  s.anon_key,
  s.title,
  s.created_at,
  s.updated_at,
  COUNT(t.id)                         AS turn_count,
  MAX(t.created_at)                   AS last_turn_at,
  (
    SELECT ct.user_message
    FROM   conversation_turns ct
    WHERE  ct.session_id = s.id
    ORDER  BY ct.position DESC
    LIMIT  1
  )                                   AS last_message
FROM  chat_sessions s
LEFT  JOIN conversation_turns t ON t.session_id = s.id
GROUP BY s.id;

-- All responses for a session (flat, ordered)
CREATE OR REPLACE VIEW v_session_messages AS
SELECT
  t.session_id,
  t.id          AS turn_id,
  t.position,
  t.user_message,
  t.is_fusion,
  t.created_at  AS turn_at,
  r.provider,
  r.model,
  r.content,
  r.error,
  NULL::text[]  AS fusion_providers,
  FALSE         AS is_fused_row
FROM  conversation_turns t
JOIN  turn_responses     r ON r.turn_id = t.id
WHERE t.is_fusion = FALSE

UNION ALL

SELECT
  t.session_id,
  t.id,
  t.position,
  t.user_message,
  t.is_fusion,
  t.created_at,
  'fusion'      AS provider,
  NULL          AS model,
  f.content,
  f.error,
  f.providers   AS fusion_providers,
  TRUE          AS is_fused_row
FROM  conversation_turns t
JOIN  fused_responses    f ON f.turn_id = t.id
WHERE t.is_fusion = TRUE

ORDER BY position, provider;

-- ============================================================
--  ROW-LEVEL SECURITY (enable once auth is wired up)
-- ============================================================
-- Uncomment after adding auth (e.g. NextAuth / Clerk):
--
-- ALTER TABLE chat_sessions           ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversation_turns      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE turn_responses          ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fused_responses         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_provider_settings  ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "own sessions" ON chat_sessions
--   USING (user_id = auth.uid());
--
-- CREATE POLICY "own turns" ON conversation_turns
--   USING (session_id IN (
--     SELECT id FROM chat_sessions WHERE user_id = auth.uid()
--   ));
-- (repeat pattern for other tables)

-- ============================================================
--  SEED — provider defaults (run once)
-- ============================================================
-- Handy reference: default model per provider
-- (not required for the app to work, just docs-as-data)
CREATE TABLE IF NOT EXISTS provider_defaults (
  provider       TEXT PRIMARY KEY,
  display_name   TEXT NOT NULL,
  default_model  TEXT NOT NULL,
  base_url       TEXT
);

INSERT INTO provider_defaults (provider, display_name, default_model, base_url) VALUES
  ('openai',     'OpenAI',     'gpt-4o',                            'https://api.openai.com/v1/chat/completions'),
  ('anthropic',  'Anthropic',  'claude-3-5-sonnet-20241022',        'https://api.anthropic.com/v1/messages'),
  ('google',     'Google',     'gemini-2.0-flash',                  'https://generativelanguage.googleapis.com/v1beta/models'),
  ('groq',       'Groq',       'llama-3.3-70b-versatile',           'https://api.groq.com/openai/v1/chat/completions'),
  ('openrouter', 'OpenRouter', 'nvidia/nemotron-3-super-120b-a12b:free', 'https://openrouter.ai/api/v1/chat/completions'),
  ('xai',        'xAI',        'grok-3',                            'https://api.x.ai/v1/chat/completions'),
  ('mistral',    'Mistral',    'mistral-large-latest',              'https://api.mistral.ai/v1/chat/completions'),
  ('deepseek',   'DeepSeek',   'deepseek-chat',                     'https://api.deepseek.com/v1/chat/completions')
ON CONFLICT (provider) DO NOTHING;
