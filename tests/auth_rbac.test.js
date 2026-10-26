const test = require('node:test');
const assert = require('node:assert');
const { connectDB, closeDB } = require('../server/src/db');
const User = require('../server/src/models/User');
const Invitation = require('../server/src/models/Invitation');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../server/src/middleware/auth');

test('SAMADHAN Core Auth & RBAC Suite', async (t) => {
  await t.test('1. Connect to Database', async () => {
    await connectDB();
    assert.ok(true, 'Database connected');
  });

  await t.test('2. Citizen registration hashes password and assigns citizen role', async () => {
    await User.deleteMany({});
    const citizen = new User({
      name: 'Ramesh Sharma',
      email: 'ramesh.citizen@example.com',
      password: 'SecurePassword123',
      role: 'citizen',
    });
    await citizen.save();

    assert.notStrictEqual(citizen.password, 'SecurePassword123', 'Password must be hashed with bcrypt');
    assert.strictEqual(citizen.role, 'citizen', 'Default role must be citizen');

    const match = await citizen.comparePassword('SecurePassword123');
    assert.strictEqual(match, true, 'comparePassword should return true for correct password');

    const wrongMatch = await citizen.comparePassword('WrongPassword');
    assert.strictEqual(wrongMatch, false, 'comparePassword should return false for incorrect password');
  });

  await t.test('3. Admin creates staff invitation and field worker redeems it', async () => {
    const admin = new User({
      name: 'Pooja Verma',
      email: 'admin.pooja@delhimunicipal.gov.in',
      password: 'AdminPassword123',
      role: 'municipal_admin',
    });
    await admin.save();

    const invCode = 'SAM-INV-FW-TEST99';
    const invitation = new Invitation({
      code: invCode,
      email: 'worker.karan@delhimunicipal.gov.in',
      role: 'field_worker',
      department: 'Roads & Infrastructure',
      ward: 'Ward 4',
      invitedBy: admin._id,
    });
    await invitation.save();

    assert.strictEqual(invitation.isUsed, false);

    // Redeem invitation
    const fieldWorker = new User({
      name: 'Karan Singh',
      email: 'worker.karan@delhimunicipal.gov.in',
      password: 'WorkerPassword123',
      role: invitation.role,
      department: invitation.department,
      ward: invitation.ward,
    });
    await fieldWorker.save();

    invitation.isUsed = true;
    invitation.usedBy = fieldWorker._id;
    await invitation.save();

    assert.strictEqual(fieldWorker.role, 'field_worker');
    assert.strictEqual(fieldWorker.department, 'Roads & Infrastructure');
    assert.strictEqual(invitation.isUsed, true);
  });

  await t.test('4. JWT Token Generation and Verification', async () => {
    const user = await User.findOne({ role: 'citizen' });
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET);

    assert.strictEqual(decoded.email, user.email);
    assert.strictEqual(decoded.role, 'citizen');
  });

  await t.after(async () => {
    await closeDB();
  });
});
