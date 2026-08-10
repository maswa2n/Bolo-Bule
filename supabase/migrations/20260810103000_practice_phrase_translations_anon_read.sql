-- Allow anonymous read of cached practice phrase translations (public learning content).

DROP POLICY IF EXISTS practice_phrase_translations_read_anon ON public.practice_phrase_translations;
CREATE POLICY practice_phrase_translations_read_anon
ON public.practice_phrase_translations FOR SELECT
TO anon
USING (true);

NOTIFY pgrst, 'reload schema';
