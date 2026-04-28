"""
QA Validator Service
Validates execution plans against campaign briefs to identify misalignments
"""

import logging
from pathlib import Path

from models.schemas import CampaignBrief, ExecutionPlan, QAReport
from services.openai_service import get_openai_service

logger = logging.getLogger(__name__)


class QAValidatorService:
    """Service for validating campaign plans against briefs"""
    
    def __init__(self):
        """Initialize service with OpenAI client and system prompt"""
        self.openai_service = get_openai_service()
        
        # Load system prompt
        prompt_path = Path(__file__).parent.parent / "prompts" / "qa_validator_system.txt"
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()
        
        logger.info("QAValidatorService initialized")
    
    def validate_plan(self, brief: CampaignBrief, plan: ExecutionPlan) -> QAReport:
        """
        Validate execution plan against campaign brief
        
        Args:
            brief: Original campaign brief
            plan: Generated execution plan
            
        Returns:
            QAReport with misalignments, strengths, and recommendations
        """
        logger.info(f"Validating plan for: {brief.campaign_name}")
        
        # Format brief and plan for comparison
        user_message = self._format_brief_and_plan(brief, plan)
        
        # Generate QA report
        report = self.openai_service.generate_structured_completion(
            system_prompt=self.system_prompt,
            user_message=user_message,
            response_model=QAReport,
            temperature=0.6,  # Lower temperature for more consistent validation
            max_tokens=4000,
        )
        
        logger.info(
            f"QA validation complete. Score: {report.overall_alignment_score}/100. "
            f"Issues: {report.critical_issues_count} critical, "
            f"{report.high_issues_count} high, "
            f"{report.medium_issues_count} medium, "
            f"{report.low_issues_count} low. "
            f"Ready to launch: {report.ready_to_launch}"
        )
        
        return report
    
    def _format_brief_and_plan(self, brief: CampaignBrief, plan: ExecutionPlan) -> str:
        """Format brief and plan for QA validation"""
        
        # Format channels for readability
        channels_text = ""
        for i, channel in enumerate(plan.channels, 1):
            channels_text += f"\n  {i}. {channel.channel_type.value}"
            if channel.platform_details:
                channels_text += f" - {channel.platform_details}"
            channels_text += f"\n     Audience: {channel.target_audience_segment}"
            channels_text += f"\n     Format: {channel.content_format}"
            if channel.budget_allocated:
                channels_text += f"\n     Budget: {channel.budget_allocated}"
        
        # Format timeline for readability
        timeline_text = ""
        for milestone in plan.timeline[:5]:  # Show first 5 milestones
            timeline_text += f"\n  - {milestone.date}: {milestone.description}"
        if len(plan.timeline) > 5:
            timeline_text += f"\n  - ... ({len(plan.timeline) - 5} more milestones)"
        
        return f"""
Compare the following campaign brief with its execution plan and identify misalignments:

=== CAMPAIGN BRIEF ===

CAMPAIGN NAME: {brief.campaign_name}

BUSINESS OBJECTIVE:
{brief.business_objective}

TARGET AUDIENCE:
{brief.target_audience}

KEY MESSAGE:
{brief.key_message}

CHANNELS (from brief):
{brief.channels}

BUDGET (from brief):
{brief.budget or "Not specified"}

TIMELINE (from brief):
{brief.timeline}

SUCCESS METRICS (from brief):
{brief.success_metrics}

CONSTRAINTS (from brief):
{brief.constraints or "None specified"}

=== EXECUTION PLAN ===

EXECUTIVE SUMMARY:
{plan.executive_summary}

CHANNELS (in plan):
{channels_text}

TIMELINE (in plan):
{timeline_text}

BUDGET (in plan):
Total: {plan.budget.total_budget or "Not specified"}
Allocations: {', '.join(f"{k}: {v}" for k, v in plan.budget.channel_allocations.items())}

SUCCESS METRICS (in plan):
{chr(10).join(f"- {metric}" for metric in plan.success_metrics)}

COPY GUIDELINES:
{len(plan.copy_guidelines)} audience segments defined

ASSUMPTIONS MADE:
{chr(10).join(f"- {assumption}" for assumption in plan.assumptions_made)}

---

Validate that the execution plan:
1. Delivers the business objective stated in the brief
2. Targets the audience specified in the brief
3. Uses the channels mentioned in the brief (and doesn't omit any)
4. Respects budget constraints (if specified)
5. Meets timeline requirements
6. Measures the success metrics from the brief
7. Follows any constraints or brand notes

Identify misalignments with severity levels (critical, high, medium, low) and provide specific, actionable fixes.
""".strip()


# Singleton instance
_qa_validator_service = None


def get_qa_validator_service() -> QAValidatorService:
    """Get or create QAValidatorService singleton instance"""
    global _qa_validator_service
    if _qa_validator_service is None:
        _qa_validator_service = QAValidatorService()
    return _qa_validator_service
