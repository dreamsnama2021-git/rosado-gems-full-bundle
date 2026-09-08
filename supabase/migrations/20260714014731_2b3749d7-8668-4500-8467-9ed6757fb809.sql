
DROP POLICY IF EXISTS "Anyone can submit a comment" ON public.blog_comments;

CREATE POLICY "Anyone can submit a comment"
  ON public.blog_comments FOR INSERT
  WITH CHECK (
    approved = false
    AND (auth.uid() IS NULL OR auth.uid() = user_id)
  );
