const db = require('../db');

const FIELDS = ['first_name', 'last_name', 'email', 'age', 'course'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns { data } with cleaned values, or { errors } keyed by field name.
function validate(body) {
  const errors = {};
  const data = {};
  for (const f of FIELDS) {
    const v = typeof body[f] === 'string' ? body[f].trim() : body[f];
    if (v === undefined || v === null || v === '') errors[f] = 'Required';
    else data[f] = v;
  }
  if (data.email && !EMAIL_RE.test(data.email)) errors.email = 'Invalid email';
  if (data.age !== undefined) {
    const age = Number(data.age);
    if (!Number.isInteger(age) || age < 1 || age > 150) errors.age = 'Age must be a whole number between 1 and 150';
    else data.age = age;
  }
  return Object.keys(errors).length ? { errors } : { data };
}

const isUniqueViolation = (err) => err.code === '23505';

exports.list = async (req, res) => {
  res.json(await db('students').orderBy('id'));
};

exports.get = async (req, res) => {
  const student = await db('students').where({ id: req.params.id }).first();
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
};

exports.create = async (req, res) => {
  const { data, errors } = validate(req.body);
  if (errors) return res.status(400).json({ error: 'Validation failed', errors });
  try {
    const [student] = await db('students').insert(data).returning('*');
    res.status(201).json(student);
  } catch (err) {
    if (isUniqueViolation(err)) return res.status(409).json({ error: 'Email already exists' });
    throw err;
  }
};

exports.update = async (req, res) => {
  const { data, errors } = validate(req.body);
  if (errors) return res.status(400).json({ error: 'Validation failed', errors });
  try {
    const [student] = await db('students').where({ id: req.params.id }).update(data).returning('*');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    if (isUniqueViolation(err)) return res.status(409).json({ error: 'Email already exists' });
    throw err;
  }
};

exports.remove = async (req, res) => {
  const count = await db('students').where({ id: req.params.id }).del();
  if (!count) return res.status(404).json({ error: 'Student not found' });
  res.status(204).end();
};
