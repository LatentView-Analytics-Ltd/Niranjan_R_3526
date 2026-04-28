"""
Consistency Checker Service
Checks cross-channel messaging consistency in execution plans
"""

import logging
from pathlib import Path

from models.schemas import ExecutionPlan, ConsistencyReport
from services.openai_service import get_openai_service

logger = logging.getLogger(__name__)


class ConsistencyCheckerService:
    """Service for checking cross-channel consistency in campaign plans"""

    def __init__(self):
        """Initialize service with OpenAI client and system prompt"""
        self.openai_service = get_openai_service()

        prompt_path = Path(__file__).parent.parent / "prompts" / "consistency_checker_system.txt"
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()

        logger.info("ConsistencyCheckerService initialized")

    def check_consistency(self, plan: ExecutionPlan) -> ConsistencyReport:
        """
        Check cross-channel consistency in an execution plan

        Args:
            plan: The execution plan to analyze

        Returns:
            ConsistencyReport with pairwise comparisons and score
        """
        logger.info(f"Checking consistency for: {plan.campaign_name} ({len(plan.channels)} channels)")

        user_message = self._format_plan_for_consistency(plan)

        report = self.openai_service.generate_structured_completion(
            system_prompt=self.system_prompt,
            user_message=user_message,
            response_model=ConsistencyReport,
            temperature=0.5,
            max_tokens=4000,
        )

        logger.info(
            f"Consistency check complete. Score: {report.overall_consistency_score}, "
            f"Aligned: {report.aligned_count}, Adapted: {report.adapted_count}, "
            f"Divergent: {report.divergent_count}"
        )

        return report

    def _format_plan_for_consistency(self, plan: ExecutionPlan) -> str:
        """Format execution plan channels for consistency analysis"""

        channels_text = ""
        for i, ch in enumerate(plan.channels, 1):
            channels_text += f"\n--- CHANNEL {i}: {ch.channel_type.value.upper()} ---\n"
            if ch.platform_details:
                channels_text += f"Platform: {ch.platform_details}\n"
            channels_text += f"Target Audience: {ch.target_audience_segment}\n"
            channels_text += f"Content Format: {ch.content_format}\n"
            channels_text += f"Copy Guidance: {ch.copy_guidance}\n"
            if ch.frequency:
                channels_text += f"Frequency: {ch.frequency}\n"

        copy_guidelines_text = ""
        for cg in plan.copy_guidelines:
            copy_guidelines_text += f"\n--- Copy for: {cg.audience_segment} ---\n"
            copy_guidelines_text += f"Tone: {cg.tone}\n"
            copy_guidelines_text += f"Key Points: {', '.join(cg.key_points)}\n"
            copy_guidelines_text += f"CTA: {cg.call_to_action}\n"
            if cg.prohibited_terms:
                copy_guidelines_text += f"Avoid: {', '.join(cg.prohibited_terms)}\n"
            if cg.examples:
                copy_guidelines_text += f"Examples: {', '.join(cg.examples)}\n"

        return f"""
Analyze the cross-channel consistency of this campaign execution plan:

CAMPAIGN: {plan.campaign_name}

EXECUTIVE SUMMARY:
{plan.executive_summary}

CHANNELS:
{channels_text}

COPY GUIDELINES:
{copy_guidelines_text}

---

Compare every unique pair of channels across the three dimensions (key_message, cta, tone).
Identify which pairs are aligned, which are appropriately adapted, and which are problematically divergent.
""".strip()


# Singleton instance
_consistency_checker_service = None


def get_consistency_checker_service() -> ConsistencyCheckerService:
    """Get or create ConsistencyCheckerService singleton instance"""
    global _consistency_checker_service
    if _consistency_checker_service is None:
        _consistency_checker_service = ConsistencyCheckerService()
    return _consistency_checker_service
