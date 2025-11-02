/**
 * LEAD PIPELINE CONTROLLER
 *
 * Complete business logic for lead pipeline management:
 * - Pipeline stages
 * - Lead activities (calls, emails, meetings)
 * - Lead assignments
 * - Pipeline analytics
 * - Stage transitions
 */

const { supabase } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const axios = require('axios');

/**
 * Get pipeline overview with lead counts per stage
 */
exports.getPipelineOverview = async (req, res, next) => {
  try {
    const { assigned_to, date_from, date_to } = req.query;

    // Get all active pipeline stages
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('is_active', true)
      .order('stage_order', { ascending: true });

    if (stagesError) throw stagesError;

    // Get lead counts per stage
    let query = supabase
      .from('leads')
      .select('current_stage_id, id, score, estimated_monthly_value', { count: 'exact' });

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) throw leadsError;

    // Group leads by stage
    const stageStats = stages.map(stage => {
      const stageLeads = leads.filter(lead => lead.current_stage_id === stage.id);

      return {
        stage_id: stage.id,
        stage_name: stage.name,
        display_name: stage.display_name,
        stage_order: stage.stage_order,
        color: stage.color,
        is_won: stage.is_won,
        is_lost: stage.is_lost,
        lead_count: stageLeads.length,
        total_value: stageLeads.reduce((sum, lead) =>
          sum + parseFloat(lead.estimated_monthly_value || 0), 0
        ).toFixed(2),
        avg_score: stageLeads.length > 0
          ? (stageLeads.reduce((sum, lead) => sum + parseFloat(lead.score || 0), 0) / stageLeads.length).toFixed(2)
          : 0
      };
    });

    // Calculate pipeline metrics
    const totalLeads = leads.length;
    const wonLeads = leads.filter(l => {
      const stage = stages.find(s => s.id === l.current_stage_id);
      return stage?.is_won;
    }).length;
    const lostLeads = leads.filter(l => {
      const stage = stages.find(s => s.id === l.current_stage_id);
      return stage?.is_lost;
    }).length;
    const activeLeads = totalLeads - wonLeads - lostLeads;

    const conversionRate = totalLeads > 0 ? ((wonLeads / (wonLeads + lostLeads)) * 100).toFixed(2) : 0;

    res.json({
      pipeline: stageStats,
      metrics: {
        total_leads: totalLeads,
        active_leads: activeLeads,
        won_leads: wonLeads,
        lost_leads: lostLeads,
        conversion_rate: conversionRate,
        total_pipeline_value: leads.reduce((sum, lead) =>
          sum + parseFloat(lead.estimated_monthly_value || 0), 0
        ).toFixed(2)
      }
    });
  } catch (error) {
    logger.error('Error fetching pipeline overview:', error);
    next(new AppError('Failed to fetch pipeline overview', 500));
  }
};

/**
 * Move lead to a different pipeline stage
 */
exports.moveLeadToStage = async (req, res, next) => {
  try {
    const { lead_id } = req.params;
    const { to_stage_id, reason, changed_by } = req.body;

    if (!to_stage_id) {
      throw new AppError('to_stage_id is required', 400);
    }

    // Get current lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, current_stage_id')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      throw new AppError('Lead not found', 404);
    }

    // Get stage details
    const { data: toStage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('id', to_stage_id)
      .single();

    if (stageError || !toStage) {
      throw new AppError('Invalid stage', 404);
    }

    const fromStageId = lead.current_stage_id;

    // Calculate duration in previous stage
    let durationHours = null;
    if (fromStageId) {
      const { data: lastHistory } = await supabase
        .from('lead_stage_history')
        .select('created_at')
        .eq('lead_id', lead_id)
        .eq('to_stage_id', fromStageId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastHistory) {
        const duration = Date.now() - new Date(lastHistory.created_at).getTime();
        durationHours = (duration / (1000 * 60 * 60)).toFixed(2);
      }
    }

    // Record stage history
    const { error: historyError } = await supabase
      .from('lead_stage_history')
      .insert({
        lead_id,
        from_stage_id: fromStageId,
        to_stage_id,
        changed_by: changed_by || 'system',
        reason,
        duration_in_previous_stage_hours: durationHours
      });

    if (historyError) throw historyError;

    // Update lead stage and status
    const updateData = {
      current_stage_id: to_stage_id
    };

    // If moving to won/lost stage, update status
    if (toStage.is_won) {
      updateData.status = 'won';
    } else if (toStage.is_lost) {
      updateData.status = 'lost';
    } else if (toStage.stage_order >= 3) {
      // Stages after "qualified" become "qualified" status
      updateData.status = 'qualified';
    } else if (toStage.stage_order >= 2) {
      updateData.status = 'contacted';
    }

    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', lead_id)
      .select('*, current_stage:pipeline_stages(*)')
      .single();

    if (updateError) throw updateError;

    res.json({
      message: `Lead moved to ${toStage.display_name}`,
      data: updatedLead
    });
  } catch (error) {
    logger.error('Error moving lead to stage:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to move lead', 500));
  }
};

