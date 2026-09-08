UPDATE public.site_settings
SET homepage = jsonb_set(
  homepage,
  '{sections}',
  (
    SELECT jsonb_agg(
      CASE WHEN s->>'type' = 'lookbook'
        THEN jsonb_set(s, '{props,handle}', '"rosado_gemsofficial"'::jsonb, true)
        ELSE s END
      ORDER BY ord
    )
    FROM jsonb_array_elements(homepage->'sections') WITH ORDINALITY AS t(s, ord)
  )
)
WHERE homepage ? 'sections';