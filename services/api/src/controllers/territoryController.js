/**
 * TERRITORY CONTROLLER
 *
 * Manage territories, prospects, and neighborhood-based lead generation
 */

const { supabase } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const axios = require('axios');

/**
 * Get territory overview with coverage stats
 */
exports.getTerritoryOverview = async (req, res, next) => {
  try {
    const { territory_id } = req.query;

    // Get territory details
    const { data: territory, error: territoryError } = await supabase
      .from('territories')
      .select('*')
      .eq('id', territory_id)
      .eq('is_active', true)
      .single();

    if (territoryError) throw territoryError;

    // Get prospect stats
    const { data: prospects, error: prospectsError } = await supabase
      .from('prospects')
      .select('contact_status, priority_score, estimated_home_value')
      .eq('territory_id', territory_id);

    if (prospectsError) throw prospectsError;

    // Calculate stats
    const stats = {
      total_prospects: prospects.length,
      never_contacted: prospects.filter(p => p.contact_status === 'never_contacted').length,
      contacted: prospects.filter(p => ['contacted', 'interested', 'quoted'].includes(p.contact_status)).length,
      customers: prospects.filter(p => p.contact_status === 'customer').length,
      not_interested: prospects.filter(p => p.contact_status === 'not_interested').length,
      competitor: prospects.filter(p => p.contact_status === 'competitor').length,
      avg_priority_score: prospects.length > 0
        ? (prospects.reduce((sum, p) => sum + parseFloat(p.priority_score || 0), 0) / prospects.length).toFixed(2)
        : 0,
      total_home_value: prospects.reduce((sum, p) => sum + parseFloat(p.estimated_home_value || 0), 0).toFixed(2),
      coverage_percent: prospects.length > 0
        ? ((prospects.filter(p => p.contact_status !== 'never_contacted').length / prospects.length) * 100).toFixed(2)
        : 0
    };

    // Get neighborhood breakdown
    const { data: neighborhoods, error: neighborhoodsError } = await supabase
      .from('neighborhoods')
      .select('id, name, customer_count')
      .eq('territory_id', territory_id);

    if (neighborhoodsError) throw neighborhoodsError;

    // Get prospect count per neighborhood
    for (let neighborhood of neighborhoods) {
      const { data: neighborhoodProspects } = await supabase
        .rpc('get_neighborhood_coverage', { p_neighborhood_id: neighborhood.id });

      neighborhood.prospects = neighborhoodProspects[0] || {};
    }

    res.json({
      territory,
      stats,
      neighborhoods
    });
  } catch (error) {
    logger.error('Error fetching territory overview:', error);
    next(new AppError('Failed to fetch territory overview', 500));
  }
};

/**
 * List all prospects in territory with filters
 */
exports.listProspects = async (req, res, next) => {
  try {
    const {
      territory_id,
      neighborhood_id,
      contact_status,
      assigned_to,
      min_priority_score,
      page = 1,
      limit = 50,
      sortBy = 'priority_score',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('prospects')
      .select('*, neighborhood:neighborhoods(name, soil_type, usda_hardiness_zone)', { count: 'exact' });

    if (territory_id) {
      query = query.eq('territory_id', territory_id);
    }

    if (neighborhood_id) {
      query = query.eq('neighborhood_id', neighborhood_id);
    }

    if (contact_status) {
      query = query.eq('contact_status', contact_status);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (min_priority_score) {
      query = query.gte('priority_score', min_priority_score);
    }

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
    logger.error('Error listing prospects:', error);
    next(new AppError('Failed to retrieve prospects', 500));
  }
};

/**
 * Bulk import prospects from CSV/data source
 */
exports.bulkImportProspects = async (req, res, next) => {
  try {
    const { territory_id, prospects } = req.body;

    if (!territory_id || !Array.isArray(prospects) || prospects.length === 0) {
      throw new AppError('territory_id and prospects array required', 400);
    }

    // Prepare prospects with territory association
    const preparedProspects = prospects.map(prospect => ({
      ...prospect,
      territory_id,
      contact_status: 'never_contacted',
      data_source: prospect.data_source || 'bulk_import',
      created_at: new Date().toISOString()
    }));

    // Insert prospects
    const { data, error } = await supabase
      .from('prospects')
      .insert(preparedProspects)
      .select();

    if (error) throw error;

    // Trigger AI priority scoring (async)
    axios.post(`${process.env.PYTHON_API_URL}/api/prospects/batch-score`, {
      prospect_ids: data.map(p => p.id)
    })
      .catch(err => logger.warn('Failed to batch score prospects:', err.message));

    res.status(201).json({
      message: `Successfully imported ${data.length} prospects. AI scoring in progress...`,
      data: {
        imported_count: data.length,
        prospect_ids: data.map(p => p.id)
      }
    });
  } catch (error) {
    logger.error('Error bulk importing prospects:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to import prospects', 500));
  }
};

/**
 * Update prospect contact status
 */
exports.updateProspectStatus = async (req, res, next) => {
  try {
    const { prospect_id } = req.params;
    const { contact_status, notes, contacted_by } = req.body;

    // Update prospect
    const { data: prospect, error: updateError } = await supabase
      .from('prospects')
      .update({
        contact_status,
        last_contact_date: new Date().toISOString(),
        contact_attempts: supabase.rpc('increment', { field: 'contact_attempts' })
      })
      .eq('id', prospect_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log contact
    await supabase
      .from('prospect_contacts')
      .insert({
        prospect_id,
        contact_type: 'status_update',
        contacted_by: contacted_by || 'system',
        outcome: contact_status,
        notes
      });

    res.json({
      message: 'Prospect status updated',
      data: prospect
    });
  } catch (error) {
    logger.error('Error updating prospect status:', error);
    next(new AppError('Failed to update prospect status', 500));
  }
};

/**
 * Convert prospect to lead
 */
exports.convertProspectToLead = async (req, res, next) => {
  try {
    const { prospect_id } = req.params;
    const { services_interested, notes } = req.body;

    // Get prospect data
    const { data: prospect, error: prospectError } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospect_id)
      .single();

    if (prospectError || !prospect) {
      throw new AppError('Prospect not found', 404);
    }

    // Create lead from prospect
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        email: prospect.owner_name ? `${prospect.owner_name.replace(/\s+/g, '').toLowerCase()}@placeholder.com` : null,
        first_name: prospect.owner_name?.split(' ')[0] || 'Unknown',
        last_name: prospect.owner_name?.split(' ').slice(1).join(' ') || 'Owner',
        source: 'door_to_door',
        property_address: {
          street: prospect.street_address,
          city: prospect.city,
          state: prospect.state,
          zip: prospect.zip_code
        },
        property_size_sqft: prospect.lot_size_sqft,
        services_interested,
        notes: notes || `Converted from prospect in ${prospect.city}`,
        assigned_to: prospect.assigned_to
      })
      .select()
      .single();

    if (leadError) throw leadError;

    // Update prospect
    await supabase
      .from('prospects')
      .update({
        contact_status: 'interested',
        converted_to_lead_id: lead.id,
        converted_at: new Date().toISOString()
      })
      .eq('id', prospect_id);

    res.json({
      message: 'Prospect converted to lead',
      data: {
        lead,
        prospect_id
      }
    });
  } catch (error) {
    logger.error('Error converting prospect to lead:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to convert prospect', 500));
  }
};

