/**
 * SUPABASE DATABASE CONFIGURATION
 *
 * Configures connection to Supabase PostgreSQL database
 * with pgvector support for AI embeddings.
 */

const { createClient } = require('@supabase/supabase-js');
const { logger } = require('../utils/logger');

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Create Supabase client with service role key for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Test database connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('count')
      .limit(1);

    if (error) throw error;
    logger.info('✅ Supabase database connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Supabase database connection failed:', error.message);
    return false;
  }
};

// Initialize connection test
testConnection();

module.exports = {
  supabase,
  testConnection
};