/**
 * Add activity to lead (call, email, meeting, note)
 */
exports.addLeadActivity = async (req, res, next) => {
  try {
    const { lead_id } = req.params;
    const {
      activity_type,
      subject,
      description,
      outcome,
      scheduled_at,
      completed_at,
      duration_minutes,
      created_by,
      assigned_to,
      attachments
    } = req.body;

    if (!activity_type) {
      throw new AppError('activity_type is required', 400);
    }

    // Verify lead exists
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      throw new AppError('Lead not found', 404);
    }

    // Create activity
    const { data: activity, error: activityError } = await supabase
      .from('lead_activities')
      .insert({
        lead_id,
        activity_type,
        subject,
        description,
        outcome,
        scheduled_at,
        completed_at: completed_at || (activity_type === 'note' ? new Date().toISOString() : null),
        duration_minutes,
        created_by: created_by || 'system',
        assigned_to,
        attachments
      })
      .select()
      .single();

    if (activityError) throw activityError;

    // Increment contact_attempts if it's a contact activity
    if (['call', 'email', 'sms'].includes(activity_type)) {
      await supabase.rpc('increment', {
        table_name: 'leads',
        row_id: lead_id,
        field_name: 'contact_attempts'
      });

      // Update last_contact_date
      await supabase
        .from('leads')
        .update({ last_contact_date: new Date().toISOString() })
        .eq('id', lead_id);
    }

    res.status(201).json({
      message: 'Activity added successfully',
      data: activity
    });
  } catch (error) {
    logger.error('Error adding lead activity:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to add activity', 500));
  }
};

/**
 * Get all activities for a lead
 */
exports.getLeadActivities = async (req, res, next) => {
  try {
    const { lead_id } = req.params;
    const { activity_type, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('lead_activities')
      .select('*', { count: 'exact' })
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false });

    if (activity_type) {
      query = query.eq('activity_type', activity_type);
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
    logger.error('Error fetching lead activities:', error);
    next(new AppError('Failed to fetch activities', 500));
  }
};

/**
 * Assign lead to a user
 */