/**
 * Get neighborhood recommendations
 */
exports.getNeighborhoodRecommendations = async (req, res, next) => {
  try {
    const { neighborhood_id } = req.params;
    const { season, month, category } = req.query;

    let query = supabase
      .from('neighborhood_recommendations')
      .select('*')
      .eq('neighborhood_id', neighborhood_id)
      .order('priority', { ascending: true });

    if (season) {
      query = query.eq('season', season);
    }

    if (month) {
      query = query.eq('month', parseInt(month));
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    logger.error('Error fetching neighborhood recommendations:', error);
    next(new AppError('Failed to fetch recommendations', 500));
  }
};

/**
 * Generate AI neighborhood recommendations
 */
exports.generateNeighborhoodRecommendations = async (req, res, next) => {
  try {
    const { neighborhood_id } = req.params;
    const { season } = req.body;

    // Get neighborhood details
    const { data: neighborhood, error: neighborhoodError } = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('id', neighborhood_id)
      .single();

    if (neighborhoodError || !neighborhood) {
      throw new AppError('Neighborhood not found', 404);
    }

    // Call AI service to generate recommendations
    const response = await axios.post(
      `${process.env.PYTHON_API_URL}/api/neighborhoods/generate-recommendations`,
      {
        neighborhood_id,
        neighborhood_data: neighborhood,
        season
      }
    );

    // Store recommendations
    const recommendations = response.data.recommendations || [];
    if (recommendations.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('neighborhood_recommendations')
        .insert(recommendations.map(rec => ({
          ...rec,
          neighborhood_id,
          generated_by: 'ai',
          ai_model: response.data.model || 'gpt-4'
        })))
        .select();

      if (insertError) throw insertError;

      res.json({
        message: `Generated ${inserted.length} recommendations`,
        data: inserted
      });
    } else {
      res.json({
        message: 'No recommendations generated',
        data: []
      });
    }
  } catch (error) {
    logger.error('Error generating neighborhood recommendations:', error);
    if (error.response) {
      return next(new AppError(`AI service error: ${error.response.data.detail}`, 500));
    }
    next(new AppError('Failed to generate recommendations', 500));
  }
};

/**
 * Get neighborhood heat map data (contact coverage)
 */
exports.getNeighborhoodHeatMap = async (req, res, next) => {
  try {
    const { territory_id } = req.query;

    const { data: neighborhoods, error } = await supabase
      .from('neighborhoods')
      .select('id, name, boundary, center_point')
      .eq('territory_id', territory_id);

    if (error) throw error;

    // Get coverage stats for each neighborhood
    const heatMapData = [];
    for (let neighborhood of neighborhoods) {
      const { data: coverage } = await supabase
        .rpc('get_neighborhood_coverage', { p_neighborhood_id: neighborhood.id });

      heatMapData.push({
        neighborhood_id: neighborhood.id,
        neighborhood_name: neighborhood.name,
        location: neighborhood.center_point,
        ...coverage[0]
      });
    }

    res.json({ data: heatMapData });
  } catch (error) {
    logger.error('Error fetching heat map data:', error);
    next(new AppError('Failed to fetch heat map data', 500));
  }
};
