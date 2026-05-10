# Backend DB Integration TODO
Previous: Root Sequelize setup done.

**Current Status:** Completed — backend routes now run against Sequelize/PostgreSQL models, the stale generated migrations have been neutralized, and the remaining schema gaps are covered by migrations instead of the in-memory store.

**Completed Work**
- Backend models are initialized through `backend/models/index.js`
- Auth, customer, and worker routes use Sequelize CRUD APIs
- SQLite-compatible model fallbacks are in place for the existing Jest test harness
- Fresh PostgreSQL migrations now include the worker operational columns required by production routes

**Validation Checklist**
- Run `npm test` inside `backend/`
- Run `npm run migrate` against PostgreSQL
- Run `npm run seed` against PostgreSQL
