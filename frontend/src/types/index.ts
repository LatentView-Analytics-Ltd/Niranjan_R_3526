/**
 * TypeScript type definitions matching backend Pydantic schemas
 */

export type QuestionPriority = 'critical' | 'high' | 'medium' | 'low';
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ChannelType = 'email' | 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'paid_search' | 'landing_page' | 'sms' | 'push_notification' | 'event' | 'sales_outreach' | 'other';

export interface CampaignBrief {
  campaign_name: string;
  business_objective: string;
  target_audience: string;
  key_message: string;
  channels: string;
  budget?: string;
  timeline: string;
  success_metrics: string;
  constraints?: string;
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  context: string;
  priority: QuestionPriority;
  options: string[];
  field_related: string;
}

export interface ClarifyingQuestionsResponse {
  questions: ClarifyingQuestion[];
  gaps_identified: string[];
  ready_to_plan: boolean;
}

export interface QuestionAnswer {
  question_id: string;
  answer: string;
}

export interface ChannelSpecification {
  channel_type: ChannelType;
  platform_details?: string;
  target_audience_segment: string;
  content_format: string;
  copy_guidance: string;
  frequency?: string;
  budget_allocated?: string;
  success_metrics: string[];
  owner?: string;
}

export interface Milestone {
  date: string;
  description: string;
  deliverables: string[];
  dependencies?: string[];
  owner?: string;
}

export interface BudgetBreakdown {
  total_budget?: string;
  channel_allocations: Record<string, string>;
  production_costs?: string;
  contingency?: string;
  notes?: string;
}

export interface CopyGuideline {
  audience_segment: string;
  tone: string;
  key_points: string[];
  prohibited_terms?: string[];
  call_to_action: string;
  examples?: string[];
}

export interface ExecutionPlan {
  campaign_name: string;
  executive_summary: string;
  channels: ChannelSpecification[];
  timeline: Milestone[];
  budget: BudgetBreakdown;
  copy_guidelines: CopyGuideline[];
  success_metrics: string[];
  verification_checklist: string[];
  assumptions_made: string[];
}

export interface Misalignment {
  id: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  brief_reference: string;
  plan_reference: string;
  impact: string;
  suggested_fix?: string;
  category: string;
}

export interface QAReport {
  overall_alignment_score: number;
  summary: string;
  misalignments: Misalignment[];
  strengths: string[];
  critical_issues_count: number;
  high_issues_count: number;
  medium_issues_count: number;
  low_issues_count: number;
  ready_to_launch: boolean;
  recommendations: string[];
}

export interface ErrorResponse {
  error: string;
  detail?: string;
  code?: string;
}

// Consistency Check types
export type ConsistencyStatus = 'aligned' | 'adapted' | 'divergent';
export type ConsistencyDimension = 'key_message' | 'cta' | 'tone';

export interface ConsistencyPair {
  channel_a: string;
  channel_b: string;
  dimension: ConsistencyDimension;
  status: ConsistencyStatus;
  explanation: string;
  suggested_fix?: string;
}

export interface ConsistencyReport {
  overall_consistency_score: number;
  summary: string;
  pairs: ConsistencyPair[];
  aligned_count: number;
  adapted_count: number;
  divergent_count: number;
  recommendations: string[];
}

// Version history
export interface PlanVersion {
  version: number;
  plan: ExecutionPlan;
  qaReport?: QAReport;
  consistencyReport?: ConsistencyReport;
  timestamp: string;
}

export type WorkflowStep = 'brief' | 'questions' | 'plan' | 'qa';

export interface CampaignSession {
  id: string;
  name: string;
  createdAt: string;
  step: WorkflowStep;
  brief: CampaignBrief | null;
  questionsData: ClarifyingQuestionsResponse | null;
  answers: QuestionAnswer[];
  plan: ExecutionPlan | null;
  qaReport: QAReport | null;
  consistencyReport?: ConsistencyReport | null;
  planVersions?: PlanVersion[];
}
