-- Políticas RLS para o PetLink
-- Execute este script no SQL Editor do Supabase

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- pets
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pets_select_all" ON pets;
CREATE POLICY "pets_select_all" ON pets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "pets_insert_own" ON pets;
CREATE POLICY "pets_insert_own" ON pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pets_update_own" ON pets;
CREATE POLICY "pets_update_own" ON pets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pets_delete_own" ON pets;
CREATE POLICY "pets_delete_own" ON pets
  FOR DELETE USING (auth.uid() = user_id);

-- health
ALTER TABLE health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "health_select_own_pets" ON health;
CREATE POLICY "health_select_own_pets" ON health
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = health.pet_id AND pets.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "health_insert_own_pets" ON health;
CREATE POLICY "health_insert_own_pets" ON health
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = health.pet_id AND pets.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "health_update_own_pets" ON health;
CREATE POLICY "health_update_own_pets" ON health
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = health.pet_id AND pets.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "health_delete_own_pets" ON health;
CREATE POLICY "health_delete_own_pets" ON health
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = health.pet_id AND pets.user_id = auth.uid())
  );

-- reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reminders_select_own_pets" ON reminders;
CREATE POLICY "reminders_select_own_pets" ON reminders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = reminders.pet_id AND pets.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reminders_insert_own_pets" ON reminders;
CREATE POLICY "reminders_insert_own_pets" ON reminders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = reminders.pet_id AND pets.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reminders_update_own_pets" ON reminders;
CREATE POLICY "reminders_update_own_pets" ON reminders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = reminders.pet_id AND pets.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reminders_delete_own_pets" ON reminders;
CREATE POLICY "reminders_delete_own_pets" ON reminders
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = reminders.pet_id AND pets.user_id = auth.uid())
  );

-- groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups_select_active" ON groups;
CREATE POLICY "groups_select_active" ON groups
  FOR SELECT USING (is_active = true OR auth.uid() = admin_id);

DROP POLICY IF EXISTS "groups_insert_own" ON groups;
CREATE POLICY "groups_insert_own" ON groups
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "groups_update_admin" ON groups;
CREATE POLICY "groups_update_admin" ON groups
  FOR UPDATE USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "groups_delete_admin" ON groups;
CREATE POLICY "groups_delete_admin" ON groups
  FOR DELETE USING (auth.uid() = admin_id);

-- group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_members_select" ON group_members;
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM groups WHERE groups.id = group_members.group_id AND groups.is_active = true)
  );

DROP POLICY IF EXISTS "group_members_insert_admin" ON group_members;
CREATE POLICY "group_members_insert_admin" ON group_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM groups WHERE groups.id = group_members.group_id AND groups.admin_id = auth.uid())
  );

DROP POLICY IF EXISTS "group_members_delete_admin" ON group_members;
CREATE POLICY "group_members_delete_admin" ON group_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM groups WHERE groups.id = group_members.group_id AND groups.admin_id = auth.uid())
  );

-- lost_pets
ALTER TABLE lost_pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lost_pets_select" ON lost_pets;
CREATE POLICY "lost_pets_select" ON lost_pets
  FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "lost_pets_insert_own" ON lost_pets;
CREATE POLICY "lost_pets_insert_own" ON lost_pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lost_pets_update_own" ON lost_pets;
CREATE POLICY "lost_pets_update_own" ON lost_pets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lost_pets_delete_own" ON lost_pets;
CREATE POLICY "lost_pets_delete_own" ON lost_pets
  FOR DELETE USING (auth.uid() = user_id);

-- password_resets
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

SELECT 'Políticas RLS do PetLink aplicadas com sucesso!' AS message;
