-- Add missing 'company' column to profiles to match UI
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company text;

-- Ensure RLS remains as-is; no change needed.

-- Optional index for frequent filtering by user id already exists via PK.

-- No further changes.