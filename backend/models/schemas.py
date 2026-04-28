"""
Pydantic models for Campaign Management AI Agent
Defines data structures for briefs, plans, questions, and QA reports
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


# ============================================================================
# ENUMS
# ============================================================================

class QuestionPriority(str, Enum):
    """Priority levels for clarifying questions"""
    CRITICAL = "critical"  # Blocks plan generation
    HIGH = "high"          # Important for quality
    MEDIUM = "medium"      # Nice to have
    LOW = "low"            # Optional refinement


class IssueSeverity(str, Enum):
    """Severity levels for QA misalignments"""
    CRITICAL = "critical"  # Legal/compliance issues
    HIGH = "high"          # Deliverable gaps
    MEDIUM = "medium"      # Optimization opportunities
    LOW = "low"            # Minor improvements


class ChannelType(str, Enum):
    """Marketing channel types"""
    EMAIL = "email"
    LINKEDIN = "linkedin"
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    TWITTER = "twitter"
    PAID_SEARCH = "paid_search"
    LANDING_PAGE = "landing_page"
    SMS = "sms"
    PUSH_NOTIFICATION = "push_notification"
    EVENT = "event"
    SALES_OUTREACH = "sales_outreach"
    OTHER = "other"


# ============================================================================
# CAMPAIGN BRIEF MODELS
# ============================================================================

class CampaignBrief(BaseModel):
    """Input campaign brief from user"""
    campaign_name: str = Field(..., description="Descriptive name for internal reference")
    business_objective: str = Field(..., description="What the business is trying to achieve")
    target_audience: str = Field(..., description="Who we're trying to reach")
    key_message: str = Field(..., description="The single thing we want the audience to believe")
    channels: str = Field(..., description="List of channels to use (may be incomplete)")
    budget: Optional[str] = Field(None, description="Rough total or per-channel allocation")
    timeline: str = Field(..., description="Target launch date and milestone anchors")
    success_metrics: str = Field(..., description="How we'll know it worked")
    constraints: Optional[str] = Field(None, description="Mandatory inclusions, exclusions, tone guidelines")

    class Config:
        json_schema_extra = {
            "example": {
                "campaign_name": "Q3 Enterprise Trial-to-Paid Push",
                "business_objective": "Convert 200 enterprise trial accounts to paid contracts",
                "target_audience": "VP of Operations, Director of Revenue Operations at 1000+ employee companies",
                "key_message": "Stop using last week's data to make today's decisions",
                "channels": "Email, LinkedIn, social",
                "budget": "Not specified",
                "timeline": "Campaign live by July 1, assets locked by June 20",
                "success_metrics": "Trial-to-paid conversion rate from 14% to 22%",
                "constraints": "Do not reference competitors by name"
            }
        }


# ============================================================================
# CLARIFYING QUESTIONS MODELS
# ============================================================================

class ClarifyingQuestion(BaseModel):
    """A specific question to resolve ambiguity in the brief"""
    id: str = Field(..., description="Unique identifier for the question")
    question: str = Field(..., description="The specific question to ask")
    context: str = Field(..., description="Why this question matters")
    priority: QuestionPriority = Field(..., description="How critical is this answer")
    options: List[str] = Field(default_factory=list, description="Answer options for multiple-choice. Provide 2-4 options for most questions. Leave empty only for questions requiring free-text.")
    field_related: str = Field(..., description="Which brief field this relates to")


class ClarifyingQuestionsResponse(BaseModel):
    """Response containing all clarifying questions"""
    questions: List[ClarifyingQuestion] = Field(..., description="List of questions to ask user")
    gaps_identified: List[str] = Field(..., description="Summary of gaps found in brief")
    ready_to_plan: bool = Field(..., description="Whether brief has enough info to attempt planning")


class QuestionAnswer(BaseModel):
    """User's answer to a clarifying question"""
    question_id: str = Field(..., description="ID of the question being answered")
    answer: str = Field(..., description="User's answer")


class AnswersSubmission(BaseModel):
    """Collection of answers to clarifying questions"""
    brief: CampaignBrief = Field(..., description="Original campaign brief")
    answers: List[QuestionAnswer] = Field(..., description="Answers to clarifying questions")


# ============================================================================
# EXECUTION PLAN MODELS
# ============================================================================

class ChannelSpecification(BaseModel):
    """Detailed specification for a marketing channel"""
    channel_type: ChannelType = Field(..., description="Type of marketing channel")
    platform_details: Optional[str] = Field(None, description="Specific platform (e.g., 'LinkedIn Sponsored Content')")
    target_audience_segment: str = Field(..., description="Which audience segment for this channel")
    content_format: str = Field(..., description="Content format (e.g., 'carousel post', 'email newsletter')")
    copy_guidance: str = Field(..., description="Writing guidelines for this channel")
    frequency: Optional[str] = Field(None, description="Posting/sending frequency")
    budget_allocated: Optional[str] = Field(None, description="Budget for this channel")
    success_metrics: List[str] = Field(default_factory=list, description="Channel-specific KPIs")
    owner: Optional[str] = Field(None, description="Team/person responsible")


class Milestone(BaseModel):
    """Timeline milestone with deliverables"""
    date: str = Field(..., description="Milestone date (ISO format or relative)")
    description: str = Field(..., description="What needs to be completed")
    deliverables: List[str] = Field(..., description="Specific deliverables due")
    dependencies: Optional[List[str]] = Field(None, description="What must be done before this")
    owner: Optional[str] = Field(None, description="Who is responsible")


