'use strict';

// Vercel serverless function: GET /api/providers
// Read-only demo dataset; no Gemini key involved.
module.exports = require('../lib/handlers').providersHandler;
