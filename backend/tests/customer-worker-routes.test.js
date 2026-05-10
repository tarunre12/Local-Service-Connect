const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');
const initModels = require('../models/index');
const errorHandler = require('../middleware/errorHandler');

jest.mock('../services/workerMatchingAI', () => ({
  matchWorkersForJob: async () => [],
  calculateWorkerScore: () => 1,
}));
jest.mock('../services/priceEstimationAI', () => ({
  estimatePrice: async () => ({ min: 300, max: 900, suggested: 650, reasoning: 'test' }),
}));
jest.mock('../services/reviewSentimentService', () => ({
  analyzeSentiment: async () => ({ sentiment: 'POSITIVE', scores: {} }),
}));

let app;
let sequelize;
let customerId;
let workerId;
let customerToken;
let workerToken;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  global.appConfig = { jwtSecret: 'route_test_secret', jwtExpire: '1h', frontendUrl: '*' };

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });

  const db = initModels(sequelize);
  await sequelize.sync({ force: true });

  const express = require('express');
  const customerRoutes = require('../routes/customer');
  const workerRoutes = require('../routes/worker');

  const customer = await db.Customer.create({
    firstName: 'Ravi',
    lastName: 'Kumar',
    phone: '9000000001',
    city: 'Hyderabad',
    passwordHash: await bcrypt.hash('password123', 12),
    lat: 17.44,
    lng: 78.34,
  });

  const worker = await db.Worker.create({
    firstName: 'Suresh',
    lastName: 'Reddy',
    phone: '9000000002',
    city: 'Hyderabad',
    skills: ['Plumbing', 'Electrical'],
    experience: '5 years',
    isAvailable: true,
    isVerified: true,
    vehicleInfo: 'Bike',
    passwordHash: await bcrypt.hash('password123', 12),
    lat: 17.45,
    lng: 78.35,
  });

  customerId = customer.id;
  workerId = worker.id;
  customerToken = jwt.sign({ id: customer.id, role: 'customer' }, global.appConfig.jwtSecret, { expiresIn: '1h' });
  workerToken = jwt.sign({ id: worker.id, role: 'worker' }, global.appConfig.jwtSecret, { expiresIn: '1h' });

  app = express();
  app.use(express.json());
  app.use('/api/customer', customerRoutes);
  app.use('/api/worker', workerRoutes);
  app.use(errorHandler);
});

afterAll(async () => {
  await sequelize.close();
});

describe('customer and worker routes use Sequelize models', () => {
  it('creates a booking and exposes it to matching workers', async () => {
    const createRes = await request(app)
      .post('/api/customer/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        service: 'Plumbing',
        description: 'Pipe burst under sink',
        address: '12 Banjara Hills, Hyderabad',
        lat: 17.4447,
        lng: 78.3483,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.customerId).toBe(customerId);
    expect(createRes.body.data.aiMatchedWorkerIds).toEqual([]);

    const openJobsRes = await request(app)
      .get('/api/worker/open-jobs')
      .set('Authorization', `Bearer ${workerToken}`);

    expect(openJobsRes.status).toBe(200);
    expect(openJobsRes.body.count).toBe(1);
    expect(openJobsRes.body.data[0].customer.firstName).toBe('Ravi');
    expect(openJobsRes.body.data[0].service).toBe('Plumbing');
  });

  it('returns worker tracking details for accepted jobs', async () => {
    const { db } = require('../models/index');
    const booking = await db.Booking.create({
      customerId,
      workerId,
      service: 'Electrical',
      description: 'Ceiling fan issue',
      address: 'Flat 4B, Banjara Hills',
      status: 'accepted',
    });

    await request(app)
      .patch(`/api/worker/jobs/${booking.id}/start`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send();

    await request(app)
      .patch('/api/worker/location')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ lat: 17.451, lng: 78.352 });

    const trackingRes = await request(app)
      .get(`/api/customer/bookings/${booking.id}/tracking`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(trackingRes.status).toBe(200);
    expect(trackingRes.body.success).toBe(true);
    expect(trackingRes.body.workerName).toBe('Suresh Reddy');
    expect(trackingRes.body.workerPhone).toBe('9000000002');
    expect(trackingRes.body.lat).toBeCloseTo(17.451);
    expect(trackingRes.body.lng).toBeCloseTo(78.352);
  });
});
