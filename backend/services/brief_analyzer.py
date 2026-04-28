"""
Brief Analyzer Service
Analyzes campaign briefs to identify gaps and generate clarifying questions
"""

import os
import logging
from typing import List
from pathlib import Path

from models.schemas import CampaignBrief, ClarifyingQuestionsResponse
from services.openai_service import get_openai_service

logger = logging.getLogger(__name__)


class BriefAnalyzerService:
    """Service for analyzing campaign briefs and generating clarifying questions"""
    
    def __init__(self):
        """Initialize service with OpenAI client and system prompt"""
        self.openai_service = get_openai_service()
        
        # Load system prompt
        prompt_path = Path(__file__).parent.parent / "prompts" / "brief_analyzer_system.txt"
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()
        
        logger.info("BriefAnalyzerService initialized")
    
    def analyze_brief(self, brief: CampaignBrief) -> ClarifyingQuestionsResponse:
        """
        Analyze a campaign brief and generate clarifying questions
        
        Args:
            brief: Campaign brief to analyze
            
        Returns:
            ClarifyingQuestionsResponse with questions and gap analysis
        """
        logger.info(f"Analyzing brief: {brief.campaign_name}")
        
        # Format brief as readable text
        user_message = self._format_brief_for_analysis(brief)
        
        # Generate structured response
        response = self.openai_service.generate_structured_completion(
            system_prompt=self.system_prompt,
            user_message=user_message,
            response_model=ClarifyingQuestionsResponse,
            temperature=0.7,
            max_tokens=3000,
        )
        
        logger.info(
            f"Brief analysis complete. Generated {len(response.questions)} questions. "
            f"Ready to plan: {response.ready_to_plan}"
        )
        
        return response
    
    def _format_brief_for_analysis(self, brief: CampaignBrief) -> str:
        """Format campaign brief as structured text for analysis"""
        return f"""
Analyze the following campaign brief and identify gaps or ambiguities:

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
{brief.budget or "Not specified"}

TIMELINE:
{brief.timeline}

SUCCESS METRICS:
{brief.success_metrics}

CONSTRAINTS / BRAND NOTES:
{brief.constraints or "None specified"}

---

Identify what information is missing, unclear, or under-specified. Generate specific, actionable questions that would help create a complete execution plan.
""".strip()


# Singleton instance
_brief_analyzer_service = None


def get_brief_analyzer_service() -> BriefAnalyzerService:
    """Get or create BriefAnalyzerService singleton instance"""
    global _brief_analyzer_service
    if _brief_analyzer_service is None:
        _brief_analyzer_service = BriefAnalyzerService()
    return _brief_analyzer_service
