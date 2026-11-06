"""
In-memory store for analysis sessions (one uploaded image + all model results
+ assistant conversation + actions taken). Lost on server restart — swap for a
database later if sessions need to persist.
"""

from __future__ import annotations

import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

MAX_SESSIONS = 50


@dataclass
class Analysis:
    id: str
    filename: str
    image_bytes: bytes
    created_at: str
    results: Dict[str, Dict] = field(default_factory=dict)
    comparison: Dict = field(default_factory=dict)
    priority: Optional[Dict] = None
    reports: List[Dict] = field(default_factory=list)
    actions: List[Dict] = field(default_factory=list)
    # Full AI conversation (includes tool calls/results)
    messages: List[Dict[str, Any]] = field(default_factory=list)
    # What the UI shows in the chat
    chat: List[Dict[str, Any]] = field(default_factory=list)
    # Set when the AI model turns out not to support tool calling
    tools_disabled: bool = False
    lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

    def public(self) -> Dict:
        return {
            "analysis_id": self.id,
            "filename": self.filename,
            "created_at": self.created_at,
            "results": self.results,
            "comparison": self.comparison,
            "priority": self.priority,
            "reports": self.reports,
            "actions": self.actions,
            "chat": self.chat,
        }


_store: Dict[str, Analysis] = {}
_store_lock = threading.Lock()


def create_analysis(filename: str, image_bytes: bytes) -> Analysis:
    analysis = Analysis(
        id=uuid.uuid4().hex[:12],
        filename=filename,
        image_bytes=image_bytes,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    with _store_lock:
        if len(_store) >= MAX_SESSIONS:
            oldest = next(iter(_store))
            _store.pop(oldest, None)
        _store[analysis.id] = analysis
    return analysis


def get_analysis(analysis_id: str) -> Optional[Analysis]:
    return _store.get(analysis_id)
