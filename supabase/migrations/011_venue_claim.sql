-- Migration 011: Venue claim — dono pode reivindicar o local
-- Permite que o dono de um estabelecimento reivindique a propriedade.

ALTER TABLE venues
ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_venues_claimed_by ON venues (claimed_by);

-- RLS: dono e quem reivindicou podem editar
DROP POLICY IF EXISTS "Claimed venues can be updated by owner or claimer" ON venues;
CREATE POLICY "Claimed venues can be updated by owner or claimer" ON venues
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    claimed_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    created_by = auth.uid() OR
    claimed_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
