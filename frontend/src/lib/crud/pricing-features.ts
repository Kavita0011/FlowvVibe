/**
 * Pricing & Features Management
 * Handles pricing plans, features, and subscription tiers
 */

import { supabase } from '../supabase-client';
import { fetchWithOptions, createRecord, updateRecord, deleteRecord, type QueryOptions } from './query-builder';

export interface SubscriptionTier {
  id: string;
  tier_key: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  currency: string;
  period: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
}

export interface TierFeature {
  id: string;
  tier_id: string;
  feature_id: string;
  is_included: boolean;
  custom_limit: number | null;
}

// ============ SUBSCRIPTION TIERS ============

// Fetch all subscription tiers with features
export async function fetchPricingPlansWithFeatures(activeOnly = true) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  let query = supabase
    .from('subscription_tiers')
    .select('*')
    .order('sort_order', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) return { data: null, error };

  // Transform to usable format
  const plans = (data as any[])?.map(plan => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    interval: plan.interval || 'month',
    features: plan.features?.map((f: any) => f.feature_name) || plan.features_list || [],
    limits: {
      chatbots: plan.max_chatbots,
      conversations: plan.max_conversations,
      messages: plan.max_messages,
      users: plan.max_users
    },
    isPopular: plan.is_popular,
    isActive: plan.is_active,
    createdAt: plan.created_at
  }));

  return { data: plans, error: null };
}

// Get single pricing plan with all features
export async function fetchPricingPlanById(planId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase
    .from('pricing_plans')
    .select('*, features:plan_features(*)')
    .eq('id', planId)
    .single();

  if (error) return { data: null, error };

  const plan = {
    ...(data as any),
    features: (data as any).features?.map((f: any) => f.feature_name) || []
  };

  return { data: plan, error: null };
}

// Create new pricing plan with features
export async function createPricingPlanWithFeatures(
  plan: PricingPlanInsert,
  featureNames: string[]
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  // Start transaction
  const { data: newPlan, error: planError } = await supabase
    .from('pricing_plans')
    .insert(plan)
    .select()
    .single();

  if (planError) return { data: null, error: planError };

  // Add features
  if (featureNames.length > 0) {
    const featureRecords = featureNames.map(name => ({
      plan_id: (newPlan as any).id,
      feature_name: name,
      is_included: true
    }));

    const { error: featuresError } = await supabase
      .from('plan_features')
      .insert(featureRecords);

    if (featuresError) {
      // Rollback - delete the plan
      await supabase.from('pricing_plans').delete().eq('id', (newPlan as any).id);
      return { data: null, error: featuresError };
    }
  }

  return { data: newPlan, error: null };
}

// Update pricing plan and features
export async function updatePricingPlanWithFeatures(
  planId: string,
  updates: PricingPlanUpdate,
  featureNames?: string[]
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  // Update plan
  const { data: updatedPlan, error: planError } = await supabase
    .from('pricing_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .select()
    .single();

  if (planError) return { data: null, error: planError };

  // Update features if provided
  if (featureNames !== undefined) {
    // Delete old features
    await supabase.from('plan_features').delete().eq('plan_id', planId);

    // Add new features
    if (featureNames.length > 0) {
      const featureRecords = featureNames.map(name => ({
        plan_id: planId,
        feature_name: name,
        is_included: true
      }));

      await supabase.from('plan_features').insert(featureRecords);
    }
  }

  return { data: updatedPlan, error: null };
}

// Delete pricing plan (and its features via cascade)
export async function deletePricingPlan(planId: string) {
  return await deleteRecord('pricing_plans', planId);
}

// Toggle plan active status
export async function togglePlanStatus(planId: string, isActive: boolean) {
  return await updateRecord('pricing_plans', planId, {
    is_active: isActive
  });
}

// Set popular plan
export async function setPopularPlan(planId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  // First, unmark all as popular
  await supabase
    .from('pricing_plans')
    .update({ is_popular: false })
    .eq('is_popular', true);

  // Then mark selected as popular
  return await updateRecord('pricing_plans', planId, {
    is_popular: true
  });
}

// ============ FEATURE MANAGEMENT ============

// Note: features table may not exist in schema - using generic types
export type Feature = any;
export type FeatureInsert = any;

// Fetch all available features
export async function fetchAllFeatures() {
  return await fetchWithOptions('features', {
    orderBy: { column: 'category', ascending: true }
  });
}

// Fetch features by category
export async function fetchFeaturesByCategory(category: string) {
  return await fetchWithOptions('features', {
    eq: { category },
    orderBy: { column: 'display_order', ascending: true }
  });
}

// Create new feature
export async function createFeature(feature: FeatureInsert) {
  return await createRecord('features', feature);
}

// Update feature
export async function updateFeature(id: string, updates: Partial<Feature>) {
  return await updateRecord('features', id, updates);
}

// Delete feature
export async function deleteFeature(id: string) {
  return await deleteRecord('features', id);
}

// ============ PLAN FEATURES ASSIGNMENT ============

// Get features for a specific plan
export async function getPlanFeatures(planId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase
    .from('plan_features')
    .select('*, feature:features(*)')
    .eq('plan_id', planId);

  if (error) return { data: null, error };

  return {
    data: (data as any[])?.map(item => item.feature),
    error: null
  };
}

// Assign feature to plan
export async function assignFeatureToPlan(planId: string, featureId: string, isIncluded = true) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase
    .from('plan_features')
    .insert({
      plan_id: planId,
      feature_id: featureId,
      is_included: isIncluded
    })
    .select()
    .single();

  return { data, error };
}

