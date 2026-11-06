import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { API_URL, apiClient } from "../../services/api";
import { Analysis, AssistantAction, AssistantStatus, ChatEntry } from "../../types/analysis";

interface Props {
  analysis: Analysis;
  status: AssistantStatus | null;
  onAnalysisUpdate: (a: Analysis) => void;
}

const QUICK_ACTIONS = [
  { label: "Explain the differences", prompt: "Explain why the models differ on this image and which reading looks more plausible from the image itself." },
  { label: "Triage & set priority", prompt: "Triage this site: set a response priority with recommended field actions." },
  { label: "Check robustness", prompt: "Check how robust the detection results are by re-running the detector at a lower and a higher confidence threshold, then summarise what changed." },
  { label: "Generate report", prompt: "Write and save a concise damage assessment report for the response team, including model comparison, key risks and recommended next steps." },
];

const ACTION_ICON: Record<AssistantAction["type"], string> = {
  get_detections: "🔎",
  rerun_model: "🔁",
  set_priority: "🚩",
  save_report: "📄",
};

const PRIORITY_STYLE: Record<string, string> = {
  "P1-critical": "border-red-300 bg-red-50 text-red-900",
  "P2-high": "border-orange-300 bg-orange-50 text-orange-900",
  "P3-moderate": "border-amber-300 bg-amber-50 text-amber-900",
  "P4-low": "border-green-300 bg-green-50 text-green-900",
};

export const AssistantPanel: React.FC<Props> = ({ analysis, status, onAnalysisUpdate }) => {
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat: ChatEntry[] = analysis.chat;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.length, pending]);

  const send = async (message: string) => {
    const text = message.trim();
    if (!text || pending) return;
    setPending(text);
    setInput("");
    setError("");
    try {
      const res = await apiClient.chat(analysis.analysis_id, text);
      onAnalysisUpdate(res.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assistant request failed");
      setInput(text);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[calc(100vh-7rem)] min-h-[560px] lg:sticky lg:top-6">
      <div className="px-5 py-4 border-b">
        <h2 className="text-lg font-bold text-gray-900">🤖 AI Analyst</h2>
        <p className="text-xs text-gray-500">
          {status?.model ? `${status.model} (${status.provider}) · ` : ""}
          Reads all model results · can re-run models, set priority and save reports
        </p>
      </div>

      {/* Priority + reports produced by the assistant */}
      {(analysis.priority || analysis.reports.length > 0) && (
        <div className="px-5 py-3 border-b space-y-2">
          {analysis.priority && (
            <div className={`rounded-lg border p-3 text-sm ${PRIORITY_STYLE[analysis.priority.level]}`}>
              <p className="font-bold">🚩 {analysis.priority.level}</p>
              <p className="mt-1">{analysis.priority.reason}</p>
              {analysis.priority.recommended_actions.length > 0 && (
                <ol className="mt-2 list-decimal pl-5 space-y-0.5">
                  {analysis.priority.recommended_actions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ol>
              )}
            </div>
          )}
          {analysis.reports.map((r) => (
            <a
              key={r.url}
              href={API_URL + r.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 hover:bg-blue-100"
            >
              📄 {r.title} <span className="ml-auto text-xs">Download</span>
            </a>
          ))}
        </div>
      )}

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {status && !status.configured && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            The AI analyst needs a free API key for <b>{status.provider || "your provider"}</b>. Add{" "}
            <code>AI_API_KEY=…</code> to <code>backend/.env</code> (see <code>.env.example</code>) and
            restart the backend.
            {status.key_url && (
              <>
                {" "}Get a free key at{" "}
                <a href={status.key_url} target="_blank" rel="noreferrer" className="underline">
                  {status.key_url.replace("https://", "")}
                </a>
                .
              </>
            )}
          </div>
        )}

        {chat.length === 0 && !pending && (
          <p className="text-sm text-gray-500">
            Ask about the results, or pick a quick action below.
          </p>
        )}

        {chat.map((m, i) => (
          <Message key={i} entry={m} />
        ))}

        {pending && (
          <>
            <Message entry={{ role: "user", text: pending }} />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Analysing…
            </div>
          </>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
      </div>

      {/* Quick actions + input */}
      <div className="border-t p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q.label}
              onClick={() => send(q.prompt)}
              disabled={!!pending}
              className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI analyst…"
            disabled={!!pending}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || !!pending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

const Message: React.FC<{ entry: ChatEntry }> = ({ entry }) => {
  if (entry.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-blue-600 px-3 py-2 text-sm text-white">
          {entry.text}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {entry.actions && entry.actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.actions.map((a, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
            >
              {ACTION_ICON[a.type]} {a.summary}
            </span>
          ))}
        </div>
      )}
      <div className="prose-chat text-sm text-gray-800">
        <ReactMarkdown>{entry.text}</ReactMarkdown>
      </div>
    </div>
  );
};
