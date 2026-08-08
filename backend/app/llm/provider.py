from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, messages: list[dict[str, str]]) -> str:
        ...


class MockLLMProvider(LLMProvider):
    async def generate(self, messages: list[dict[str, str]]) -> str:
        user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        if "feedback" in user.lower() or "evaluate" in user.lower():
            return json.dumps({
                "summary": "Mock evaluation complete.",
                "strengths": ["Clear communication"],
                "gaps": ["Needs more metrics"],
                "next": ["Practice system design"],
            })
        return "Could you elaborate on the implementation details and any metrics you tracked?"


class OpenAICompatibleProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model
        base = settings.llm_base_url or "https://api.openai.com/v1"
        self.base_url = base.rstrip("/")

    async def generate(self, messages: list[dict[str, str]]) -> str:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {"model": self.model, "messages": messages, "temperature": 0.4}
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]


def get_llm_provider() -> LLMProvider:
    if settings.use_mock_llm:
        return MockLLMProvider()
    if settings.llm_provider in ("openai", "groq", "ollama"):
        return OpenAICompatibleProvider()
    return MockLLMProvider()
