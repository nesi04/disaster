"""
AI damage-assessment assistant. Works with any free, OpenAI-compatible LLM:
Google Gemini (free tier), Groq, OpenRouter free models, or local Ollama.

The assistant sees the uploaded image (if the model supports vision) plus every
model's normalized result and the cross-model comparison, and can *act* through
tools (function calling):

  - get_detections : drill into individual detections
  - rerun_model    : re-run a model with a different confidence threshold
  - set_priority   : assign a response-priority level + recommended actions
                     (logged to outputs/incident_log.jsonl)
  - save_report    : write a markdown assessment report to outputs/reports/

If the chosen model can't read images or call tools, it degrades gracefully
(answers from the numbers only / answers without taking actions).

Configure in backend/.env (see .env.example):
  AI_PROVIDER = gemini | groq | openrouter | ollama | custom
  AI_API_KEY  = key from the provider (not needed for ollama)
  AI_MODEL    = model name (optional; a per-provider default is used)
  AI_BASE_URL = only for AI_PROVIDER=custom (any OpenAI-compatible endpoint)
  AI_VISION   = true/false: send the image to the model (default true)
"""

from __future__ import annotations

import base64
import json
import os
import re
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Tuple

import openai
from PIL import Image

from services.analysis_store import Analysis
from services.comparison import compare_results
from services.model_registry import DAMAGE_CLASSES, MODELS, run_model

# Free-tier presets. Model names change often: if the provider says
# "model not found", set AI_MODEL in backend/.env to a current one.
PROVIDERS: Dict[str, Dict[str, Any]] = {
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "model": "gemini-2.5-flash",
        "needs_key": True,
        "key_url": "https://aistudio.google.com/apikey",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "needs_key": True,
        "key_url": "https://console.groq.com/keys",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "model": "openrouter/free",
        "needs_key": True,
        "key_url": "https://openrouter.ai/keys",
    },
    "ollama": {
        "base_url": "http://localhost:11434/v1",
        "model": "qwen2.5vl",
        "needs_key": False,
        "key_url": None,
    },
    "custom": {"base_url": None, "model": None, "needs_key": False, "key_url": None},
}

PRIORITY_LEVELS = ["P1-critical", "P2-high", "P3-moderate", "P4-low"]
MAX_TOOL_ROUNDS = 8

OUTPUTS_DIR = Path(__file__).resolve().parents[2] / "outputs"
REPORTS_DIR = OUTPUTS_DIR / "reports"
INCIDENT_LOG = OUTPUTS_DIR / "incident_log.jsonl"

_client: openai.OpenAI | None = None


class AssistantError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


# --------------------------------------------------
# Configuration
# --------------------------------------------------

def get_config() -> Dict[str, Any]:
    provider = os.environ.get("AI_PROVIDER", "gemini").strip().lower()
    preset = PROVIDERS.get(provider, PROVIDERS["custom"])
    return {
        "provider": provider,
        "base_url": os.environ.get("AI_BASE_URL") or preset["base_url"],
        "model": os.environ.get("AI_MODEL") or preset["model"],
        "api_key": os.environ.get("AI_API_KEY", "").strip(),
        "needs_key": preset["needs_key"],
        "key_url": preset["key_url"],
        "vision": os.environ.get("AI_VISION", "true").strip().lower() not in ("0", "false", "no"),
    }


def is_configured() -> bool:
    cfg = get_config()
    if not cfg["base_url"] or not cfg["model"]:
        return False
    return bool(cfg["api_key"]) or not cfg["needs_key"]


def status() -> Dict[str, Any]:
    cfg = get_config()
    return {
        "configured": is_configured(),
        "provider": cfg["provider"],
        "model": cfg["model"],
        "vision": cfg["vision"],
        "key_url": cfg["key_url"],
    }


def get_client() -> openai.OpenAI:
    global _client
    if _client is None:
        cfg = get_config()
        if not is_configured():
            hint = f" Get a free key at {cfg['key_url']}" if cfg["key_url"] else ""
            raise AssistantError(
                f"AI assistant is not configured: set AI_API_KEY for provider '{cfg['provider']}' "
                f"in backend/.env and restart the backend.{hint}",
                503,
            )
        _client = openai.OpenAI(
            base_url=cfg["base_url"],
            api_key=cfg["api_key"] or "not-needed",  # local servers ignore the key
            timeout=120,
            max_retries=2,
        )
    return _client


# --------------------------------------------------
# Prompt + tools
# --------------------------------------------------

