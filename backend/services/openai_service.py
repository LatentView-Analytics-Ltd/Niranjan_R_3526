"""
Azure OpenAI Service Integration
Handles all interactions with Azure OpenAI GPT-4 API
"""

import os
import json
import logging
from typing import Dict, Any, Optional, Type
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from pydantic import BaseModel
import time

logger = logging.getLogger(__name__)


class OpenAIService:
    """Service for interacting with Azure OpenAI API"""
    
    def __init__(self):
        """Initialize Azure OpenAI client using DefaultAzureCredential (az login)"""
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4")
        self.api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
        
        if not self.endpoint:
            raise ValueError(
                "Azure OpenAI endpoint not configured. "
                "Please set AZURE_OPENAI_ENDPOINT in .env file"
            )
        
        # Use DefaultAzureCredential — picks up az login, managed identity, etc.
        credential = DefaultAzureCredential()
        token_provider = get_bearer_token_provider(
            credential, "https://cognitiveservices.azure.com/.default"
        )
        
        self.client = AzureOpenAI(
            azure_endpoint=self.endpoint,
            azure_ad_token_provider=token_provider,
            api_version=self.api_version,
        )
        
        logger.info(f"OpenAI Service initialized with deployment: {self.deployment_name} (using DefaultAzureCredential)")
    
    def _make_request_with_retry(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        response_format: Optional[Dict[str, Any]] = None,
        max_retries: int = 3,
    ) -> str:
        """
        Make request to Azure OpenAI with exponential backoff retry logic
        
        Args:
            messages: List of message dicts with role and content
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            response_format: Optional response format (e.g., {"type": "json_object"})
            max_retries: Maximum number of retry attempts
            
        Returns:
            Response content as string
        """
        for attempt in range(max_retries):
            try:
                kwargs = {
                    "model": self.deployment_name,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
                
                if response_format:
                    kwargs["response_format"] = response_format
                
                response = self.client.chat.completions.create(**kwargs)
                
                content = response.choices[0].message.content
                
                # Check if content is None or empty
                if content is None:
                    logger.warning("Received None content from OpenAI. Response may have been filtered or empty.")
                    # Check if there was a finish_reason that explains why
                    finish_reason = response.choices[0].finish_reason
                    logger.warning(f"Finish reason: {finish_reason}")
                    if finish_reason == "content_filter":
                        raise ValueError("Response was filtered by content policy")
                    elif finish_reason == "length":
                        raise ValueError("Response was cut off due to max_tokens limit")
                    else:
                        raise ValueError(f"Empty response from model (finish_reason: {finish_reason})")
                
                logger.info(
                    f"OpenAI request successful. "
                    f"Tokens used: {response.usage.total_tokens}"
                )
                
                return content
                
            except Exception as e:
                logger.error(f"OpenAI request failed (attempt {attempt + 1}/{max_retries}): {str(e)}")
                
                if attempt < max_retries - 1:
                    # Exponential backoff: 2^attempt seconds
                    wait_time = 2 ** attempt
                    logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    logger.error("Max retries reached. Request failed.")
                    raise
    
    def generate_completion(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.7,
        max_tokens: int = 4000,
    ) -> str:
        """
        Generate a text completion
        
        Args:
            system_prompt: System instruction for the model
            user_message: User input/query
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            
        Returns:
            Generated text response
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]
        
        return self._make_request_with_retry(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    
    def generate_structured_completion(
        self,
        system_prompt: str,
        user_message: str,
        response_model: Type[BaseModel],
        temperature: float = 0.7,
        max_tokens: int = 4000,
    ) -> BaseModel:
        """
        Generate a structured completion using JSON mode
        
        Args:
            system_prompt: System instruction (should mention JSON output)
            user_message: User input/query
            response_model: Pydantic model to parse response into
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            
        Returns:
            Parsed Pydantic model instance
        """
        # Ensure system prompt mentions JSON
        if "json" not in system_prompt.lower():
            system_prompt += "\n\nProvide your response in valid JSON format."
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]
        
        # Use JSON mode
        response_text = self._make_request_with_retry(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        
        # Check if response_text is None or empty
        if not response_text:
            logger.error("Received empty or None response from OpenAI")
            raise ValueError("Empty response from model")
        
        response_data = None
        try:
            # Parse JSON response
            response_data = json.loads(response_text)
            
            # Normalize channel_type values if present
            response_data = self._normalize_channel_types(response_data)
            
            # Validate and create Pydantic model
            return response_model(**response_data)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            logger.error(f"Response text: {response_text}")
            raise ValueError(f"Invalid JSON response from model: {str(e)}")
        except Exception as e:
            logger.error(f"Failed to create model from response: {str(e)}")
            if response_data is not None:
                logger.error(f"Response data: {response_data}")
            else:
                logger.error(f"Response text: {response_text}")
            raise ValueError(f"Response doesn't match expected schema: {str(e)}")
    
    # Mapping of common LLM-generated channel types to valid enum values
    CHANNEL_TYPE_MAP = {
        "linkedin_ads": "linkedin",
        "linkedin_sponsored": "linkedin",
        "linkedin_inmail": "linkedin",
        "facebook_ads": "facebook",
        "instagram_ads": "instagram",
        "instagram_reels": "instagram",
        "twitter_ads": "twitter",
        "google_ads": "paid_search",
        "google_search": "paid_search",
        "google_search_ads": "paid_search",
        "sem": "paid_search",
        "ppc": "paid_search",
        "search_ads": "paid_search",
        "email_nurture": "email",
        "email_marketing": "email",
        "email_drip": "email",
        "email_sequence": "email",
        "webinar": "event",
        "virtual_event": "event",
        "conference": "event",
        "tiktok": "other",
        "tiktok_ads": "other",
        "youtube": "other",
        "youtube_ads": "other",
        "display_ads": "other",
        "programmatic": "other",
        "referral": "other",
        "referral_program": "other",
        "app_store": "other",
        "app_store_ads": "other",
        "influencer": "other",
        "influencer_marketing": "other",
        "content_marketing": "other",
        "blog": "other",
        "podcast": "other",
        "direct_mail": "other",
        "sales": "sales_outreach",
        "sales_email": "sales_outreach",
        "outbound": "sales_outreach",
        "sdr_outreach": "sales_outreach",
        "push": "push_notification",
        "loyalty_push": "push_notification",
        "loyalty_program": "push_notification",
        "landing": "landing_page",
        "web": "landing_page",
        "website": "landing_page",
    }

    def _normalize_channel_types(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize channel_type values to valid enum values"""
        valid_types = {
            "email", "linkedin", "facebook", "instagram", "twitter",
            "paid_search", "landing_page", "sms", "push_notification",
            "event", "sales_outreach", "other",
        }
        if "channels" in data and isinstance(data["channels"], list):
            for channel in data["channels"]:
                if isinstance(channel, dict) and "channel_type" in channel:
                    ct = channel["channel_type"].lower().strip()
                    if ct not in valid_types:
                        mapped = self.CHANNEL_TYPE_MAP.get(ct, "other")
                        logger.info(f"Normalized channel_type '{ct}' -> '{mapped}'")
                        channel["channel_type"] = mapped
        return data

    def generate_with_schema(
        self,
        system_prompt: str,
        user_message: str,
        json_schema: Dict[str, Any],
        temperature: float = 0.7,
        max_tokens: int = 4000,
    ) -> Dict[str, Any]:
        """
        Generate completion with explicit JSON schema
        
        Args:
            system_prompt: System instruction
            user_message: User input/query
            json_schema: JSON schema for response structure
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            
        Returns:
            Parsed JSON response as dictionary
        """
        # Add schema to system prompt
        full_system_prompt = f"{system_prompt}\n\nProvide your response following this JSON schema:\n{json.dumps(json_schema, indent=2)}"
        
        messages = [
            {"role": "system", "content": full_system_prompt},
            {"role": "user", "content": user_message},
        ]
        
        response_text = self._make_request_with_retry(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            raise ValueError(f"Invalid JSON response from model: {str(e)}")


# Singleton instance
_openai_service: Optional[OpenAIService] = None


def get_openai_service() -> OpenAIService:
    """Get or create OpenAI service singleton instance"""
    global _openai_service
    if _openai_service is None:
        _openai_service = OpenAIService()
    return _openai_service
