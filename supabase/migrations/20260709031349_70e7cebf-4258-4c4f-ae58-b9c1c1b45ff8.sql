
UPDATE public.blog_posts SET cover_image='/__l5e/assets-v1/516cd49c-d687-4332-9c24-406f3334aba5/blog-atelier-ring.jpg' WHERE slug='inside-the-atelier';
UPDATE public.blog_posts SET cover_image='/__l5e/assets-v1/9ec336b9-311a-45a2-8ef4-ae70709d1cc6/blog-diamond-set.jpg' WHERE slug='caring-for-fine-jewelry';
UPDATE public.blog_posts SET cover_image='/__l5e/assets-v1/b6fef264-abd4-433c-83e0-7809edeea2d7/blog-bridal-earrings.jpg' WHERE slug='bridal-collection-2026';
UPDATE public.blog_posts SET cover_image='/__l5e/assets-v1/6bc71a45-b747-421f-a1b0-7aa3ab6dbc8d/blog-emerald-pendant.webp' WHERE slug='the-language-of-gemstones';

INSERT INTO public.blog_posts (slug, title, excerpt, cover_image, body, author, published_at) VALUES
('the-modern-gold-edit', 'The Modern Gold Edit', 'Sculptural silhouettes and warm gold tones — the pieces defining the season.',
 '/__l5e/assets-v1/6db3b0d8-c689-4a8f-8b94-6db21313d2f5/blog-gold-portrait.webp',
 'A closer look at our latest gold edit — bold hoops, signet rings and layered chains crafted for everyday wear with an editorial edge.',
 'Priya Rasoda', now()),
('the-art-of-stacking', 'The Art of Stacking', 'Delicate rings, layered chains — a guide to building a signature stack that lasts.',
 '/__l5e/assets-v1/cfc89b36-4163-46b0-8165-696042474926/blog-delicate-stack.webp',
 'Stacking is personal. We share our atelier’s rules for mixing metals, proportions and meaning into a jewelry story that is uniquely yours.',
 'Rosado Atelier', now());
