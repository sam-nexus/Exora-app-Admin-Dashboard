-- Add JSONB device_tokens field to profiles for Firebase push registration.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS device_tokens jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_profiles_device_tokens
  ON public.profiles USING gin (device_tokens);