exports.assignLead = async (req, res, next) => {
  try {
    const { lead_id } = req.params;
    const { assigned_to, assigned_by, assignment_reason } = req.body;

    if (!assigned_to) {
      throw new AppError('assigned_to is required', 400);
    }

    // End previous assignment
    await supabase
      .from('lead_assignments')
      .update({
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('lead_id', lead_id)
      .eq('is_active', true);

    // Create new assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('lead_assignments')
      .insert({
        lead_id,
        assigned_to,
        assigned_by: assigned_by || 'system',
        assignment_reason,
        is_active: true
      })
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    // Update lead assigned_to field
    const { error: updateError } = await supabase
      .from('leads')
      .update({ assigned_to })
      .eq('id', lead_id);

    if (updateError) throw updateError;

    // Log activity
    await supabase
      .from('lead_activities')
      .insert({
        lead_id,
        activity_type: 'note',
        subject: 'Lead Assigned',
        description: `Lead assigned to ${assigned_to}${assignment_reason ? `: ${assignment_reason}` : ''}`,
        created_by: assigned_by || 'system',
        completed_at: new Date().toISOString()
      });

    res.json({
      message: 'Lead assigned successfully',
      data: assignment
    });
  } catch (error) {
    logger.error('Error assigning lead:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Failed to assign lead', 500));
  }
};

/**
 * Get lead pipeline history
 */
exports.getLeadHistory = async (req, res, next) => {
  try {
    const { lead_id } = req.params;

    const { data, error } = await supabase
      .from('lead_stage_history')
      .select(`
        *,
        from_stage:pipeline_stages!lead_stage_history_from_stage_id_fkey(name, display_name, color),
        to_stage:pipeline_stages!lead_stage_history_to_stage_id_fkey(name, display_name, color)
      `)
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    logger.error('Error fetching lead history:', error);
    next(new AppError('Failed to fetch lead history', 500));
  }
};

/**
 * Get pipeline analytics
 */
exports.getPipelineAnalytics = async (req, res, next) => {
  try {
    const { date_from, date_to, assigned_to } = req.query;

    // Average time in each stage
    let historyQuery = supabase
      .from('lead_stage_history')
      .select('to_stage_id, duration_in_previous_stage_hours, pipeline_stages!lead_stage_history_to_stage_id_fkey(display_name)');

    if (date_from) {
      historyQuery = historyQuery.gte('created_at', date_from);
    }

    const { data: stageHistory, error: historyError } = await historyQuery;

    if (historyError) throw historyError;

    // Group by stage
    const stageMetrics = {};
    stageHistory.forEach(record => {
      const stageId = record.to_stage_id;
      if (!stageMetrics[stageId]) {
        stageMetrics[stageId] = {
          stage_name: record.pipeline_stages?.display_name || 'Unknown',
          durations: []
        };
      }
      if (record.duration_in_previous_stage_hours) {
        stageMetrics[stageId].durations.push(parseFloat(record.duration_in_previous_stage_hours));
      }
    });

    // Calculate averages
    const avgTimePerStage = Object.entries(stageMetrics).map(([stageId, data]) => ({
      stage_id: stageId,
      stage_name: data.stage_name,
      avg_duration_hours: data.durations.length > 0
        ? (data.durations.reduce((a, b) => a + b, 0) / data.durations.length).toFixed(2)
        : 0,
      sample_size: data.durations.length
    }));

    // Conversion rate by source
    let leadsQuery = supabase
      .from('leads')
      .select('source, status');

    if (date_from) {
      leadsQuery = leadsQuery.gte('created_at', date_from);
    }

    if (date_to) {
      leadsQuery = leadsQuery.lte('created_at', date_to);
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) throw leadsError;

    const sourceMetrics = {};
    leads.forEach(lead => {
      if (!sourceMetrics[lead.source]) {
        sourceMetrics[lead.source] = { total: 0, won: 0, lost: 0 };
      }
      sourceMetrics[lead.source].total++;
      if (lead.status === 'won') sourceMetrics[lead.source].won++;
      if (lead.status === 'lost') sourceMetrics[lead.source].lost++;
    });

    const conversionBySource = Object.entries(sourceMetrics).map(([source, data]) => ({
      source,
      total_leads: data.total,
      won_leads: data.won,
      lost_leads: data.lost,
      conversion_rate: data.won + data.lost > 0
        ? ((data.won / (data.won + data.lost)) * 100).toFixed(2)
        : 0
    }));

    res.json({
      avg_time_per_stage: avgTimePerStage,
      conversion_by_source: conversionBySource
    });
  } catch (error) {
    logger.error('Error fetching pipeline analytics:', error);
    next(new AppError('Failed to fetch pipeline analytics', 500));
  }
};

/**
 * Get stale leads (no activity in X days)
 */
exports.getStaleLeads = async (req, res, next) => {
  try {
    const { days = 7, assigned_to } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    let query = supabase
      .from('leads')
      .select('*, current_stage:pipeline_stages(*)')
      .not('status', 'in', '("won","lost")')
      .or(`last_activity_at.lt.${cutoffDate.toISOString()},last_activity_at.is.null`);

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      data,
      count: data.length,
      cutoff_days: parseInt(days),
      cutoff_date: cutoffDate.toISOString()
    });
  } catch (error) {
    logger.error('Error fetching stale leads:', error);
    next(new AppError('Failed to fetch stale leads', 500));
  }
};
