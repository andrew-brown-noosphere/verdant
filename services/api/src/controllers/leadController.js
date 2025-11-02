/**
 * LEAD CONTROLLER
 *
 * Business logic for lead management, AI scoring, and conversion tracking.
 */

const { supabase } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const axios = require('axios');

/**
 * List leads with filtering and AI-based sorting
 */
exports.listLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      source,
      minScore,
      sortBy = 'score',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (source) {
      query = query.eq('source', source);
    }
    if (minScore) {
      query = query.gte('score', minScore);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc', nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error listing leads:', error);
    next(new AppError('Failed to retrieve leads', 500));
  }
};

/**
 * Create a new lead with automatic AI scoring
 */
exports.createLead = async (req, res, next) => {
  try {
    const {
      email,
      phone,
      first_name,
      last_name,
      source,
      source_details,
      referrer_customer_id,
      property_address,
      property_size_sqft,
      services_interested,
      notes
    } = req.body;

    // Validate required fields
    if (!source) {
      throw new AppError('Lead source is required', 400);
    }

    // Create lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        email,
        phone,
        first_name,
        last_name,
        source,
        source_details,
        referrer_customer_id,
        property_address,
        property_size_sqft,
        services_interested,
        notes,
        status: 'new'
      })
      .select()
      .single();

    if (error) throw error;

    // Call AI service to score the lead (async, don't wait)
    axios.post(`${process.env.PYTHON_API_URL}/api/ai/leads/score`, {
      lead_id: lead.id
    })
      .then(response => {
        // Update lead with AI score
        supabase
          .from('leads')
          .update({
            score: response.data.score,
            score_factors: response.data.factors
          })
          .eq('id', lead.id)
          .then(() => logger.info(`Lead ${lead.id} scored: ${response.data.score}`))
          .catch(err => logger.error(`Failed to update lead score: ${err.message}`));
      })
      .catch(error => {
        logger.warn('Failed to score lead:', error.message);
      });

    // Generate embedding for semantic search
    axios.post(`${process.env.PYTHON_API_URL}/api/ai/embeddings/lead`, {
      lead_id: lead.id
    })
      .catch(error => logger.warn('Failed to generate lead embedding:', error.message));

    res.status(201).json({
      message: 'Lead created successfully. AI scoring in progress...',
      data: lead
    });
  } catch (error) {
    logger.error('Error creating lead:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to create lead', 500));
  }
};

/**
 * Get lead details
 */
exports.getLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('leads')
      .select('*, referrer:referrer_customer_id(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Lead not found', 404);
      }
      throw error;
    }

    res.json({ data });
  } catch (error) {
    logger.error('Error fetching lead:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to retrieve lead', 500));
  }
};

/**
 * Update lead information
 */
exports.updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.created_at;

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Lead not found', 404);
      }
      throw error;
    }

    // Regenerate score if significant changes
    if (updateData.property_size_sqft || updateData.services_interested) {
      axios.post(`${process.env.PYTHON_API_URL}/api/ai/leads/score`, {
        lead_id: id
      })
        .catch(error => logger.warn('Failed to rescore lead:', error.message));
    }

    res.json({
      message: 'Lead updated successfully',
      data
    });
  } catch (error) {
    logger.error('Error updating lead:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to update lead', 500));
  }
};

/**
 * Manually trigger AI lead scoring
 */
exports.scoreLeads = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if lead exists
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !lead) {
      throw new AppError('Lead not found', 404);
    }

    // Call AI service to score the lead
    const response = await axios.post(
      `${process.env.PYTHON_API_URL}/api/ai/leads/score`,
      { lead_id: id }
    );

    // Update lead with new score
    const { data, error } = await supabase
      .from('leads')
      .update({
        score: response.data.score,
        score_factors: response.data.factors,
        estimated_monthly_value: response.data.estimated_monthly_value
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Lead scored successfully',
      data: {
        ...data,
        score_explanation: response.data.explanation
      }
    });
  } catch (error) {
    logger.error('Error scoring lead:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    if (error.response) {
      return next(new AppError(`AI service error: ${error.response.data.detail}`, 500));
    }
    next(new AppError('Failed to score lead', 500));
  }
};

