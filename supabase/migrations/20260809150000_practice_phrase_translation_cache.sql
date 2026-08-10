-- Cache natural Indonesian translations for practice response-support phrases.

CREATE TABLE IF NOT EXISTS public.practice_phrase_translations (
  id bigserial PRIMARY KEY,
  source_text text NOT NULL,
  source_text_normalized text NOT NULL,
  meaning_id text NOT NULL,
  provider text NOT NULL DEFAULT 'local',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT practice_phrase_translations_source_normalized_key UNIQUE (source_text_normalized)
);

CREATE INDEX IF NOT EXISTS practice_phrase_translations_normalized_idx
  ON public.practice_phrase_translations (source_text_normalized);

ALTER TABLE public.practice_phrase_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS practice_phrase_translations_read_authenticated ON public.practice_phrase_translations;
CREATE POLICY practice_phrase_translations_read_authenticated
ON public.practice_phrase_translations FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS practice_phrase_translations_write_authenticated ON public.practice_phrase_translations;
CREATE POLICY practice_phrase_translations_write_authenticated
ON public.practice_phrase_translations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
