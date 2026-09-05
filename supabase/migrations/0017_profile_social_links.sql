-- 0017_profile_social_links.sql
-- Add website and social media profile handles to profiles table.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS twitter text,
ADD COLUMN IF NOT EXISTS youtube text,
ADD COLUMN IF NOT EXISTS linkedin text;