/**
 * Convert lead to customer
 */
exports.convertLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes, initial_service_date } = req.body;

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (leadError || !lead) {
      throw new AppError('Lead not found', 404);
    }

    if (lead.status === 'won') {
      throw new AppError('Lead already converted', 400);
    }

    // Create customer from lead
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        email: lead.email,
        phone: lead.phone,
        first_name: lead.first_name,
        last_name: lead.last_name,
        notes: notes || lead.notes,
        tags: ['converted-lead', lead.source]
      })
      .select()
      .single();

    if (customerError) throw customerError;

    // Update lead status
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'won',
        converted_to_customer_id: customer.id,
        converted_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // If property address exists, create property for customer
    if (lead.property_address) {
      await supabase
        .from('properties')
        .insert({
          customer_id: customer.id,
          street_address: lead.property_address.street,
          city: lead.property_address.city,
          state: lead.property_address.state,
          zip_code: lead.property_address.zip,
          lot_size_sqft: lead.property_size_sqft
        });
    }

    // Handle referral reward if applicable
    if (lead.referrer_customer_id) {
      await supabase
        .from('referrals')
        .update({
          status: 'completed',
          referred_customer_id: customer.id,
          completed_at: new Date().toISOString()
        })
        .eq('referred_lead_id', id);
    }

    res.json({
      message: 'Lead converted to customer successfully',
      data: {
        customer,
        lead_id: id
      }
    });
  } catch (error) {
    logger.error('Error converting lead:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to convert lead', 500));
  }
};

/**
 * Log contact attempt with a lead
 */
exports.logContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { method, notes, outcome } = req.body;

    // Update contact tracking
    const { data, error } = await supabase
      .from('leads')
      .update({
        last_contact_date: new Date().toISOString(),
        contact_attempts: supabase.rpc('increment', { row_id: id, field: 'contact_attempts' }),
        notes: notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Contact logged successfully',
      data
    });
  } catch (error) {
    logger.error('Error logging contact:', error);
    next(new AppError('Failed to log contact', 500));
  }
};

/**
 * Find similar leads using vector search
 */
exports.findSimilarLeads = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    // Call AI service for semantic similarity search
    const response = await axios.get(
      `${process.env.PYTHON_API_URL}/api/ai/leads/similar/${id}`,
      { params: { limit } }
    );

    res.json({
      message: 'Similar leads found',
      data: response.data
    });
  } catch (error) {
    logger.error('Error finding similar leads:', error);
    if (error.response) {
      return next(new AppError(`AI service error: ${error.response.data.detail}`, 500));
    }
    next(new AppError('Failed to find similar leads', 500));
  }
};

/**
 * Bulk import leads
 */
exports.bulkImportLeads = async (req, res, next) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      throw new AppError('Invalid leads data. Expected array of lead objects.', 400);
    }

    // Validate and prepare leads
    const preparedLeads = leads.map(lead => ({
      ...lead,
      status: 'new',
      created_at: new Date().toISOString()
    }));

    // Insert leads
    const { data, error } = await supabase
      .from('leads')
      .insert(preparedLeads)
      .select();

    if (error) throw error;

    // Trigger batch scoring (async)
    axios.post(`${process.env.PYTHON_API_URL}/api/ai/leads/batch-score`, {
      lead_ids: data.map(l => l.id)
    })
      .catch(error => logger.warn('Failed to batch score leads:', error.message));

    res.status(201).json({
      message: `Successfully imported ${data.length} leads. AI scoring in progress...`,
      data: {
        imported_count: data.length,
        lead_ids: data.map(l => l.id)
      }
    });
  } catch (error) {
    logger.error('Error bulk importing leads:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to import leads', 500));
  }
};
