import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Create complete department structure (main + model + exit)
router.post('/complete-department', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    // 1. Create main department
    const { data: mainDept, error: mainError } = await supabaseAdmin
      .from('departments')
      .insert({ name, icon: icon || '📁' })
      .select()
      .single();

    if (mainError) {
      return res.status(400).json({ error: mainError.message });
    }

    // 2. Create model exams department
    const { data: modelDept, error: modelError } = await supabaseAdmin
      .from('departments')
      .insert({
        name: `${name} - Model Exams`,
        icon: '📝',
      })
      .select()
      .single();

    if (modelError) {
      console.error('Model dept error:', modelError);
    }

    // 3. Create exit exams department
    const { data: exitDept, error: exitError } = await supabaseAdmin
      .from('departments')
      .insert({
        name: `${name} - Exit Exams`,
        icon: '🏆',
      })
      .select()
      .single();

    if (exitError) {
      console.error('Exit dept error:', exitError);
    }

    // Return all three departments
    const result = {
      main: mainDept,
      model: modelDept || null,
      exit: exitDept || null,
      message: 'Complete department structure created successfully',
    };

    res.status(201).json(result);
  } catch (err) {
    console.error('Complete department creation error:', err);
    res.status(500).json({ error: 'Failed to create department structure' });
  }
});

// Get department structure (main + variants)
router.get('/structure/:deptName', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { deptName } = req.params;

    // Get main department
    const { data: main } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('name', deptName)
      .single();

    // Get model exams department
    let model = null;
    try {
      const { data } = await supabaseAdmin
        .from('departments')
        .select('*')
        .eq('name', `${deptName} - Model Exams`)
        .single();
      model = data;
    } catch (err) {
      console.error('Model dept error:', err);
    }

    // Get exit exams department
    let exit = null;
    try {
      const { data } = await supabaseAdmin
        .from('departments')
        .select('*')
        .eq('name', `${deptName} - Exit Exams`)
        .single();
      exit = data;
    } catch (err) {
      console.error('Exit dept error:', err);
    }

    res.json({
      main,
      model,
      exit,
    });
  } catch (err) {
    console.error('Structure fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch department structure' });
  }
});

export default router;
