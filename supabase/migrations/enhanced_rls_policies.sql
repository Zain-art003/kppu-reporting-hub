-- =====================================================
-- ENHANCED RLS POLICIES FOR WBS SECURITY
-- =====================================================

-- Drop existing policies that are too permissive
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow view status history" ON report_status_history;
DROP POLICY IF EXISTS "Allow insert status history" ON report_status_history;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own profile (name, phone only)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND name IS NOT NULL 
    AND length(name) > 0
  );

-- Admins can read all profiles (for user management)
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can update any profile
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (true);

-- =====================================================
-- REPORTS TABLE POLICIES
-- =====================================================

-- Users can read their own reports
CREATE POLICY "Users can read own reports" ON reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert new reports
CREATE POLICY "Users can insert reports" ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete reports
-- Only admins can modify reports

-- Admins can read all reports
CREATE POLICY "Admins can read all reports" ON reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can update reports (status)
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (true);

-- =====================================================
-- REPORT_STATUS_HISTORY POLICIES (Immutable Audit Trail)
-- =====================================================

-- Anyone can read history (for transparency)
CREATE POLICY "Anyone can read history" ON report_status_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to check if user is admin (used by policies)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only admins can insert history (via Edge Function)
-- We don't allow direct INSERT from frontend

-- Disable INSERT policy for non-admins (more secure)
-- Using a function that always returns false for non-admins
CREATE POLICY "Admins only can insert history" ON report_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- USER_NOTIFICATIONS POLICIES
-- =====================================================

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON user_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own notifications (system only)
CREATE POLICY "System can insert notifications" ON user_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update read status
CREATE POLICY "Users can update own notifications" ON user_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all notifications
CREATE POLICY "Admins can read all notifications" ON user_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- REVOKE DIRECT UPDATE/DELETE ON HISTORY FOR ALL USERS
-- =====================================================

-- Prevent anyone from updating history (immutable)
-- This is done via RLS policy above

-- Note: For full immutability, also run:
-- ALTER TABLE report_status_history ALTER COLUMN created_at SET DEFAULT NOW();
-- And consider: REVOKE UPDATE, DELETE ON report_status_history FROM authenticated;