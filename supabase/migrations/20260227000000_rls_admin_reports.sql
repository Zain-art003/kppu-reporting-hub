-- Enable Row Level Security on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows only admins to update reports
-- This policy checks if the user making the request has admin role in user_roles table
CREATE POLICY "Allow admin to update reports" ON reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Also allow admins to insert (if needed for creating test reports)
CREATE POLICY "Allow admin to insert reports" ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow admins to delete reports
CREATE POLICY "Allow admin to delete reports" ON reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Enable RLS on report_timeline table
ALTER TABLE report_timeline ENABLE ROW LEVEL SECURITY;

-- Allow admins to insert timeline entries
CREATE POLICY "Allow admin to insert timeline" ON report_timeline
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow authenticated users to view their own reports and admins to view all
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));