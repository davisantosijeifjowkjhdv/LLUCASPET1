-- Supabase PostgreSQL Schema for PetLink
-- Execute este script no SQL Editor do Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela: users (sync with auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: pets
CREATE TABLE IF NOT EXISTS pets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('dog', 'cat', 'bird', 'other')),
  breed VARCHAR(100),
  age INTEGER,
  weight NUMERIC(5, 2),
  color VARCHAR(50),
  gender VARCHAR(20) CHECK (gender IN ('male', 'female')),
  size VARCHAR(20) CHECK (size IN ('small', 'medium', 'large', 'extra-large')),
  description TEXT,
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'lost', 'found', 'adopted')),
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de pets
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_status ON pets(status);

-- Tabela: health
CREATE TABLE IF NOT EXISTS health (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  weight NUMERIC(5, 2),
  temperature NUMERIC(4, 1),
  appetite VARCHAR(20) CHECK (appetite IN ('good', 'reduced', 'poor', 'none')),
  energy_level VARCHAR(20) CHECK (energy_level IN ('very-high', 'high', 'normal', 'low', 'very-low')),
  bowel_movements VARCHAR(20) CHECK (bowel_movements IN ('normal', 'soft', 'hard', 'diarrhea', 'constipation')),
  vomiting BOOLEAN DEFAULT FALSE,
  symptoms TEXT[],
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice de health por pet
CREATE INDEX IF NOT EXISTS idx_health_pet_id ON health(pet_id);

-- Tabela: reminders
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('vaccination', 'deworming', 'vet-visit', 'medication', 'feeding', 'grooming', 'other')),
  frequency VARCHAR(20) NOT NULL DEFAULT 'one-time' CHECK (frequency IN ('one-time', 'daily', 'weekly', 'monthly', 'yearly')),
  next_due TIMESTAMP WITH TIME ZONE,
  last_notified TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de reminders
CREATE INDEX IF NOT EXISTS idx_reminders_pet_id ON reminders(pet_id);
CREATE INDEX IF NOT EXISTS idx_reminders_next_due ON reminders(next_due);

-- Tabela: groups
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'public' CHECK (type IN ('public', 'private')),
  admin_id UUID REFERENCES users(id) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: group_members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Índices de group_members
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Tabela: lost_pets
CREATE TABLE IF NOT EXISTS lost_pets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  kind VARCHAR(50) NOT NULL,
  lat NUMERIC(10, 6),
  lon NUMERIC(10, 6),
  address TEXT,
  phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'found', 'resolved')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de lost_pets
CREATE INDEX IF NOT EXISTS idx_lost_pets_user_id ON lost_pets(user_id);
CREATE INDEX IF NOT EXISTS idx_lost_pets_status ON lost_pets(status);

-- Tabela: password_resets
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token UUID UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Comentário final
SELECT 'Schema do PetLink aplicado com sucesso!' AS message;