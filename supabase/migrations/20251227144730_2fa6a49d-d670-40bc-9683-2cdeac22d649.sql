-- Create helper function to get admin count (max 10 limit check)
CREATE OR REPLACE FUNCTION public.get_admin_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER 
  FROM public.user_roles 
  WHERE role IN ('super_admin', 'admin', 'officer', 'moderator')
$$;

-- Create function to check if user has any admin-level access
CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('super_admin', 'admin', 'officer', 'moderator')
  )
$$;

-- Create function to get user's admin role
CREATE OR REPLACE FUNCTION public.get_user_admin_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT
  FROM public.user_roles
  WHERE user_id = _user_id
  AND role IN ('super_admin', 'admin', 'officer', 'moderator')
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'moderator' THEN 3
      WHEN 'officer' THEN 4
      ELSE 5
    END
  LIMIT 1
$$;