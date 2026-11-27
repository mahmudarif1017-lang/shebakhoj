'use strict';

// Vercel serverless function: POST /api/search
// All logic lives in lib/handlers.js so local development uses the same code.
module.exports = require('../lib/handlers').searchHandler;
