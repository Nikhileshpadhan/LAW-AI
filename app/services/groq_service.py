import os
import json
import re
import logging
from typing import Dict, Any, List, Optional
from groq import Groq

from app.config import settings

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
        self.client: Optional[Groq] = None
        if self.api_key:
            self.client = Groq(api_key=self.api_key, max_retries=0)

    def is_configured(self) -> bool:
        return bool(self.client and self.api_key)

    def generate_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        response_format: Optional[Dict[str, str]] = None,
        max_tokens: int = 4096,
        model: Optional[str] = None
    ) -> str:
        """
        Executes chat completion with Groq using the exact specified model (default: openai/gpt-oss-120b).
        Cascades resiliently to tertiary and quaternary models if rate limits occur.
        """
        if not self.client:
            raise ValueError(
                "GROQ_API_KEY is not configured. Please set GROQ_API_KEY in your .env file or environment."
            )

        target_model = model or settings.GROQ_MODEL or "openai/gpt-oss-120b"
        models_to_try = [target_model]
        if settings.GROQ_FALLBACK_MODEL and settings.GROQ_FALLBACK_MODEL not in models_to_try:
            models_to_try.append(settings.GROQ_FALLBACK_MODEL)
        
        # Resilient tertiary & quaternary fallbacks available on Groq
        for fallback in ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]:
            if fallback not in models_to_try:
                models_to_try.append(fallback)

        last_error = None
        for m in models_to_try:
            try:
                logger.info(f"Executing Groq completion using model: {m}")
                kwargs = {
                    "model": m,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                if response_format:
                    kwargs["response_format"] = response_format

                response = self.client.chat.completions.create(**kwargs)
                content = response.choices[0].message.content
                if content:
                    return content
            except Exception as e:
                logger.warning(f"Groq API call failed with model '{m}': {e}.")
                last_error = e

        raise RuntimeError(f"Groq model call failed for model '{target_model}'. Error: {last_error}")

    @staticmethod
    def extract_json(raw_text: str) -> Dict[str, Any]:
        """
        Extracts and parses JSON object from an LLM response string,
        handling markdown code fences if present.
        """
        text = raw_text.strip()
        # Remove markdown codeblocks if wrapped
        if "```json" in text:
            match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
            if match:
                text = match.group(1).strip()
        elif "```" in text:
            match = re.search(r'```\s*(.*?)\s*```', text, re.DOTALL)
            if match:
                text = match.group(1).strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Attempt to find the first '{' and last '}'
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1 and end > start:
                return json.loads(text[start:end+1])
            raise ValueError(f"Could not parse valid JSON from LLM output:\n{raw_text[:400]}...")
