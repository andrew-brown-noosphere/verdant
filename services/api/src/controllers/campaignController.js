/**
 * CAMPAIGN CONTROLLER
 *
 * Business logic for managing ad campaigns, creatives, and performance tracking
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// =====================================================
// CAMPAIGNS
// =====================================================

exports.getCampaigns = async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('ad_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const campaignData = req.body;

    const { data, error } = await supabase
      .from('ad_campaigns')
      .insert([campaignData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('ad_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('ad_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getCampaignPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    // Get all creatives for this campaign
    const { data: creatives, error: creativesError } = await supabase
      .from('ad_creatives')
      .select('id')
      .eq('campaign_id', id);

    if (creativesError) throw creativesError;

    const creativeIds = creatives.map(c => c.id);

    // Get aggregated performance data
    const { data: performance, error: perfError } = await supabase
      .from('ad_performance')
      .select('*')
      .in('creative_id', creativeIds);

    if (perfError) throw perfError;

    // Calculate totals
    const totals = performance.reduce((acc, record) => {
      acc.total_impressions += record.impressions || 0;
      acc.total_clicks += record.clicks || 0;
      acc.total_leads += record.leads_generated || 0;
      acc.total_spend += parseFloat(record.spend || 0);
      return acc;
    }, {
      total_impressions: 0,
      total_clicks: 0,
      total_leads: 0,
      total_spend: 0
    });

    // Calculate averages
    totals.avg_ctr = totals.total_impressions > 0 
      ? totals.total_clicks / totals.total_impressions 
      : 0;
    
    totals.avg_cpa = totals.total_leads > 0 
      ? totals.total_spend / totals.total_leads 
      : 0;

    res.json(totals);
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getNeighborhoodPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    // Get performance by neighborhood
    const { data, error } = await supabase
      .from('ad_performance')
      .select(`
        *,
        ad_creatives!inner (
          neighborhood_id,
          neighborhoods (
            name,
            city,
            state
          )
        )
      `)
      .eq('ad_creatives.campaign_id', id);

    if (error) throw error;

    // Group by neighborhood
    const neighborhoodPerformance = {};
    
    data.forEach(record => {
      const neighborhoodName = record.ad_creatives?.neighborhoods?.name || 'Unknown';
      
      if (!neighborhoodPerformance[neighborhoodName]) {
        neighborhoodPerformance[neighborhoodName] = {
          impressions: 0,
          clicks: 0,
          leads: 0,
          spend: 0
        };
      }

      neighborhoodPerformance[neighborhoodName].impressions += record.impressions || 0;
      neighborhoodPerformance[neighborhoodName].clicks += record.clicks || 0;
      neighborhoodPerformance[neighborhoodName].leads += record.leads_generated || 0;
      neighborhoodPerformance[neighborhoodName].spend += parseFloat(record.spend || 0);
    });

    // Calculate metrics
    Object.keys(neighborhoodPerformance).forEach(neighborhood => {
      const perf = neighborhoodPerformance[neighborhood];
      perf.ctr = perf.impressions > 0 ? (perf.clicks / perf.impressions * 100).toFixed(2) : 0;
      perf.cpa = perf.leads > 0 ? (perf.spend / perf.leads).toFixed(2) : 0;
    });

    res.json(neighborhoodPerformance);
  } catch (error) {
    console.error('Error fetching neighborhood performance:', error);
    res.status(500).json({ error: error.message });
  }
};

// =====================================================
// CREATIVES
// =====================================================

exports.getCampaignCreatives = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const { data, error } = await supabase
      .from('ad_creatives')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching creatives:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getCreative = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('ad_creatives')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching creative:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createCreative = async (req, res) => {
  try {
    const creativeData = req.body;

    const { data, error } = await supabase
      .from('ad_creatives')
      .insert([creativeData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating creative:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateCreative = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('ad_creatives')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating creative:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCreative = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('ad_creatives')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Creative deleted successfully' });
  } catch (error) {
    console.error('Error deleting creative:', error);
    res.status(500).json({ error: error.message });
  }
};

// =====================================================
// PLACEMENTS
// =====================================================

exports.getCreativePlacements = async (req, res) => {
  try {
    const { creativeId } = req.params;

    const { data, error } = await supabase
      .from('ad_placements')
      .select('*')
      .eq('creative_id', creativeId);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching placements:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createPlacement = async (req, res) => {
  try {
    const placementData = req.body;

    const { data, error } = await supabase
      .from('ad_placements')
      .insert([placementData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating placement:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updatePlacement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('ad_placements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating placement:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deletePlacement = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('ad_placements')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Placement deleted successfully' });
  } catch (error) {
    console.error('Error deleting placement:', error);
    res.status(500).json({ error: error.message });
  }
};

// =====================================================
// TARGETING RULES
// =====================================================

exports.getTargetingRules = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('targeting_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching targeting rules:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createTargetingRule = async (req, res) => {
  try {
    const ruleData = req.body;

    const { data, error } = await supabase
      .from('targeting_rules')
      .insert([ruleData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating targeting rule:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateTargetingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('targeting_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating targeting rule:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTargetingRule = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('targeting_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Targeting rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting targeting rule:', error);
    res.status(500).json({ error: error.message });
  }
};

// =====================================================
// A/B TESTS
// =====================================================

exports.getABTests = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching A/B tests:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createABTest = async (req, res) => {
  try {
    const testData = req.body;

    const { data, error } = await supabase
      .from('ab_tests')
      .insert([testData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating A/B test:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getABTestResults = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: test, error: testError } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', id)
      .single();

    if (testError) throw testError;

    // Get performance for control and variants
    const creativeIds = [test.control_creative_id, ...test.variant_creative_ids];

    const { data: performance, error: perfError } = await supabase
      .from('ad_performance')
      .select('*')
      .in('creative_id', creativeIds);

    if (perfError) throw perfError;

    // Aggregate by creative
    const results = {};
    
    performance.forEach(record => {
      const creativeId = record.creative_id;
      if (!results[creativeId]) {
        results[creativeId] = {
          impressions: 0,
          clicks: 0,
          leads: 0,
          spend: 0
        };
      }

      results[creativeId].impressions += record.impressions || 0;
      results[creativeId].clicks += record.clicks || 0;
      results[creativeId].leads += record.leads_generated || 0;
      results[creativeId].spend += parseFloat(record.spend || 0);
    });

    // Calculate metrics
    Object.keys(results).forEach(creativeId => {
      const perf = results[creativeId];
      perf.ctr = perf.impressions > 0 ? (perf.clicks / perf.impressions * 100).toFixed(4) : 0;
      perf.conversion_rate = perf.clicks > 0 ? (perf.leads / perf.clicks * 100).toFixed(4) : 0;
      perf.cpa = perf.leads > 0 ? (perf.spend / perf.leads).toFixed(2) : 0;
    });

    res.json({
      test,
      results
    });
  } catch (error) {
    console.error('Error fetching A/B test results:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.declareABTestWinner = async (req, res) => {
  try {
    const { id } = req.params;
    const { winner_creative_id } = req.body;

    const { data, error } = await supabase
      .from('ab_tests')
      .update({
        winner_creative_id,
        status: 'completed'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error declaring A/B test winner:', error);
    res.status(500).json({ error: error.message });
  }
};

// =====================================================
// PERFORMANCE TRACKING
// =====================================================

exports.getPerformanceMetrics = async (req, res) => {
  try {
    const { creative_id, start_date, end_date } = req.query;

    let query = supabase
      .from('ad_performance')
      .select('*')
      .order('date', { ascending: false });

    if (creative_id) {
      query = query.eq('creative_id', creative_id);
    }

    if (start_date) {
      query = query.gte('date', start_date);
    }

    if (end_date) {
      query = query.lte('date', end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
