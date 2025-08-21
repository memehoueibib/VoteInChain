/*
  # Fix session participants RLS policy

  1. Security Changes
    - Drop existing restrictive policy for INSERT on session_participants
    - Create new policy allowing session creators to add participants
    - Ensure proper authorization for adding participants to sessions

  2. Policy Details
    - Session creators can add participants to their own sessions
    - Maintains security by checking session ownership
    - Allows proper participant management functionality
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Créateurs peuvent gérer les participants de leurs sessions" ON session_participants;

-- Create separate policies for different operations
CREATE POLICY "Session creators can add participants"
  ON session_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM voting_sessions 
      WHERE created_by IN (
        SELECT id FROM profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Session creators can update participants"
  ON session_participants
  FOR UPDATE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM voting_sessions 
      WHERE created_by IN (
        SELECT id FROM profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Session creators can delete participants"
  ON session_participants
  FOR DELETE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM voting_sessions 
      WHERE created_by IN (
        SELECT id FROM profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view their own participations"
  ON session_participants
  FOR SELECT
  TO authenticated
  USING (
    participant_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid()
    )
    OR
    session_id IN (
      SELECT id FROM voting_sessions 
      WHERE created_by IN (
        SELECT id FROM profiles 
        WHERE user_id = auth.uid()
      )
    )
  );