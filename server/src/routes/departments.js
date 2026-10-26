const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { verifyToken, requireRole } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// Default initial departments list
const DEFAULT_DEPARTMENTS = [
  {
    name: 'Roads & Infrastructure',
    code: 'ROADS',
    description: 'Maintenance of paved roads, potholes, pavements, and public pathways',
    categories: ['Potholes & Road Damage', 'Illegal Construction & Encroachment'],
    slaHours: 48,
  },
  {
    name: 'Sanitation & Solid Waste',
    code: 'SWM',
    description: 'Garbage disposal, dump clearance, street sweeping, and landfill management',
    categories: ['Garbage & Waste Disposal', 'Public Sanitation & Toilets'],
    slaHours: 24,
  },
  {
    name: 'Electrical & Street Lighting',
    code: 'ELEC',
    description: 'Streetlight pole maintenance, wiring hazards, and municipal illumination',
    categories: ['Streetlight & Electrical'],
    slaHours: 24,
  },
  {
    name: 'Water Supply & Sewerage',
    code: 'WATER',
    description: 'Drinking water pipelines, drainage clogging, sewage overflow, and pump stations',
    categories: ['Water Supply & Leakage', 'Drainage & Sewage Overflow'],
    slaHours: 36,
  },
  {
    name: 'Public Health & Animal Welfare',
    code: 'HEALTH',
    description: 'Vector control, stray dog management, vaccination, and biological pest control',
    categories: ['Stray Animals & Pest Control', 'Other Civic Issues'],
    slaHours: 48,
  },
];

// Initialize default departments if empty
async function ensureDefaultDepartments() {
  const count = await Department.countDocuments();
  if (count === 0) {
    for (const dep of DEFAULT_DEPARTMENTS) {
      await Department.create(dep);
    }
    console.log('[Departments] Seeded default municipal departments.');
  }
}

// Get all active departments (Public for reporting category lookup)
router.get('/', async (req, res) => {
  try {
    let departments = await Department.find({ isActive: true }).populate('headSupervisor', 'name email');
    if (departments.length === 0) {
      await ensureDefaultDepartments();
      departments = await Department.find({ isActive: true });
    }
    return res.json({ success: true, departments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching departments' });
  }
});

// Admin: Create or update department
router.post('/', verifyToken, requireRole('municipal_admin'), async (req, res) => {
  try {
    const { name, code, description, categories, slaHours, headSupervisor } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and Code are required.' });
    }

    let dep = await Department.findOne({ code: code.toUpperCase() });
    if (dep) {
      dep.name = name;
      dep.description = description || dep.description;
      dep.categories = categories || dep.categories;
      dep.slaHours = slaHours || dep.slaHours;
      dep.headSupervisor = headSupervisor || dep.headSupervisor;
      await dep.save();
    } else {
      dep = await Department.create({
        name,
        code: code.toUpperCase(),
        description,
        categories: categories || [],
        slaHours: slaHours || 48,
        headSupervisor,
      });
    }

    await AuditLog.create({
      action: 'DEPARTMENT_CONFIG_UPDATED',
      entityType: 'Department',
      entityId: dep._id,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      details: `Department ${dep.name} (${dep.code}) configured`,
    });

    return res.status(200).json({ success: true, department: dep });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = { router, ensureDefaultDepartments };