SYSTEM_PROMPT = """You are the analysis assistant inside Disaster Vision, a tool that \
assesses building damage in post-disaster satellite/aerial imagery. You work alongside \
emergency-response analysts.

## What you receive
At the start of a session you get a JSON summary of every model that ran on the image \
(and the image itself, when available), plus a cross-model comparison. Damage classes follow \
the xBD scale: no-damage, minor-damage, major-damage, destroyed, un-classified.

How to read each model type:
- Detection models (YOLOv8m, later Faster R-CNN) find individual buildings. Their \
`distribution` is the share of detected buildings per class and `counts` are building counts.
- Segmentation models (later Mask R-CNN) are like detection but with pixel masks.
- Classification models (VGG16) give one label for the whole image. Their `distribution` is a \
probability over classes, not a building count.
- `severity_score` is 0 (intact) to 100 (destroyed), weighted over the classified share.
Because classifiers and detectors measure different things, disagreement between them on \
mixed-damage scenes is expected. Explain *why* the models differ rather than just stating that \
they do, and if you can see the image, use it to judge which reading is more plausible.

## Actions you can take (tools)
- get_detections: inspect individual detections (classes, confidences, boxes).
- rerun_model: re-run a model at a different confidence threshold, e.g. when a detector finds \
nothing, or to check whether a finding is robust. This replaces that model's stored result.
- set_priority: assign a response priority with recommended field actions. Use it when the \
user asks for triage, prioritisation or a response plan.
- save_report: save a written assessment the team can download. Use it when the user asks \
for a report or summary to share.
Take actions when they serve the user's request; don't take unrequested actions. \
After acting, say briefly what you did and what changed. Never claim to have done an action \
you didn't actually call a tool for.

## How to answer
- Be concise and concrete: numbers, model names, classes. Short paragraphs or bullets; this \
renders in a narrow chat panel with basic markdown.
- These are model estimates, not ground truth. When the stakes are high (destroyed buildings, \
low model agreement, low confidence), recommend human or field verification.
- If the models' output looks unreliable for this image (no buildings found, very low \
confidence), say so plainly."""


def _tools() -> List[Dict[str, Any]]:
    """Tool definitions in OpenAI function-calling format."""
    tunable = [m.id for m in MODELS.values() if m.available and "confidence" in m.params]
    available = [m.id for m in MODELS.values() if m.available]

    def fn(name: str, description: str, properties: Dict, required: List[str]) -> Dict:
        return {
            "type": "function",
            "function": {
                "name": name,
                "description": description,
                "parameters": {"type": "object", "properties": properties, "required": required},
            },
        }

    return [
        fn(
            "get_detections",
            "List individual detections from a detection/segmentation model for this image, "
            "optionally filtered by damage class and minimum confidence. Returns class, "
            "confidence and bounding box (pixel coords) per detection.",
            {
                "model_id": {"type": "string", "enum": available, "description": "Model to inspect, e.g. 'yolo'."},
                "damage_class": {"type": "string", "enum": ["all"] + DAMAGE_CLASSES, "description": "Class filter, or 'all'."},
                "min_confidence": {"type": "number", "description": "0-1. Use 0 for no filter."},
                "limit": {"type": "integer", "description": "Max detections to return (1-200)."},
            },
            ["model_id"],
        ),
        fn(
            "rerun_model",
            "Re-run a model on this image with a new confidence threshold and update the stored "
            "result and cross-model comparison. Returns the new result and comparison. "
            f"Models that accept a threshold: {', '.join(tunable) or 'none'}.",
            {
                "model_id": {"type": "string", "enum": tunable or available, "description": "Model to re-run."},
                "confidence": {"type": "number", "description": "New confidence threshold, 0.01-0.95."},
            },
            ["model_id", "confidence"],
        ),
        fn(
            "set_priority",
            "Assign a response priority to this site and record recommended field actions. Shown "
            "to the team in the UI and appended to the incident log. Calling it again replaces "
            "the previous priority.",
            {
                "level": {"type": "string", "enum": PRIORITY_LEVELS},
                "reason": {"type": "string", "description": "One or two sentences grounded in the model results."},
                "recommended_actions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Concrete next steps for responders, most urgent first.",
                },
            },
            ["level", "reason", "recommended_actions"],
        ),
        fn(
            "save_report",
            "Save a markdown damage-assessment report for this image so the team can download it. "
            "Write the full report in `markdown`. Returns the download URL.",
            {
                "title": {"type": "string"},
                "markdown": {"type": "string", "description": "Complete report body in markdown."},
            },
            ["title", "markdown"],
        ),
    ]


# --------------------------------------------------
# Context for the first turn
# --------------------------------------------------

def _summary_for_model(analysis: Analysis) -> Dict:
    """Model results without the (possibly long) detection lists."""
    results = {
        mid: {k: v for k, v in r.items() if k not in ("detections", "annotated_image_url")}
        for mid, r in analysis.results.items()
    }
    return {"filename": analysis.filename, "results": results, "comparison": analysis.comparison}


