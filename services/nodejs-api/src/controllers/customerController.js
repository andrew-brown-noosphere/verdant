/**
 * CUSTOMER CONTROLLER
 *
 * Business logic for customer management operations.
 */

const { supabase } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const axios = require('axios');

/**
 * List customers with filtering and pagination
 */
exports.listCustomers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
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
    logger.error('Error listing customers:', error);
    next(new AppError('Failed to retrieve customers', 500));
  }
};

/**
 * Create a new customer
 */
exports.createCustomer = async (req, res, next) => {
  try {
    const {
      email,
      phone,
      first_name,
      last_name,
      company_name,
      preferred_contact_method,
      billing_address,
      tags,
      notes
    } = req.body;

    // Validate required fields
    if (!email || !first_name || !last_name) {
      throw new AppError('Email, first name, and last name are required', 400);
    }

    // Check if customer already exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .single();

    if (existing) {
      throw new AppError('Customer with this email already exists', 409);
    }

    // Create customer
    const { data, error } = await supabase
      .from('customers')
      .insert({
        email,
        phone,
        first_name,
        last_name,
        company_name,
        preferred_contact_method,
        billing_address,
        tags,
        notes
      })
      .select()
      .single();

    if (error) throw error;

    // Call AI service to generate customer embedding (async)
    try {
      await axios.post(`${process.env.PYTHON_API_URL}/api/ai/embeddings/customer`, {
        customer_id: data.id
      });
    } catch (embeddingError) {
      logger.warn('Failed to generate customer embedding:', embeddingError.message);
      // Don't fail the request if embedding generation fails
    }

    res.status(201).json({
      message: 'Customer created successfully',
      data
    });
  } catch (error) {
    logger.error('Error creating customer:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to create customer', 500));
  }
};

/**
 * Get customer details with related data
 */
exports.getCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { include } = req.query; // e.g., ?include=properties,jobs

    // Base customer query
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Customer not found', 404);
      }
      throw error;
    }

    // Optionally include related data
    const includeFields = include ? include.split(',') : [];

    if (includeFields.includes('properties')) {
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('customer_id', id);
      data.properties = properties || [];
    }

    if (includeFields.includes('jobs')) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, service_types(*)')
        .eq('customer_id', id)
        .order('scheduled_date', { ascending: false })
        .limit(10);
      data.recent_jobs = jobs || [];
    }

    res.json({ data });
  } catch (error) {
    logger.error('Error fetching customer:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to retrieve customer', 500));
  }
};

/**
 * Update customer information
 */
exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.customer_since;

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Customer not found', 404);
      }
      throw error;
    }

    // Regenerate embedding if significant changes
    try {
      await axios.post(`${process.env.PYTHON_API_URL}/api/ai/embeddings/customer`, {
        customer_id: id
      });
    } catch (embeddingError) {
      logger.warn('Failed to regenerate customer embedding:', embeddingError.message);
    }

    res.json({
      message: 'Customer updated successfully',
      data
    });
  } catch (error) {
    logger.error('Error updating customer:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to update customer', 500));
  }
};

/**
 * Soft delete customer
 */
exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Customer not found', 404);
      }
      throw error;
    }

    res.json({
      message: 'Customer deleted successfully',
      data
    });
  } catch (error) {
    logger.error('Error deleting customer:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to delete customer', 500));
  }
};

/**
 * Get customer properties
 */
exports.getCustomerProperties = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('customer_id', id);

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    logger.error('Error fetching customer properties:', error);
    next(new AppError('Failed to retrieve customer properties', 500));
  }
};

/**
 * Get customer job history
 */
exports.getCustomerJobs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('jobs')
      .select('*, service_types(*), properties(*)', { count: 'exact' })
      .eq('customer_id', id)
      .order('scheduled_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

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
    logger.error('Error fetching customer jobs:', error);
    next(new AppError('Failed to retrieve customer jobs', 500));
  }
};

/**
 * Get customer invoices
 */
exports.getCustomerInvoices = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('customer_id', id)
      .order('issue_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

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
    logger.error('Error fetching customer invoices:', error);
    next(new AppError('Failed to retrieve customer invoices', 500));
  }
};

/**
 * Get customer analytics
 */
exports.getCustomerAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Calculate lifetime value
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, status')
      .eq('customer_id', id);

    const lifetimeValue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);

    // Get job statistics
    const { data: jobs, count: totalJobs } = await supabase
      .from('jobs')
      .select('status, customer_rating', { count: 'exact' })
      .eq('customer_id', id);

    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const avgRating = jobs
      .filter(job => job.customer_rating)
      .reduce((sum, job, _, arr) => sum + job.customer_rating / arr.length, 0);

    // Active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .eq('customer_id', id)
      .eq('status', 'active');

    res.json({
      data: {
        customer_id: id,
        lifetime_value: lifetimeValue.toFixed(2),
        total_jobs: totalJobs,
        completed_jobs: completedJobs,
        average_rating: avgRating.toFixed(2),
        active_subscriptions: activeSubscriptions,
        outstanding_balance: invoices
          .filter(inv => ['sent', 'overdue'].includes(inv.status))
          .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)
          .toFixed(2)
      }
    });
  } catch (error) {
    logger.error('Error calculating customer analytics:', error);
    next(new AppError('Failed to calculate customer analytics', 500));
  }
};
