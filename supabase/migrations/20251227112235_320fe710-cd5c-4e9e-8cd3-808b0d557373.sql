-- Drop the existing ALL policy that lacks WITH CHECK for inserts
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;

-- Create separate policies with proper constraints

-- Users can only INSERT addresses for themselves
CREATE POLICY "Users can insert own addresses"
ON public.addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own addresses
CREATE POLICY "Users can update own addresses"
ON public.addresses
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only DELETE their own addresses
CREATE POLICY "Users can delete own addresses"
ON public.addresses
FOR DELETE
USING (auth.uid() = user_id);