def _image_part(image_bytes: bytes) -> Dict:
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    img.thumbnail((1024, 1024))
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=85)
    data = base64.standard_b64encode(buf.getvalue()).decode("utf-8")
    return {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{data}"}}


# --------------------------------------------------
# Tool execution
# --------------------------------------------------

def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:40] or "report"


def _require(args: Dict, *keys: str) -> None:
    missing = [k for k in keys if args.get(k) in (None, "")]
    if missing:
        raise ValueError(f"Missing required argument(s): {', '.join(missing)}")


def _execute_tool(analysis: Analysis, name: str, args: Dict) -> Tuple[str, Dict]:
    """Run a tool. Returns (result_json_for_the_model, action_record_for_ui)."""
    now = datetime.now(timezone.utc).isoformat()

    if name == "get_detections":
        _require(args, "model_id")
        r = analysis.results.get(args["model_id"])
        if not r or r.get("detections") is None:
            raise ValueError(f"No detections available for model '{args['model_id']}'.")
        dets = r["detections"]
        damage_class = args.get("damage_class") or "all"
        if damage_class != "all":
            dets = [d for d in dets if d["class_name"] == damage_class]
        dets = [d for d in dets if d["confidence"] >= float(args.get("min_confidence") or 0)]
        limit = max(1, min(int(args.get("limit") or 50), 200))
        out = {"total_matching": len(dets), "detections": dets[:limit]}
        action = {"type": "get_detections", "summary": f"Inspected {len(dets)} detections from {r['display_name']}"}
        return json.dumps(out), action

    if name == "rerun_model":
        _require(args, "model_id", "confidence")
        mid = args["model_id"]
        spec = MODELS.get(mid)
        if not spec or not spec.available:
            raise ValueError(f"Model '{mid}' is not available.")
        if "confidence" not in spec.params:
            raise ValueError(f"{spec.display_name} has no confidence threshold to change.")
        conf = min(max(float(args["confidence"]), 0.01), 0.95)
        old = analysis.results.get(mid, {})
        new = run_model(mid, analysis.image_bytes, analysis.filename, confidence=conf)
        if not new.get("success"):
            raise ValueError(new.get("error") or "Re-run failed.")
        analysis.results[mid] = new
        analysis.comparison = compare_results(analysis.results)
        slim = {k: v for k, v in new.items() if k not in ("detections", "annotated_image_url")}
        out = {"new_result": slim, "comparison": analysis.comparison}
        action = {
            "type": "rerun_model",
            "summary": (
                f"Re-ran {spec.display_name} at confidence {conf:.2f} "
                f"({old.get('total_objects', '?')} → {new.get('total_objects')} buildings)"
            ),
        }
        return json.dumps(out), action

    if name == "set_priority":
        _require(args, "level", "reason")
        if args["level"] not in PRIORITY_LEVELS:
            raise ValueError(f"level must be one of {PRIORITY_LEVELS}")
        actions = args.get("recommended_actions") or []
        if isinstance(actions, str):
            actions = [actions]
        priority = {
            "level": args["level"],
            "reason": str(args["reason"]),
            "recommended_actions": [str(a) for a in actions],
            "set_at": now,
        }
        analysis.priority = priority
        OUTPUTS_DIR.mkdir(exist_ok=True)
        with INCIDENT_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps({
                "analysis_id": analysis.id,
                "filename": analysis.filename,
                "consensus_severity": analysis.comparison.get("consensus_severity"),
                **priority,
            }) + "\n")
        action = {"type": "set_priority", "summary": f"Set priority {args['level']}"}
        return json.dumps({"ok": True, "priority": priority}), action

    if name == "save_report":
        _require(args, "title", "markdown")
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        fname = f"{analysis.id}_{_slug(args['title'])}.md"
        (REPORTS_DIR / fname).write_text(str(args["markdown"]), encoding="utf-8")
        report = {"title": args["title"], "url": f"/outputs/reports/{fname}", "created_at": now}
        analysis.reports.append(report)
        action = {"type": "save_report", "summary": f"Saved report “{args['title']}”", "url": report["url"]}
        return json.dumps({"ok": True, "url": report["url"]}), action

    raise ValueError(f"Unknown tool '{name}'.")


# --------------------------------------------------
# Chat turn
# --------------------------------------------------

def chat(analysis: Analysis, user_message: str) -> Dict:
    """Run one assistant turn (may include several tool calls). Thread-safe per analysis."""
    with analysis.lock:
        checkpoint = len(analysis.messages)
        try:
            return _chat_locked(analysis, user_message)
        except Exception:
            # Roll the conversation back so a failed turn leaves no dangling tool calls
            del analysis.messages[checkpoint:]
            raise


