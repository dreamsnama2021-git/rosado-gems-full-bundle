
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS default_country text NOT NULL DEFAULT 'IN',
  ADD COLUMN IF NOT EXISTS default_currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS currency_symbol text NOT NULL DEFAULT '₹',
  ADD COLUMN IF NOT EXISTS tax_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_label text NOT NULL DEFAULT 'GST',
  ADD COLUMN IF NOT EXISTS tax_rate numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_inclusive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_templates jsonb NOT NULL DEFAULT '{
    "order_confirmation": {"subject":"Your Rosado Gems order #{{order_id}}","body":"Hi {{name}},\n\nThank you for your order! We''ve received order #{{order_id}} totaling {{currency}}{{total}}.\n\nWe''ll email you again when it ships.\n\n— Rosado Gems"},
    "shipping_notice":    {"subject":"Your order #{{order_id}} has shipped","body":"Hi {{name}},\n\nGood news — your order #{{order_id}} is on its way. Tracking: {{tracking}}\n\n— Rosado Gems"},
    "welcome":            {"subject":"Welcome to Rosado Gems","body":"Hi {{name}},\n\nWelcome to Rosado Gems. Explore our latest collections and enjoy your journey with us.\n\n— Rosado Gems"},
    "password_reset":     {"subject":"Reset your Rosado Gems password","body":"Hi {{name}},\n\nUse the link below to reset your password:\n{{reset_link}}\n\nIf you didn''t request this, you can ignore this email.\n\n— Rosado Gems"},
    "contact_reply":      {"subject":"We received your message","body":"Hi {{name}},\n\nThanks for reaching out to Rosado Gems. Our team will get back to you shortly.\n\n— Rosado Gems"}
  }'::jsonb;
