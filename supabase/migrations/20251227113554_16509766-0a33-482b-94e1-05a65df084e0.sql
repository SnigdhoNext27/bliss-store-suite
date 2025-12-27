-- Drop the existing UPDATE policy that lacks WITH CHECK
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create stronger UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);