def _call_model(use_tools: bool, messages: List[Dict]):
    cfg = get_config()
    client = get_client()
    kwargs: Dict[str, Any] = {
        "model": cfg["model"],
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        "max_tokens": 4096,
    }
    if use_tools:
        kwargs["tools"] = _tools()
        kwargs["tool_choice"] = "auto"
    try:
        return client.chat.completions.create(**kwargs)
    except openai.AuthenticationError:
        raise AssistantError(f"The {cfg['provider']} API key was rejected. Check AI_API_KEY in backend/.env.", 503)
    except openai.PermissionDeniedError:
        raise AssistantError(f"The API key has no access to model '{cfg['model']}'.", 503)
    except openai.NotFoundError:
        raise AssistantError(
            f"Model '{cfg['model']}' was not found at {cfg['provider']}. "
            "Set AI_MODEL in backend/.env to a current model name.",
            503,
        )
    except openai.RateLimitError:
        raise AssistantError("Free-tier rate limit reached. Wait a minute and try again.", 429)
    except openai.BadRequestError:
        raise  # the caller may retry without the image or tools
    except openai.APIStatusError as e:
        raise AssistantError(f"AI provider error ({e.status_code}). Try again shortly.", 502)
    except openai.APIConnectionError:
        hint = " Is Ollama running?" if cfg["provider"] == "ollama" else ""
        raise AssistantError(f"Could not reach the AI provider at {cfg['base_url']}.{hint}", 502)


def _strip_images(messages: List[Dict]) -> bool:
    """Drop image parts (for models without vision). Returns True if anything was removed."""
    removed = False
    for m in messages:
        content = m.get("content")
        if isinstance(content, list) and any(p.get("type") == "image_url" for p in content):
            m["content"] = [p for p in content if p.get("type") != "image_url"]
            removed = True
    return removed


def _chat_locked(analysis: Analysis, user_message: str) -> Dict:
    cfg = get_config()
    if not analysis.messages:
        content: List[Dict] = []
        if cfg["vision"]:
            content.append(_image_part(analysis.image_bytes))
        content.append({
            "type": "text",
            "text": "<analysis>\n" + json.dumps(_summary_for_model(analysis), indent=1) + "\n</analysis>",
        })
        content.append({"type": "text", "text": user_message})
    else:
        content = [{"type": "text", "text": user_message}]
    analysis.messages.append({"role": "user", "content": content})

    turn_actions: List[Dict] = []
    text_parts: List[str] = []
    notes: List[str] = []

    rounds = 0
    while rounds < MAX_TOOL_ROUNDS:
        try:
            response = _call_model(not analysis.tools_disabled, analysis.messages)
        except openai.BadRequestError as e:
            # Some free models can't take images or tools: degrade gracefully, once each.
            if _strip_images(analysis.messages):
                notes.append("_This model couldn't read the image, so it answered from the model results only._")
                continue
            if not analysis.tools_disabled:
                analysis.tools_disabled = True
                notes.append("_This model doesn't support tool calling, so it can answer but not take actions._")
                continue
            raise AssistantError(f"AI request rejected: {getattr(e, 'message', e)}", 400)
        rounds += 1

        if not response.choices:
            raise AssistantError("The AI returned an empty response.", 502)
        msg = response.choices[0].message
        tool_calls = msg.tool_calls or []

        entry: Dict[str, Any] = {"role": "assistant", "content": msg.content or ""}
        if tool_calls:
            entry["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments or "{}"},
                }
                for tc in tool_calls
            ]
        analysis.messages.append(entry)
        if msg.content and msg.content.strip():
            text_parts.append(msg.content.strip())

        if not tool_calls:
            break

        for tc in tool_calls:
            try:
                args = json.loads(tc.function.arguments or "{}")
                if not isinstance(args, dict):
                    raise ValueError("Arguments must be a JSON object.")
                result, action = _execute_tool(analysis, tc.function.name, args)
                action["at"] = datetime.now(timezone.utc).isoformat()
                turn_actions.append(action)
            except Exception as e:
                result = json.dumps({"error": str(e)})
            analysis.messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})
    else:
        text_parts.append("_(Stopped after the maximum number of actions for one message.)_")

    reply = "\n\n".join(notes + text_parts).strip() or "Done."
    analysis.actions.extend(turn_actions)
    analysis.chat.append({"role": "user", "text": user_message})
    analysis.chat.append({"role": "assistant", "text": reply, "actions": turn_actions})

    return {"reply": reply, "actions": turn_actions, "analysis": analysis.public()}
