"""
Plan Generator Service
Generates structured campaign execution plans from briefs and clarifying answers
"""

import logging
import json
from typing import List
from pathlib import Path

from models.schemas import CampaignBrief, QuestionAnswer, ExecutionPlan
from services.openai_service import get_openai_service

logger = logging.getLogger(__name__)


class PlanGeneratorService:
    """Service for generating campaign execution plans"""
    
    def __init__(self):
        """Initialize service with OpenAI client and system prompt"""
        self.openai_service = get_openai_service()
        
        # Load system prompt
        prompt_path = Path(__file__).parent.parent / "prompts" / "plan_generator_system.txt"
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()
        
        logger.info("PlanGeneratorService initialized")
    
    def generate_plan(
        self,
        brief: CampaignBrief,
        answers: List[QuestionAnswer]
    ) -> ExecutionPlan:
        """
        Generate a structured execution plan from brief and clarifying answers
        
        Args:
            brief: Original campaign brief
            answers: Answers to clarifying questions
            
        Returns:
            ExecutionPlan with complete campaign details
        """
        logger.info(f"Generating plan for: {brief.campaign_name}")
        
        # Format brief and answers for plan generation
        user_message = self._format_brief_and_answers(brief, answers)
        
        # Generate structured execution plan
        plan = self.openai_service.generate_structured_completion(
            system_prompt=self.system_prompt,
            user_message=user_message,
            response_model=ExecutionPlan,
            temperature=0.7,
            max_tokens=4000,
        )
        
        logger.info(
            f"Plan generation complete. "
            f"Channels: {len(plan.channels)}, "
            f"Milestones: {len(plan.timeline)}"
        )
        
        return plan
    
    def _format_brief_and_answers(
        self,
        brief: CampaignBrief,
        answers: List[QuestionAnswer]
    ) -> str:
        """Format campaign brief and answers as structured text"""
        
        # Format answers section
        answers_text = ""
        if answers:
            answers_text = "\n\nCLARIFYING INFORMATION PROVIDED:\n"
            for answer in answers:
                answers_text += f"- {answer.question_id}: {answer.answer}\n"
        
        return f"""
Generate a detailed, executable campaign plan based on the following information:

CAMPAIGN NAME: {brief.campaign_name}

BUSINESS OBJECTIVE:
{brief.business_objective}

TARGET AUDIENCE:
{brief.target_audience}

KEY MESSAGE:
{brief.key_message}

CHANNELS:
{brief.channels}

BUDGET:
{brief.budget or "Not specified - provide reasonable estimates with assumptions"}

TIMELINE:
{brief.timeline}

SUCCESS METRICS:
{brief.success_metrics}

CONSTRAINTS / BRAND NOTES:
{brief.constraints or "None specified"}
{answers_text}

---

Create a complete, structured execution plan with:
1. Executive summary
2. Detailed channel specifications (with platform details, audience segments, content formats, copy guidance)
3. Week-by-week timeline with milestones
4. Budget breakdown
5. Copy guidelines for each audience segment
6. Success metrics (both leading and lagging indicators)
7. Pre-launch verification checklist
8. Document any assumptions made

Make the plan specific enough that a campaign team can execute from it without additional clarification meetings.
""".strip()

    def fix_plan(
        self,
        brief: CampaignBrief,
        plan: ExecutionPlan,
        fixes: List[str]
    ) -> ExecutionPlan:
        """
        Fix an existing plan based on QA findings

        Args:
            brief: Original campaign brief
            plan: Current execution plan with issues
            fixes: List of fixes to apply from QA report

        Returns:
            Revised ExecutionPlan with fixes applied
        """
        logger.info(f"Fixing plan for: {brief.campaign_name} with {len(fixes)} fixes")

        user_message = self._format_fix_request(brief, plan, fixes)

        fixed_plan = self.openai_service.generate_structured_completion(
            system_prompt=self.system_prompt + "\n\nIMPORTANT: You are revising an EXISTING plan. Apply the required fixes while preserving everything else that was correct. Do not remove channels, milestones, or details that were already good.",
            user_message=user_message,
            response_model=ExecutionPlan,
            temperature=0.5,
            max_tokens=4000,
        )

        logger.info(
            f"Plan fix complete. "
            f"Channels: {len(fixed_plan.channels)}, "
            f"Milestones: {len(fixed_plan.timeline)}"
        )

        return fixed_plan

    def _format_fix_request(
        self,
        brief: CampaignBrief,
        plan: ExecutionPlan,
        fixes: List[str]
    ) -> str:
        """Format a fix request with the original brief, current plan, and required fixes"""

        fixes_text = "\n".join(f"  {i+1}. {fix}" for i, fix in enumerate(fixes))

        plan_json = json.dumps(plan.model_dump(), indent=2, default=str)

        return f"""
You are revising an existing campaign execution plan. The QA validation found issues that need to be fixed.

ORIGINAL BRIEF:
- Campaign: {brief.campaign_name}
- Objective: {brief.business_objective}
- Audience: {brief.target_audience}
- Key Message: {brief.key_message}
- Channels: {brief.channels}
- Budget: {brief.budget or "Not specified"}
- Timeline: {brief.timeline}
- Metrics: {brief.success_metrics}
- Constraints: {brief.constraints or "None"}

CURRENT PLAN (to be revised):
{plan_json}

REQUIRED FIXES (from QA validation):
{fixes_text}

---

Generate a REVISED execution plan that:
1. Applies ALL the required fixes listed above
2. Preserves everything from the current plan that was correct
3. Maintains consistency across all channels after fixes
4. Keeps the same structure and level of detail

Do NOT remove existing good content. Only modify what the fixes require.
""".strip()


# Singleton instance
_plan_generator_service = None


def get_plan_generator_service() -> PlanGeneratorService:
    """Get or create PlanGeneratorService singleton instance"""
    global _plan_generator_service
    if _plan_generator_service is None:
        _plan_generator_service = PlanGeneratorService()
    return _plan_generator_service
