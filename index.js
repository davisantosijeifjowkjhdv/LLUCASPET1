import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { supabase } from './infra/supabase.js';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

function userClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthenticated' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Unauthenticated' });

  req.user = user;
  req.token = token;
  req.db = userClient(token);
  next();
}

// Health check route
app.get('/health', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (using Supabase Auth)
// Sign up
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data, message: 'Signup successful! Check your email.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data, message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
app.get('/auth/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// Logout
app.post('/auth/logout', async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Pets routes
app.get('/pets', async (req, res) => {
  try {
    const { data: pets, error } = await supabase
      .from('pets')
      .select('*')
      .eq('status', 'active');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ pets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/pets/:id', async (req, res) => {
  try {
    const { data: pet, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Pet not found' });
    res.json({ pet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/pets', requireAuth, async (req, res) => {
  try {
    const { name, type, breed, age, weight, color, gender, size, description } = req.body;

    const { data, error } = await req.db
      .from('pets')
      .insert({
        name,
        type,
        breed,
        age,
        weight,
        color,
        gender,
        size,
        description,
        user_id: req.user.id,
        status: 'active'
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ pet: data, message: 'Pet cadastrado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/pets/:id', requireAuth, async (req, res) => {
  try {
    const { name, type, breed, age, weight, color, gender, size, description } = req.body;

    const { data, error } = await req.db
      .from('pets')
      .update({
        name,
        type,
        breed,
        age,
        weight,
        color,
        gender,
        size,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ pet: data, message: 'Pet atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/pets/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await req.db
      .from('pets')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Pet excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health records routes
app.get('/health-records', requireAuth, async (req, res) => {
  try {
    const { petId } = req.query;

    let query = req.db.from('health').select('*');

    if (petId) {
      query = query.eq('pet_id', petId);
    } else {
      const { data: pets } = await req.db.from('pets').select('id').eq('user_id', req.user.id);
      const petIds = (pets || []).map(p => p.id);
      query = query.in('pet_id', petIds);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ health: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/health-records', requireAuth, async (req, res) => {
  try {
    const { petId, ...healthData } = req.body;

    const { data, error } = await req.db
      .from('health')
      .insert({
        pet_id: petId,
        ...healthData,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ record: data, message: 'Registro de saúde salvo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reminders routes
app.get('/reminders', requireAuth, async (req, res) => {
  try {
    const { petId } = req.query;

    let query = req.db.from('reminders').select('*').eq('is_active', true);

    if (petId) {
      query = query.eq('pet_id', petId);
    } else {
      const { data: pets } = await req.db.from('pets').select('id').eq('user_id', req.user.id);
      const petIds = (pets || []).map(p => p.id);
      query = query.in('pet_id', petIds);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ reminders: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/reminders', requireAuth, async (req, res) => {
  try {
    const { petId, title, description, type, frequency } = req.body;

    const { data, error } = await req.db
      .from('reminders')
      .insert({
        pet_id: petId,
        title,
        description,
        type,
        frequency,
        next_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ reminder: data, message: 'Lembrete criado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Groups/chats routes
app.get('/groups', requireAuth, async (req, res) => {
  try {
    const { data, error } = await req.db
      .from('groups')
      .select('*, group_members(*)')
      .eq('is_active', true);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ groups: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/groups', requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body;

    const { data, error } = await req.db
      .from('groups')
      .insert({
        name,
        description,
        admin_id: req.user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await req.db.from('group_members').insert({
      group_id: data.id,
      user_id: req.user.id,
      role: 'admin'
    });

    res.json({ group: data, message: 'Grupo criado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lost pets routes
app.get('/lost-pets', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;

    let query = req.db.from('lost_pets').select('*');

    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ lostPets: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/lost-pets', requireAuth, async (req, res) => {
  try {
    const { title, description, kind, lat, lon, address, phone, petId, image } = req.body;

    const { data, error } = await req.db
      .from('lost_pets')
      .insert({
        user_id: req.user.id,
        pet_id: petId,
        title,
        description,
        kind,
        lat,
        lon,
        address,
        phone,
        status: 'active',
        image_url: image
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ lostPet: data, message: 'Aviso de pet perdido publicado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export data route
app.get('/export', requireAuth, async (req, res) => {
  try {
    const { data: pets, error: petsError } = await req.db
      .from('pets')
      .select('*')
      .eq('user_id', req.user.id);

    if (petsError) return res.status(500).json({ error: petsError.message });

    const petIds = (pets || []).map(p => p.id);

    const [health, reminders, groups, lostPets] = await Promise.all([
      petIds.length
        ? req.db.from('health').select('*').in('pet_id', petIds)
        : Promise.resolve({ data: [] }),
      petIds.length
        ? req.db.from('reminders').select('*').in('pet_id', petIds)
        : Promise.resolve({ data: [] }),
      req.db.from('groups').select('*').eq('is_active', true),
      req.db.from('lost_pets').select('*').eq('user_id', req.user.id)
    ]);

    const backup = {
      userId: req.user.id,
      exportedAt: new Date().toISOString(),
      pets: pets || [],
      healthRecords: health?.data || [],
      reminders: reminders?.data || [],
      groups: groups?.data || [],
      lostPets: lostPets?.data || []
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="petlink-backup-${new Date().toISOString().slice(0,10)}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`PetLink API running on port ${PORT}`);
});

export default app;
