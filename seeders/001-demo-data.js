'use strict';
const path = require('path');
const bcrypt = require(require.resolve('bcryptjs', { paths: [path.resolve(__dirname, '../backend')] }));
const { v4: uuidv4 } = require(require.resolve('uuid', { paths: [path.resolve(__dirname, '../backend')] }));

const customerId1 = uuidv4();
const workerId1   = uuidv4();
const workerId2   = uuidv4();
const bookingId1  = uuidv4();
const bookingId2  = uuidv4();

module.exports = {
  up: async (queryInterface) => {
    const hash = await bcrypt.hash('password123', 12);

    await queryInterface.bulkInsert('customers', [{
      id: customerId1, first_name: 'Ravi', last_name: 'Kumar',
      email: 'ravi@example.com', phone: '9876543210',
      city: 'Hyderabad', password_hash: hash, avatar: '👤',
      is_active: true, created_at: new Date(), updated_at: new Date(),
    }]);

    await queryInterface.bulkInsert('workers', [
      {
        id: workerId1, first_name: 'Suresh', last_name: 'Reddy',
        email: 'suresh@example.com', phone: '9123456789',
        city: 'Hyderabad', skills: '{Plumbing,Electrical}',
        experience: '5 years', password_hash: hash, avatar: '👷',
        is_available: true, is_verified: true, rating: 4.9,
        lat: 17.385, lng: 78.4867, is_active: true,
        created_at: new Date(), updated_at: new Date(),
      },
      {
        id: workerId2, first_name: 'Kiran', last_name: 'Babu',
        email: 'kiran@example.com', phone: '9988776655',
        city: 'Hyderabad', skills: '{Cleaning,Carpentry}',
        experience: '3 years', password_hash: hash, avatar: '👷',
        is_available: true, is_verified: true, rating: 4.5,
        lat: 17.3950, lng: 78.4867, is_active: true,
        created_at: new Date(), updated_at: new Date(),
      }
    ]);

    await queryInterface.bulkInsert('bookings', [
      {
        id: bookingId1, customer_id: customerId1, worker_id: workerId1,
        service: 'Electrical', description: 'Fix ceiling fan wiring',
        address: 'Flat 3B, Banjara Hills, Hyderabad',
        status: 'completed', price: 600, ai_suggested_price: 580,
        ai_matched_worker_ids: `{${workerId1}}`,
        accepted_at: new Date('2025-03-05'), completed_at: new Date('2025-03-05'),
        created_at: new Date('2025-03-04'), updated_at: new Date('2025-03-05'),
      },
      {
        id: bookingId2, customer_id: customerId1, worker_id: workerId1,
        service: 'Plumbing', description: 'Leaking bathroom pipe',
        address: 'Flat 3B, Banjara Hills, Hyderabad',
        status: 'completed', price: 850, ai_suggested_price: 800,
        ai_matched_worker_ids: `{${workerId1}}`,
        accepted_at: new Date('2025-03-01'), completed_at: new Date('2025-03-01'),
        created_at: new Date('2025-03-01'), updated_at: new Date('2025-03-01'),
      }
    ]);

    await queryInterface.bulkInsert('reviews', [
      {
        id: uuidv4(), booking_id: bookingId1, customer_id: customerId1, worker_id: workerId1,
        rating: 5, comment: 'Excellent work, very professional!',
        sentiment: 'POSITIVE', sentiment_score: JSON.stringify({ positive: 0.98, negative: 0.01, neutral: 0.01, mixed: 0.0 }),
        created_at: new Date(), updated_at: new Date(),
      },
      {
        id: uuidv4(), booking_id: bookingId2, customer_id: customerId1, worker_id: workerId1,
        rating: 5, comment: 'Fixed quickly, very satisfied.',
        sentiment: 'POSITIVE', sentiment_score: JSON.stringify({ positive: 0.96, negative: 0.01, neutral: 0.03, mixed: 0.0 }),
        created_at: new Date(), updated_at: new Date(),
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('reviews', null, {});
    await queryInterface.bulkDelete('bookings', null, {});
    await queryInterface.bulkDelete('workers', null, {});
    await queryInterface.bulkDelete('customers', null, {});
  }
};