// Remove feature from plan
export async function removeFeatureFromPlan(planId: string, featureId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { error } = await supabase
    .from('plan_features')
    .delete()
    .eq('plan_id', planId)
    .eq('feature_id', featureId);

  return { error };
}

// ============ USER SUBSCRIPTION ============

// Get user's current subscription
export async function getUserSubscription(userId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase
    .from('users')
    .select('subscription_tier, subscription_status, current_period_end, cancel_at_period_end')
    .eq('id', userId)
    .single();

  if (error) return { data: null, error };

  // Get plan details
  const { data: plan } = await fetchPricingPlanById((data as any).subscription_tier);

  return {
    data: {
      ...(data as any),
      plan
    },
    error: null
  };
}

// Upgrade/Downgrade user subscription
export async function updateUserPlan(
  userId: string,
  planId: string,
  status: 'active' | 'cancelled' | 'past_due' = 'active'
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  return await supabase
    .from('users')
    .update({
      subscription_tier: planId,
      subscription_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
}

// Cancel user subscription (at period end)
export async function cancelUserSubscription(userId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  return await supabase
    .from('users')
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
}

// ============ PLAN COMPARISON ============

export interface PlanComparison {
  plans: any[];
  allFeatures: string[];
  featureMatrix: Record<string, Record<string, boolean>>;
}

// Get plan comparison matrix
export async function getPlanComparison(): Promise<{ data: PlanComparison | null; error: any }> {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data: plans, error } = await supabase
    .from('pricing_plans')
    .select('*, features:plan_features(*)')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) return { data: null, error };

  // Get all unique features
  const allFeaturesSet = new Set<string>();
  (plans as any[])?.forEach(plan => {
    plan.features?.forEach((f: any) => {
      allFeaturesSet.add(f.feature_name || f.feature?.name);
    });
  });
  const allFeatures = Array.from(allFeaturesSet);

  // Build feature matrix
  const featureMatrix: Record<string, Record<string, boolean>> = {};
  allFeatures.forEach(feature => {
    featureMatrix[feature] = {};
    (plans as any[])?.forEach(plan => {
      const hasFeature = plan.features?.some((f: any) =>
        (f.feature_name || f.feature?.name) === feature
      );
      featureMatrix[feature][plan.id] = hasFeature;
    });
  });

  return {
    data: {
      plans: plans || [],
      allFeatures,
      featureMatrix
    },
    error: null
  };
}

// ============ USAGE & LIMITS ============

export interface UsageStats {
  chatbotsUsed: number;
  chatbotsLimit: number;
  conversationsUsed: number;
  conversationsLimit: number | null;
  messagesUsed: number;
  messagesLimit: number | null;
  percentUsed: number;
}

// Get user's current usage against their plan limits
export async function getUserUsageStats(userId: string): Promise<{ data: UsageStats | null; error: any }> {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  // Get user's plan
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  if (userError) return { data: null, error: userError };

  // Get plan limits
  const { data: plan } = await supabase
    .from('pricing_plans')
    .select('max_chatbots, max_conversations, max_messages')
    .eq('id', (user as any).subscription_tier)
    .single();

  // Get current usage
  const { count: chatbotsUsed } = await supabase
    .from('chatbots')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: conversationsUsed } = await supabase
    .from('conversations')
    .select('*, chatbots!inner(user_id)', { count: 'exact', head: true })
    .eq('chatbots.user_id', userId);

  const limits = plan as any;
  const chatbots = chatbotsUsed || 0;
  const conversations = conversationsUsed || 0;

  // Calculate percentage used (weighted average)
  const chatbotPercent = limits?.max_chatbots ? (chatbots / limits.max_chatbots) * 100 : 0;
  const percentUsed = Math.min(chatbotPercent, 100);

  return {
    data: {
      chatbotsUsed: chatbots,
      chatbotsLimit: limits?.max_chatbots || 1,
      conversationsUsed: conversations,
      conversationsLimit: limits?.max_conversations || null,
      messagesUsed: 0, // Would need to count messages
      messagesLimit: limits?.max_messages || null,
      percentUsed: Math.round(percentUsed)
    },
    error: null
  };
}
