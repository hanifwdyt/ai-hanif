"use client";

import { useEffect, useState } from "react";
import { Card, Badge, Button, Input } from "@/shared/components";

const PUNAKAWAN_SUGGESTIONS = [
  { id: "semar", label: "Semar", desc: "Tetua bijak — arsitektur, debugging, tradeoff" },
  { id: "petruk", label: "Petruk", desc: "Implementasi kode, refactor mekanis" },
  { id: "gareng", label: "Gareng", desc: "GitLab ops, DevOps, CI/CD" },
  { id: "bagong", label: "Bagong", desc: "Quick tasks, eksekusi cepat" },
];

function RouteRow({ minionId, model, suggestion, onDelete }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-[14px] border border-border-subtle bg-surface hover:bg-surface-2 transition-colors">
      <div className="size-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-[18px]">smart_toy</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm text-text-main">{suggestion?.label || minionId}</h3>
          <Badge variant="default" size="sm">
            <code className="text-[10px]">x-minion-id: {minionId}</code>
          </Badge>
        </div>
        {suggestion?.desc && (
          <p className="text-xs text-text-muted mt-0.5">{suggestion.desc}</p>
        )}
        <div className="mt-2 px-2 py-1 rounded bg-surface-2 font-mono text-[11px] text-text-main inline-block">
          → {model}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="px-2 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[11px] font-medium transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1"
        title="Hapus route"
      >
        <span className="material-symbols-outlined text-[14px]">delete</span>
        Hapus
      </button>
    </div>
  );
}

export default function MinionsPage() {
  const [routes, setRoutes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [newId, setNewId] = useState("");
  const [newModel, setNewModel] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setRoutes(data.minionRoutes || {});
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persist(next) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minionRoutes: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setRoutes(data.minionRoutes || {});
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd() {
    const id = newId.trim().toLowerCase();
    const model = newModel.trim();
    if (!id || !model) {
      setError("Minion ID dan model wajib diisi");
      return;
    }
    const next = { ...routes, [id]: model };
    await persist(next);
    setNewId("");
    setNewModel("");
  }

  async function handleDelete(id) {
    const next = { ...routes };
    delete next[id];
    await persist(next);
  }

  function applySuggestion(s) {
    setNewId(s.id);
  }

  const entries = Object.entries(routes).sort(([a], [b]) => a.localeCompare(b));
  const usedIds = new Set(entries.map(([id]) => id));
  const availableSuggestions = PUNAKAWAN_SUGGESTIONS.filter((s) => !usedIds.has(s.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card padding="md">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-text-main">Minion Routing</h2>
          <p className="text-xs text-text-muted">
            Route specific Punakawan agents to different upstream models via the{" "}
            <code className="px-1 py-0.5 rounded bg-surface-2 text-[11px]">x-minion-id</code>{" "}
            HTTP header. Body model akan di-override otomatis ketika header terdeteksi.
          </p>
        </div>
      </Card>

      <Card padding="md">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-main">Tambah route baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Minion ID"
              placeholder="semar"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              hint="Lowercase, contoh: semar, petruk, gareng, bagong"
            />
            <Input
              label="Model"
              placeholder="anthropic/claude-opus-4-7"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              hint="Format: provider/model atau alias yang sudah ada"
            />
          </div>

          {availableSuggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-text-muted">Punakawan:</span>
              {availableSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className="px-2 py-1 rounded-md bg-surface-2 hover:bg-surface-3 text-[11px] text-text-main border border-border-subtle transition-colors cursor-pointer"
                  title={s.desc}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="text-xs text-red-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              icon="add"
              onClick={handleAdd}
              loading={saving}
              disabled={!newId.trim() || !newModel.trim()}
            >
              Tambah Route
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {loading ? (
          <Card padding="md">
            <div className="text-xs text-text-muted">Loading…</div>
          </Card>
        ) : entries.length === 0 ? (
          <Card padding="md">
            <div className="text-xs text-text-muted text-center py-4">
              Belum ada route. Tambah route pertama lo di atas.
            </div>
          </Card>
        ) : (
          entries.map(([id, model]) => {
            const suggestion = PUNAKAWAN_SUGGESTIONS.find((s) => s.id === id);
            return (
              <RouteRow
                key={id}
                minionId={id}
                model={model}
                suggestion={suggestion}
                onDelete={() => handleDelete(id)}
              />
            );
          })
        )}
      </div>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-text-main mb-2">Cara pakai</h3>
        <p className="text-xs text-text-muted mb-2">
          Kirim request ke endpoint chat seperti biasa, tambahkan header{" "}
          <code className="px-1 py-0.5 rounded bg-surface-2 text-[11px]">x-minion-id</code>:
        </p>
        <pre className="px-3 py-2 rounded bg-surface-2 font-mono text-[11px] text-text-main overflow-x-auto">
{`curl http://localhost:3000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "x-minion-id: semar" \\
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "..."}]
  }'`}
        </pre>
        <p className="text-xs text-text-muted mt-2">
          Field <code className="px-1 py-0.5 rounded bg-surface-2 text-[11px]">model</code> di body
          akan otomatis di-override ke route yang lo set di sini.
        </p>
      </Card>
    </div>
  );
}
