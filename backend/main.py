"""
FastAPI Application for Campaign Management AI Agent
"""

import logging
import sys
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
from pydantic import BaseModel as PydanticBaseModel

from models.schemas import (
    AnalyzeBriefRequest,
    GeneratePlanRequest,
    ValidatePlanRequest,
    CheckConsistencyRequest,
    FixPlanRequest,
    ClarifyingQuestionsResponse,
    ExecutionPlan,
    QAReport,
    ConsistencyReport,
    ErrorResponse,
)
from services import (
    get_brief_analyzer_service,
    get_plan_generator_service,
    get_qa_validator_service,
    get_consistency_checker_service,
    get_openai_service,
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("Starting Campaign Management AI Agent API")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    
    # Initialize services (this will validate Azure OpenAI credentials)
    try:
        get_brief_analyzer_service()
        get_plan_generator_service()
        get_qa_validator_service()
        logger.info("All services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize services: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Campaign Management AI Agent API")


# Create FastAPI app
app = FastAPI(
    title="Campaign Management AI Agent",
    description="AI-powered campaign brief analysis, plan generation, and QA validation",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "code": "HTTP_ERROR"}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "An internal server error occurred",
            "detail": str(exc),
            "code": "INTERNAL_ERROR"
        }
    )


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Campaign Management AI Agent",
        "version": "1.0.0"
    }


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint"""
    return {
        "message": "Campaign Management AI Agent API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# ============================================================================
# CAMPAIGN MANAGEMENT ENDPOINTS
# ============================================================================

@app.post(
    "/api/analyze-brief",
    response_model=ClarifyingQuestionsResponse,
    tags=["Campaign Management"],
    summary="Analyze campaign brief and generate clarifying questions",
    description="Analyzes a campaign brief to identify gaps and ambiguities, then generates specific clarifying questions to help create a complete execution plan."
)
async def analyze_brief(request: AnalyzeBriefRequest):
    """
    Analyze a campaign brief and generate clarifying questions
    
    Args:
        request: AnalyzeBriefRequest containing the campaign brief
        
    Returns:
        ClarifyingQuestionsResponse with questions and gap analysis
        
    Raises:
        HTTPException: If analysis fails
    """
    try:
        logger.info(f"Received brief analysis request for: {request.brief.campaign_name}")
        
        analyzer = get_brief_analyzer_service()
        result = analyzer.analyze_brief(request.brief)
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in brief analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error analyzing brief: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze brief: {str(e)}"
        )


@app.post(
    "/api/generate-plan",
    response_model=ExecutionPlan,
    tags=["Campaign Management"],
    summary="Generate campaign execution plan",
    description="Generates a detailed, structured campaign execution plan from a brief and clarifying answers. Includes channels, timeline, budget, copy guidelines, and success metrics."
)
async def generate_plan(request: GeneratePlanRequest):
    """
    Generate a campaign execution plan
    
    Args:
        request: GeneratePlanRequest with brief and clarifying answers
        
    Returns:
        ExecutionPlan with complete campaign details
        
    Raises:
        HTTPException: If plan generation fails
    """
    try:
        logger.info(f"Received plan generation request for: {request.brief.campaign_name}")
        logger.info(f"With {len(request.answers)} clarifying answers")
        
        generator = get_plan_generator_service()
        result = generator.generate_plan(request.brief, request.answers)
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in plan generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating plan: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate plan: {str(e)}"
        )


@app.post(
    "/api/validate-plan",
    response_model=QAReport,
    tags=["Campaign Management"],
    summary="Validate execution plan against brief",
    description="Performs QA validation by comparing the execution plan against the original brief. Identifies misalignments, gaps, and provides recommendations before launch."
)
async def validate_plan(request: ValidatePlanRequest):
    """
    Validate execution plan against campaign brief
    
    Args:
        request: ValidatePlanRequest with brief and plan
        
    Returns:
        QAReport with misalignments, strengths, and recommendations
        
    Raises:
        HTTPException: If validation fails
    """
    try:
        logger.info(f"Received plan validation request for: {request.brief.campaign_name}")
        
        validator = get_qa_validator_service()
        result = validator.validate_plan(request.brief, request.plan)
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in plan QA: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error validating plan: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate plan: {str(e)}"
        )


@app.post(
    "/api/check-consistency",
    response_model=ConsistencyReport,
    tags=["Campaign Management"],
    summary="Check cross-channel messaging consistency",
    description="Analyzes an execution plan to check whether messaging, CTAs, and tone are consistent across all channels."
)
async def check_consistency(request: CheckConsistencyRequest):
    """
    Check cross-channel consistency in execution plan

    Args:
        request: CheckConsistencyRequest with plan

    Returns:
        ConsistencyReport with pairwise comparisons and score
    """
    try:
        logger.info(f"Received consistency check request for: {request.plan.campaign_name}")

        checker = get_consistency_checker_service()
        result = checker.check_consistency(request.plan)

        return result

    except ValueError as e:
        logger.error(f"Validation error in consistency check: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error checking consistency: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check consistency: {str(e)}"
        )


@app.post(
    "/api/fix-plan",
    response_model=ExecutionPlan,
    tags=["Campaign Management"],
    summary="Fix execution plan based on QA findings",
    description="Takes an existing plan and a list of fixes from the QA report, and regenerates a revised plan with the fixes applied."
)
async def fix_plan(request: FixPlanRequest):
    """
    Fix execution plan based on QA report findings

    Args:
        request: FixPlanRequest with brief, plan, and fixes

    Returns:
        Revised ExecutionPlan with fixes applied
    """
    try:
        logger.info(f"Received fix-plan request for: {request.brief.campaign_name} with {len(request.fixes)} fixes")

        generator = get_plan_generator_service()
        result = generator.fix_plan(request.brief, request.plan, request.fixes)

        return result

    except ValueError as e:
        logger.error(f"Validation error in fix-plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error fixing plan: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fix plan: {str(e)}"
        )


# ============================================================================
# SMART FILL ENDPOINT
# ============================================================================

SMART_FILL_SYSTEM_PROMPT = """You are an expert marketing strategist. The user will provide a free-form description of their campaign idea. Your job is to extract structured campaign brief fields from their text.