class BudgetBreakdown(BaseModel):
    """Budget allocation details"""
    total_budget: Optional[str] = Field(None, description="Total campaign budget")
    channel_allocations: Dict[str, str] = Field(default_factory=dict, description="Budget per channel")
    production_costs: Optional[str] = Field(None, description="Creative production costs")
    contingency: Optional[str] = Field(None, description="Contingency/buffer amount")
    notes: Optional[str] = Field(None, description="Budget assumptions and notes")


class CopyGuideline(BaseModel):
    """Copy writing guidelines for specific audience/channel"""
    audience_segment: str = Field(..., description="Target audience for this guideline")
    tone: str = Field(..., description="Tone of voice to use")
    key_points: List[str] = Field(..., description="Key messages to include")
    prohibited_terms: Optional[List[str]] = Field(None, description="Terms to avoid")
    call_to_action: str = Field(..., description="Primary CTA to use")
    examples: Optional[List[str]] = Field(None, description="Example phrases or messaging")


class ExecutionPlan(BaseModel):
    """Complete campaign execution plan"""
    campaign_name: str = Field(..., description="Campaign name from brief")
    executive_summary: str = Field(..., description="High-level overview of the plan")
    channels: List[ChannelSpecification] = Field(..., description="Detailed channel specifications")
    timeline: List[Milestone] = Field(..., description="Week-by-week milestones")
    budget: BudgetBreakdown = Field(..., description="Budget allocation breakdown")
    copy_guidelines: List[CopyGuideline] = Field(..., description="Copy guidance per audience")
    success_metrics: List[str] = Field(..., description="How we'll measure success")
    verification_checklist: List[str] = Field(..., description="Pre-launch verification steps")
    assumptions_made: List[str] = Field(..., description="Assumptions in the plan")


# ============================================================================
# QA VALIDATION MODELS
# ============================================================================

class Misalignment(BaseModel):
    """A specific misalignment between brief and plan"""
    id: str = Field(..., description="Unique identifier")
    severity: IssueSeverity = Field(..., description="How critical is this issue")
    title: str = Field(..., description="Brief title of the issue")
    description: str = Field(..., description="Detailed explanation of the misalignment")
    brief_reference: str = Field(..., description="What the brief says")
    plan_reference: str = Field(..., description="What the plan says")
    impact: str = Field(..., description="Why this matters")
    suggested_fix: Optional[str] = Field(None, description="How to resolve this")
    category: str = Field(..., description="Type of issue (e.g., 'audience', 'budget', 'timeline')")


class QAReport(BaseModel):
    """QA validation report comparing brief and plan"""
    overall_alignment_score: float = Field(..., ge=0, le=100, description="Alignment score 0-100")
    summary: str = Field(..., description="Executive summary of QA findings")
    misalignments: List[Misalignment] = Field(..., description="List of issues found")
    strengths: List[str] = Field(..., description="What the plan does well")
    critical_issues_count: int = Field(..., description="Number of critical issues")
    high_issues_count: int = Field(..., description="Number of high severity issues")
    medium_issues_count: int = Field(..., description="Number of medium severity issues")
    low_issues_count: int = Field(..., description="Number of low severity issues")
    ready_to_launch: bool = Field(..., description="Whether plan can proceed to execution")
    recommendations: List[str] = Field(..., description="Overall recommendations")


# ============================================================================
# CONSISTENCY CHECK MODELS
# ============================================================================

class ConsistencyStatus(str, Enum):
    """Status of consistency between two channels"""
    ALIGNED = "aligned"
    ADAPTED = "adapted"       # Intentional channel-appropriate variation
    DIVERGENT = "divergent"   # Problematic inconsistency

class ConsistencyDimension(str, Enum):
    """Dimensions to check consistency across"""
    KEY_MESSAGE = "key_message"
    CTA = "cta"
    TONE = "tone"

class ConsistencyPair(BaseModel):
    """Consistency comparison between two channels on a specific dimension"""
    channel_a: str = Field(..., description="First channel name")
    channel_b: str = Field(..., description="Second channel name")
    dimension: ConsistencyDimension = Field(..., description="What dimension is being compared")
    status: ConsistencyStatus = Field(..., description="Alignment status")
    explanation: str = Field(..., description="Why this status was assigned")
    suggested_fix: Optional[str] = Field(None, description="How to fix if divergent")

class ConsistencyReport(BaseModel):
    """Report on cross-channel consistency"""
    overall_consistency_score: float = Field(..., ge=0, le=100, description="Consistency score 0-100")
    summary: str = Field(..., description="Overview of consistency findings")
    pairs: List[ConsistencyPair] = Field(..., description="Pairwise channel comparisons")
    aligned_count: int = Field(..., description="Number of aligned pairs")
    adapted_count: int = Field(..., description="Number of adapted pairs")
    divergent_count: int = Field(..., description="Number of divergent pairs")
    recommendations: List[str] = Field(..., description="Recommendations for improving consistency")


# ============================================================================
# API REQUEST/RESPONSE MODELS
# ============================================================================

class AnalyzeBriefRequest(BaseModel):
    """Request to analyze a campaign brief"""
    brief: CampaignBrief


class GeneratePlanRequest(BaseModel):
    """Request to generate execution plan"""
    brief: CampaignBrief
    answers: List[QuestionAnswer]


class ValidatePlanRequest(BaseModel):
    """Request to validate plan against brief"""
    brief: CampaignBrief
    plan: ExecutionPlan


class CheckConsistencyRequest(BaseModel):
    """Request to check cross-channel consistency"""
    plan: ExecutionPlan


class FixPlanRequest(BaseModel):
    """Request to fix a plan based on QA findings"""
    brief: CampaignBrief
    plan: ExecutionPlan
    fixes: List[str] = Field(..., description="List of fixes to apply from QA report")


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Additional error details")
    code: Optional[str] = Field(None, description="Error code")
