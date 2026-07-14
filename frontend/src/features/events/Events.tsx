import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, Loader2, MapPin, Users, Plus, X, Trash2, Mail, CheckSquare, Square } from "lucide-react";
import { apiFetch, requireOk } from "@/lib/api";

const ALL_SKILLS = [
  "Bilingual", "Customer Service", "Dependable", "Live Performing",
  "Organizing & Cleaning", "Problem-Solving", "Public Speaking",
  "Teaching", "Teamwork", "Time Management",
];

interface Event {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  max_volunteers: number | null;
  is_cancelled: boolean;
  required_skills: string[];
}

interface Recipient {
  id: number;
  name: string;
  email: string;
  matched_skills: string[];
  all_skills: string[];
}

interface PreviewData {
  event_name: string;
  required_skills: string[];
  recipients: Recipient[];
}

const emptyForm = {
  name: "",
  description: "",
  location: "",
  start_datetime: "",
  end_datetime: "",
  max_volunteers: "",
  required_skills: [] as string[],
};

function formatDateTime(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString([], {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  // Preview modal state
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewEventId, setPreviewEventId] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  async function fetchEvents() {
    try {
      const res = await apiFetch("/api/events");
      await requireOk(res, "Could not load events.");
      const data = await res.json();
      setEvents(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not load events: ${err.message}`
          : "Could not load events.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchEvents(); }, []);

  function toggleSkill(skill: string) {
    setForm((prev) => ({
      ...prev,
      required_skills: prev.required_skills.includes(skill)
        ? prev.required_skills.filter((s) => s !== skill)
        : [...prev.required_skills, skill],
    }));
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      setFormError("Event name is required.");
      return;
    }
    if (form.start_datetime && form.end_datetime && form.end_datetime < form.start_datetime) {
      setFormError("End date must be after start date.");
      return;
    }
    if (form.max_volunteers && Number(form.max_volunteers) < 1) {
      setFormError("Max volunteers must be at least 1.");
      return;
    }

    setSaving(true);
    setError("");
    setFormError("");
    try {
      const res = await apiFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          location: form.location || null,
          start_datetime: form.start_datetime || null,
          end_datetime: form.end_datetime || null,
          max_volunteers: form.max_volunteers ? parseInt(form.max_volunteers) : null,
          required_skills: form.required_skills,
        }),
      });
      await requireOk(res, "Failed to create event.");
      setForm(emptyForm);
      setShowForm(false);
      await fetchEvents();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? `Failed to create event: ${err.message}`
          : "Failed to create event.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelEvent(eventId: number) {
    const event = events.find((item) => item.id === eventId);
    const confirmed = window.confirm(`Cancel ${event?.name ?? "this event"}? This will remove it from active event lists.`);
    if (!confirmed) return;

    try {
      setCancelingId(eventId);
      const res = await apiFetch(`/api/events/${eventId}`, { method: "DELETE" });
      await requireOk(res, "Failed to cancel event.");
      await fetchEvents();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed to cancel event: ${err.message}`
          : "Failed to cancel event.",
      );
    } finally {
      setCancelingId(null);
    }
  }

  async function openPreview(eventId: number) {
    setPreviewEventId(eventId);
    setPreviewLoading(true);
    setSendResult(null);
    setPreview(null);
    try {
      const res = await apiFetch(`/api/email/preview/${eventId}`);
      await requireOk(res, "Failed to load recipients.");
      const data: PreviewData = await res.json();
      setPreview(data);
      // Pre-select all recipients
      setSelectedIds(new Set(data.recipients.map((r) => r.id)));
    } catch (err) {
      setSendResult(
        err instanceof Error
          ? `Failed to load recipients: ${err.message}`
          : "Failed to load recipients.",
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    setPreview(null);
    setPreviewEventId(null);
    setSendResult(null);
    setSelectedIds(new Set());
  }

  function toggleRecipient(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (!preview) return;
    setSelectedIds(new Set(preview.recipients.map((r) => r.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function handleSend() {
    if (!previewEventId || selectedIds.size === 0) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await apiFetch(`/api/email/send-event-emails/${previewEventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteer_ids: Array.from(selectedIds) }),
      });
      await requireOk(res, "Failed to send emails.");
      const data = await res.json();
      setSendResult(`✓ ${data.message}`);
    } catch (err) {
      setSendResult(
        err instanceof Error
          ? `Failed to send emails: ${err.message}`
          : "Failed to send emails. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500">Create and manage volunteer events</p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#1f4f99] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4280] transition"
        >
          <Plus size={16} /> Create Event
        </button>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchEvents}
            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Create Event Form */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">New Event</h2>
            <button onClick={() => { setShowForm(false); setFormError(""); }} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Event Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4f99]"
                placeholder="e.g. Science Night"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4f99]"
                placeholder="e.g. Main Hall"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Date & Time</label>
              <input
                type="datetime-local"
                value={form.start_datetime}
                onChange={(e) => setForm((p) => ({ ...p, start_datetime: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4f99]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End Date & Time</label>
              <input
                type="datetime-local"
                value={form.end_datetime}
                onChange={(e) => setForm((p) => ({ ...p, end_datetime: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4f99]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Max Volunteers</label>
              <input
                type="number"
                value={form.max_volunteers}
                onChange={(e) => setForm((p) => ({ ...p, max_volunteers: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4f99]"
                placeholder="e.g. 20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4f99]"
                placeholder="Brief description of the event..."
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Required Skills</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    form.required_skills.includes(skill)
                      ? "border-[#1f4f99] bg-[#1f4f99] text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:border-[#1f4f99]"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowForm(false); setFormError(""); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="rounded-lg bg-[#1f4f99] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4280] disabled:opacity-50 transition"
            >
              {saving ? "Creating..." : "Create Event"}
            </button>
          </div>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="flex items-center rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <CalendarDays size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No events yet. Create your first event above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{event.name}</h3>
                <button
                  onClick={() => handleCancelEvent(event.id)}
                  disabled={cancelingId === event.id}
                  className="text-gray-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 transition"
                  title="Cancel event"
                >
                  {cancelingId === event.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </div>

              {event.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{event.description}</p>
              )}

              <div className="space-y-1 text-xs text-gray-500">
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} /> {event.location}
                  </div>
                )}
                {event.start_datetime && (
                  <div className="flex items-center gap-1">
                    <CalendarDays size={12} /> {formatDateTime(event.start_datetime)}
                  </div>
                )}
                {event.max_volunteers && (
                  <div className="flex items-center gap-1">
                    <Users size={12} /> Up to {event.max_volunteers} volunteers
                  </div>
                )}
              </div>

              {event.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {event.required_skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 border border-blue-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => openPreview(event.id)}
                className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff7a3d] px-3 py-2 text-xs font-medium text-white hover:bg-[#e86d35] transition"
              >
                <Mail size={13} /> Send Emails to Volunteers
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewEventId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {preview ? `Send Emails — ${preview.event_name}` : "Loading recipients..."}
                </h2>
                {preview && (() => {
                  const matchedCount = preview.recipients.filter((r) => r.matched_skills.length > 0).length;
                  return (
                    <p className="text-sm text-gray-500">
                      {selectedIds.size} of {preview.recipients.length} selected
                      {matchedCount > 0 && (
                        <span className="ml-2 text-green-600 font-medium">· {matchedCount} skill match{matchedCount > 1 ? "es" : ""}</span>
                      )}
                    </p>
                  );
                })()}
              </div>
              <button onClick={closePreview} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {previewLoading ? (
                <div className="flex items-center rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading volunteers...
                </div>
              ) : !preview && sendResult ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {sendResult}
                </div>
              ) : preview && preview.recipients.length === 0 ? (
                <p className="text-sm text-gray-500">No active volunteers found.</p>
              ) : preview ? (() => {
                  const matched = preview.recipients.filter((r) => r.matched_skills.length > 0);
                  const others = preview.recipients.filter((r) => r.matched_skills.length === 0);

                  const renderRow = (r: Recipient) => (
                    <div
                      key={r.id}
                      onClick={() => toggleRecipient(r.id)}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        selectedIds.has(r.id)
                          ? "border-[#1f4f99] bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 text-[#1f4f99]">
                        {selectedIds.has(r.id)
                          ? <CheckSquare size={18} />
                          : <Square size={18} className="text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                          {r.matched_skills.length > 0 && (
                            <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 font-medium">
                              {r.matched_skills.length} skill{r.matched_skills.length > 1 ? "s" : ""} matched
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{r.email}</p>
                        {r.matched_skills.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {r.matched_skills.map((s) => (
                              <span key={s} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 border border-green-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );

                  return (
                    <div className="space-y-4">
                      {matched.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-green-700">
                              Skill Match ({matched.length})
                            </span>
                            <div className="flex-1 border-t border-green-100" />
                          </div>
                          {matched.map(renderRow)}
                        </div>
                      )}
                      {others.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Other Volunteers ({others.length})
                            </span>
                            <div className="flex-1 border-t border-gray-100" />
                          </div>
                          {others.map(renderRow)}
                        </div>
                      )}
                    </div>
                  );
                })()
              : null}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 px-6 py-4 space-y-3">
              {preview && (
                <>
                  {sendResult && (
                  <p className={`text-sm ${sendResult.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                    {sendResult}
                  </p>
                  )}
                  <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={selectAll}
                      className="text-xs text-[#1f4f99] hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-gray-300">|</span>
                    {preview && preview.recipients.some((r) => r.matched_skills.length > 0) && (
                      <>
                        <button
                          onClick={() => setSelectedIds(new Set(preview.recipients.filter((r) => r.matched_skills.length > 0).map((r) => r.id)))}
                          className="text-xs text-green-700 hover:underline"
                        >
                          Matched only
                        </button>
                        <span className="text-gray-300">|</span>
                      </>
                    )}
                    <button
                      onClick={deselectAll}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Deselect all
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={closePreview}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={sending || selectedIds.size === 0}
                      className="flex items-center gap-2 rounded-lg bg-[#ff7a3d] px-4 py-2 text-sm font-medium text-white hover:bg-[#e86d35] disabled:opacity-50 transition"
                    >
                      <Mail size={14} />
                      {sending ? "Sending..." : `Send to ${selectedIds.size} volunteer(s)`}
                    </button>
                  </div>
                  </div>
                </>
              )}
              {!preview && (
                <div className="flex justify-end">
                  <button
                    onClick={closePreview}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