Extract the following fields. If a field is not mentioned or cannot be inferred, use an empty string "".

Return ONLY a valid JSON object with these exact keys:
{
  "campaign_name": "A short descriptive name for the campaign",
  "business_objective": "What the business is trying to achieve (quantified if possible)",
  "target_audience": "Who they are trying to reach (roles, demographics, industries)",
  "key_message": "The single thing they want the audience to believe or do",
  "channels": "Marketing channels to use (email, LinkedIn, social, paid search, etc.)",
  "budget": "Budget information if mentioned, otherwise empty string",
  "timeline": "Timeline, deadlines, launch dates if mentioned",
  "success_metrics": "How they will measure success (KPIs, conversion targets, etc.)",
  "constraints": "Any restrictions, brand guidelines, legal requirements, things to avoid"
}

Rules:
- Be concise but capture the user's intent fully
- Infer reasonable values when the user implies something without stating it explicitly
- If the user mentions numbers/percentages, preserve them exactly
- Do NOT invent information that is not implied by the text
- Return valid JSON only, no markdown, no explanation
"""


class SmartFillRequest(PydanticBaseModel):
    text: str


@app.post(
    "/api/smart-fill",
    tags=["Campaign Management"],
    summary="Smart-fill brief fields from free-form text",
    description="Takes free-form campaign description and uses AI to extract structured brief fields."
)
async def smart_fill(request: SmartFillRequest):
    """
    Parse free-form text into structured campaign brief fields using LLM.
    """
    try:
        if not request.text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text cannot be empty"
            )

        logger.info(f"Smart-fill request: {len(request.text)} chars")

        openai_service = get_openai_service()
        response_text = openai_service.generate_completion(
            system_prompt=SMART_FILL_SYSTEM_PROMPT,
            user_message=request.text,
            temperature=0.3,
            max_tokens=2000,
        )

        # Strip markdown code fences if present
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

        brief_data = json.loads(cleaned)

        # Ensure all expected keys exist
        for key in ["campaign_name", "business_objective", "target_audience",
                     "key_message", "channels", "budget", "timeline",
                     "success_metrics", "constraints"]:
            if key not in brief_data:
                brief_data[key] = ""

        return brief_data

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse smart-fill response as JSON: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI returned an invalid response. Please try rephrasing your description."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in smart-fill: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process smart-fill: {str(e)}"
        )


# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
