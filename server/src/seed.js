require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, closeDB } = require('./db');
const User = require('./models/User');
const Department = require('./models/Department');
const Complaint = require('./models/Complaint');
const Invitation = require('./models/Invitation');
const AuditLog = require('./models/AuditLog');

async function populateInitialData() {
  // 1. Create Departments
  const departmentsData = [
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

  const existingDepts = await Department.countDocuments();
  if (existingDepts === 0) {
    const createdDepartments = await Department.insertMany(departmentsData);
    console.log(`[Seed] Seeded ${createdDepartments.length} municipal departments.`);
  }

  // 2. Create Users for all 4 roles
  const citizen = await User.create({
    name: 'Ramesh Sharma',
    email: 'ramesh.citizen@example.com',
    password: 'Citizen123',
    phone: '+91 98765 43210',
    role: 'citizen',
    ward: 'Ward 4',
    points: 70,
    badges: [
      { id: 'civic_starter', name: 'Civic Scout', description: 'Submitted first verified civic issue on Samadhan' },
      { id: 'active_resolver', name: 'Active Contributor', description: 'Contributed 50+ points through submissions and feedback' },
    ],
  });

  const admin = await User.create({
    name: 'Pooja Verma',
    email: 'admin.pooja@delhimunicipal.gov.in',
    password: 'Admin123',
    phone: '+91 98111 22334',
    role: 'municipal_admin',
    department: 'Municipal Administration',
    ward: 'Central Zone',
  });

  const supervisor = await User.create({
    name: 'Vikram Malhotra',
    email: 'supervisor.vikram@delhimunicipal.gov.in',
    password: 'Supervisor123',
    phone: '+91 98222 33445',
    role: 'supervisor',
    department: 'Roads & Infrastructure',
    ward: 'North Zone',
  });

  const fieldWorker = await User.create({
    name: 'Karan Singh',
    email: 'worker.karan@delhimunicipal.gov.in',
    password: 'Worker123',
    phone: '+91 98333 44556',
    role: 'field_worker',
    department: 'Roads & Infrastructure',
    ward: 'Ward 4',
  });

  console.log('[Seed] Seeded 4 fictional demo users (Citizen, Admin, Supervisor, Field Worker).');

  // 3. Create Sample Staff Invitation
  const demoInvitation = await Invitation.create({
    code: 'SAM-INV-FW-DEMO2026',
    email: 'newworker.anil@delhimunicipal.gov.in',
    role: 'field_worker',
    department: 'Sanitation & Solid Waste',
    ward: 'Ward 2',
    invitedBy: admin._id,
  });
  console.log(`[Seed] Created demo staff invitation code: ${demoInvitation.code}`);

  // 4. Seed 16+ diverse Complaints with realistic geo-locations & audit history
  const sampleComplaints = [
    {
      trackingId: 'SAM-20261001-A101',
      title: 'Dangerous deep pothole near Metro Pillar 142',
      description: 'A 2-foot wide pothole causing two-wheeler skids during morning rush hour.',
      category: 'Potholes & Road Damage',
      priority: 'urgent',
      status: 'resolved',
      citizen: citizen._id,
      assignedDepartment: 'Roads & Infrastructure',
      assignedTo: fieldWorker._id,
      assignedSupervisor: supervisor._id,
      location: { latitude: 28.6289, longitude: 77.2065, address: 'Metro Pillar 142, Connaught Circus', city: 'Delhi NCR', ward: 'Ward 4' },
      photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600',
      evidencePhotoUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600',
      resolutionNotes: 'Pothole filled with rapid set asphalt aggregate and compacted.',
      feedback: { rating: 5, comment: 'Repaired swiftly in less than 24 hours. Excellent work!', submittedAt: new Date('2026-10-02T16:00:00Z') },
      pointsAwarded: { submission: true, resolution: true, feedback: true },
      createdAt: new Date('2026-10-01T08:30:00Z'),
    },
    {
      trackingId: 'SAM-20261002-B202',
      title: 'Garbage dumpster overflowing onto footpath',
      description: 'Solid waste container overflowing for 3 days, emitting foul odor near primary school gate.',
      category: 'Garbage & Waste Disposal',
      priority: 'high',
      status: 'verified',
      citizen: citizen._id,
      assignedDepartment: 'Sanitation & Solid Waste',
      assignedTo: fieldWorker._id,
      location: { latitude: 28.6353, longitude: 77.2249, address: 'Near School No. 4, Mandi House', city: 'Delhi NCR', ward: 'Ward 2' },
      photoUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600',
      evidencePhotoUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600',
      resolutionNotes: 'Compactor vehicle dispatched, entire bin and perimeter disinfected.',
      pointsAwarded: { submission: true, resolution: true, feedback: false },
      createdAt: new Date('2026-10-02T11:15:00Z'),
    },
    {
      trackingId: 'SAM-20261003-C303',
      title: 'Continuous water pipeline leak flooding lane',
      description: 'Main potable water feeder pipe cracked, wasting clean water and softening road foundation.',
      category: 'Water Supply & Leakage',
      priority: 'urgent',
      status: 'in_progress',
      citizen: citizen._id,
      assignedDepartment: 'Water Supply & Sewerage',
      assignedTo: fieldWorker._id,
      location: { latitude: 28.6180, longitude: 77.2140, address: 'Lane 7, Sector 3, Gole Market', city: 'Delhi NCR', ward: 'Ward 3' },
      photoUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600',
      pointsAwarded: { submission: true, resolution: false, feedback: false },
      createdAt: new Date('2026-10-03T09:00:00Z'),
    },
    {
      trackingId: 'SAM-20261004-D404',
      title: 'Streetlight pole faulty and sparking in drizzle',
      description: 'Pole light flickering continuously, dangling wire creates safety hazard for pedestrians.',
      category: 'Streetlight & Electrical',
      priority: 'urgent',
      status: 'assigned',
      citizen: citizen._id,
      assignedDepartment: 'Electrical & Street Lighting',
      location: { latitude: 28.6410, longitude: 77.2190, address: 'Pahar Ganj Main Crossing', city: 'Delhi NCR', ward: 'Ward 5' },
      photoUrl: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=600',
      pointsAwarded: { submission: true, resolution: false, feedback: false },
      createdAt: new Date('2026-10-04T18:20:00Z'),
    },
    {
      trackingId: 'SAM-20261005-E505',
      title: 'Open drainage manhole cover missing',
      description: 'Heavy concrete cover broken, leaving 4-foot deep sewer opening completely uncovered.',
      category: 'Drainage & Sewage Overflow',
      priority: 'urgent',
      status: 'under_review',
      citizen: citizen._id,
      assignedDepartment: 'Water Supply & Sewerage',
      location: { latitude: 28.6050, longitude: 77.2210, address: 'Lodhi Colony Block 11', city: 'Delhi NCR', ward: 'Ward 6' },
      photoUrl: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?w=600',
      pointsAwarded: { submission: true, resolution: false, feedback: false },
      createdAt: new Date('2026-10-05T14:45:00Z'),
    },
    {
      trackingId: 'SAM-20261006-F606',
      title: 'Pack of aggressive stray dogs blocking lane',
      description: 'Stray dogs barking and chasing cyclists at night. Need animal welfare vaccination squad.',
      category: 'Stray Animals & Pest Control',
      priority: 'medium',
      status: 'submitted',
      citizen: citizen._id,
      assignedDepartment: 'Public Health & Animal Welfare',
      location: { latitude: 28.5900, longitude: 77.2300, address: 'Jor Bagh Enclave Gate 1', city: 'Delhi NCR', ward: 'Ward 7' },
      pointsAwarded: { submission: true, resolution: false, feedback: false },
      createdAt: new Date('2026-10-06T10:00:00Z'),
    },
    {
      trackingId: 'SAM-20261007-G707',
      title: 'Illegal debris dumped in municipal park',
      description: 'Construction rubble dumped by unknown truck in community jogging park.',
      category: 'Illegal Construction & Encroachment',
      priority: 'medium',
      status: 'submitted',
      citizen: citizen._id,
      assignedDepartment: 'Roads & Infrastructure',
      location: { latitude: 28.6300, longitude: 77.1900, address: 'Karol Bagh Municipal Park', city: 'Delhi NCR', ward: 'Ward 8' },
      pointsAwarded: { submission: true, resolution: false, feedback: false },
      createdAt: new Date('2026-10-07T12:00:00Z'),
    },
    {
      trackingId: 'SAM-20261008-H808',
      title: 'Public toilet block water tap broken',
      description: 'No running water in public conveniences near bus terminal.',
      category: 'Public Sanitation & Toilets',
      priority: 'medium',
      status: 'in_progress',
      citizen: citizen._id,
      assignedDepartment: 'Sanitation & Solid Waste',
      location: { latitude: 28.6500, longitude: 77.2300, address: 'Kashmere Gate Bus Stand', city: 'Delhi NCR', ward: 'Ward 1' },
      pointsAwarded: { submission: true, resolution: false, feedback: false },
      createdAt: new Date('2026-10-08T07:30:00Z'),
    },
    {
      trackingId: 'SAM-20261009-I909',
      title: 'Streetlights dark on entire 500m avenue',
      description: 'All 8 lamp posts dark between clock tower and bank branch.',
      category: 'Streetlight & Electrical',
      priority: 'high',
      status: 'resolved',
      citizen: citizen._id,
      assignedDepartment: 'Electrical & Street Lighting',
      evidencePhotoUrl: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=600',
      resolutionNotes: 'MCB box reset and two blown LED fixtures replaced.',
      location: { latitude: 28.6200, longitude: 77.2000, address: 'Shivaji Stadium Road', city: 'Delhi NCR', ward: 'Ward 4' },
      pointsAwarded: { submission: true, resolution: true, feedback: false },
      createdAt: new Date('2026-10-09T19:00:00Z'),
    },
    {
      trackingId: 'SAM-20261010-J010',
      title: 'Sewage overflowing into open storm drain',
      description: 'Drain blocked with plastic waste, black water backing up onto street.',
      category: 'Drainage & Sewage Overflow',
      priority: 'high',
      status: 'assigned',
      citizen: citizen._id,
      assignedDepartment: 'Water Supply & Sewerage',
      location: { latitude: 28.6150, longitude: 77.2400, address: 'Pragati Maidan Gate 5', city: 'Delhi NCR', ward: 'Ward 9' },
      pointsAwarded: { submission: true, resolution: false, feedback: false },
      createdAt: new Date('2026-10-10T11:45:00Z'),
    },
    {
      trackingId: 'SAM-20261011-K111',
      title: 'Cracked pedestrian pavement slabs',
      description: 'Elderly pedestrians tripping over disjointed concrete pavers.',
      category: 'Potholes & Road Damage',
      priority: 'low',
      status: 'under_review',
      citizen: citizen._id,
      assignedDepartment: 'Roads & Infrastructure',
      location: { latitude: 28.5800, longitude: 77.2200, address: 'Defence Colony Market Flyover', city: 'Delhi NCR', ward: 'Ward 10' },
      pointsAwarded: { submission: true, resolution: false, feedback: false },
      createdAt: new Date('2026-10-11T13:20:00Z'),
    },
    {
      trackingId: 'SAM-20261012-L212',
      title: 'Fallen tree branch obstructing lane',
      description: 'Storm winds caused large bough to block two-way traffic.',
      category: 'Other Civic Issues',
      priority: 'high',
      status: 'resolved',
      citizen: citizen._id,
      assignedDepartment: 'Public Health & Animal Welfare',
      evidencePhotoUrl: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?w=600',
      resolutionNotes: 'Horticulture chainsaw team cleared debris.',
      location: { latitude: 28.6000, longitude: 77.2100, address: 'Chanakyapuri Shanti Path', city: 'Delhi NCR', ward: 'Ward 3' },
      pointsAwarded: { submission: true, resolution: true, feedback: false },
      createdAt: new Date('2026-10-12T08:10:00Z'),
    },
    {
      trackingId: 'SAM-20261012-M313',
      title: 'Commercial waste dumped along railway line',
      description: 'Packaging cartons and thermocol crates piled up by vendors.',
      category: 'Garbage & Waste Disposal',
      priority: 'medium',
      status: 'submitted',
      citizen: citizen._id,
      assignedDepartment: 'Sanitation & Solid Waste',
      location: { latitude: 28.6400, longitude: 77.2100, address: 'New Delhi Railway Station West', city: 'Delhi NCR', ward: 'Ward 5' },
      pointsAwarded: { submission: true, resolution: false, feedback: false },
      createdAt: new Date('2026-10-12T15:30:00Z'),
    },
    {
      trackingId: 'SAM-20261013-N414',
      title: 'Drinking water contamination muddy color',
      description: 'Tap water running turbid brown for 2 days in residential block.',
      category: 'Water Supply & Leakage',
      priority: 'urgent',
      status: 'in_progress',
      citizen: citizen._id,
      assignedDepartment: 'Water Supply & Sewerage',
      location: { latitude: 28.6250, longitude: 77.2150, address: 'Barakhamba Road Quarters', city: 'Delhi NCR', ward: 'Ward 4' },
      pointsAwarded: { submission: true, resolution: false, feedback: false },
      createdAt: new Date('2026-10-13T06:00:00Z'),
    },
    {
      trackingId: 'SAM-20261013-O515',
      title: 'Mosquito breeding in stagnant pool near park',
      description: 'Water accumulated after rain, high risk of dengue. Anti-larval spray requested.',
      category: 'Stray Animals & Pest Control',
      priority: 'high',
      status: 'assigned',
      citizen: citizen._id,
      assignedDepartment: 'Public Health & Animal Welfare',
      location: { latitude: 28.6100, longitude: 77.2300, address: 'India Gate Children Park', city: 'Delhi NCR', ward: 'Ward 6' },
      pointsAwarded: { submission: true, resolution: false, feedback: false },
      createdAt: new Date('2026-10-13T09:15:00Z'),
    },
    {
      trackingId: 'SAM-20261013-P616',
      title: 'Deep road cave-in around drainage inspection chamber',
      description: 'Asphalt sinking around square chamber, poses risk to buses.',
      category: 'Potholes & Road Damage',
      priority: 'urgent',
      status: 'submitted',
      citizen: citizen._id,
      assignedDepartment: 'Roads & Infrastructure',
      location: { latitude: 28.6320, longitude: 77.2180, address: 'KG Marg intersection', city: 'Delhi NCR', ward: 'Ward 4' },
      pointsAwarded: { submission: true, resolution: false, feedback: false },
      createdAt: new Date('2026-10-13T12:00:00Z'),
    },
  ];

  for (const comp of sampleComplaints) {
    comp.statusHistory = [
      {
        status: 'submitted',
        changedBy: citizen._id,
        changedByName: citizen.name,
        role: 'citizen',
        note: 'Reported by citizen on Samadhan portal.',
        timestamp: comp.createdAt,
      },
    ];

    if (comp.status !== 'submitted') {
      comp.statusHistory.push({
        status: comp.status,
        changedBy: admin._id,
        changedByName: admin.name,
        role: 'municipal_admin',
        note: `Status updated to ${comp.status}`,
        timestamp: new Date(comp.createdAt.getTime() + 2 * 3600 * 1000),
      });
    }

    await Complaint.create(comp);
  }

  console.log(`[Seed] Seeded ${sampleComplaints.length} rich complaints across 10 wards!`);
}

async function seedData() {
  console.log('[Seed] Initializing SAMADHAN fictional demo dataset...');
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Complaint.deleteMany({}),
    Invitation.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  await populateInitialData();
  console.log('[Seed] Seeding completed successfully.');
  await closeDB();
}

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}

module.exports = { seedData, populateInitialData };
