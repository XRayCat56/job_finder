import { useState, type FormEvent } from "react";
import {
  createPreviousJob,
  deletePreviousJob,
  updatePreviousJob,
} from "../../api/profile";
import type { PreviousJob, PreviousJobInput } from "../../types/profile";
import { FormSection } from "../form-section/form-section";
import "../../styles/forms.css";

interface PreviousJobsSectionProps {
  entries: PreviousJob[];
  hasUser: boolean;
  onChanged: () => Promise<void>;
}

const EMPTY: PreviousJobInput = {
  companyName: "",
  jobTitle: "",
  startMonth: "1",
  startYear: String(new Date().getFullYear()),
  endMonth: "12",
  endYear: String(new Date().getFullYear()),
  isCurrent: false,
};

function formatPeriod(job: PreviousJob): string {
  const start = `${job.startMonth}/${job.startYear}`;
  if (job.endMonth && job.endYear) {
    return `${start} – ${job.endMonth}/${job.endYear}`;
  }
  return `${start} – Present`;
}

function toInput(job: PreviousJob): PreviousJobInput {
  const isCurrent = job.endMonth === null && job.endYear === null;
  return {
    companyName: job.companyName,
    jobTitle: job.jobTitle,
    startMonth: String(job.startMonth),
    startYear: String(job.startYear),
    endMonth: isCurrent ? "12" : String(job.endMonth ?? 12),
    endYear: isCurrent
      ? String(new Date().getFullYear())
      : String(job.endYear ?? new Date().getFullYear()),
    isCurrent,
  };
}

export function PreviousJobsSection({
  entries,
  hasUser,
  onChanged,
}: PreviousJobsSectionProps) {
  const [draft, setDraft] = useState<PreviousJobInput>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!hasUser) {
      setError("Save your profile information first.");
      return;
    }
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      if (editingId) {
        await updatePreviousJob(editingId, draft);
        setNotice("Job updated.");
      } else {
        await createPreviousJob(draft);
        setNotice("Job added.");
      }
      setDraft(EMPTY);
      setEditingId(null);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number): Promise<void> {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await deletePreviousJob(id);
      if (editingId === id) {
        setEditingId(null);
        setDraft(EMPTY);
      }
      setNotice("Job removed.");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormSection
      title="Previous jobs"
      description="Work history used to link projects and build resumes."
      notice={notice}
      error={error}
    >
      {!hasUser && (
        <p className="hint">Save your profile information to add jobs.</p>
      )}

      {entries.map((entry) => (
        <article key={entry.id} className="entry-card">
          <h3>
            {entry.jobTitle} at {entry.companyName}
          </h3>
          <p className="hint">{formatPeriod(entry)}</p>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditingId(entry.id);
                setDraft(toInput(entry));
              }}
              disabled={saving}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => void handleDelete(entry.id)}
              disabled={saving}
            >
              Remove
            </button>
          </div>
        </article>
      ))}

      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="form-grid form-grid--two">
          <div className="field">
            <label htmlFor="companyName">Company</label>
            <input
              id="companyName"
              required
              disabled={!hasUser}
              value={draft.companyName}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, companyName: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="jobTitle">Job title</label>
            <input
              id="jobTitle"
              required
              disabled={!hasUser}
              value={draft.jobTitle}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, jobTitle: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="form-grid form-grid--two">
          <div className="field">
            <label htmlFor="startMonth">Start month</label>
            <input
              id="startMonth"
              type="number"
              min="1"
              max="12"
              required
              disabled={!hasUser}
              value={draft.startMonth}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, startMonth: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="startYear">Start year</label>
            <input
              id="startYear"
              type="number"
              min="1900"
              max="2100"
              required
              disabled={!hasUser}
              value={draft.startYear}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, startYear: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={draft.isCurrent}
              disabled={!hasUser}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, isCurrent: e.target.checked }))
              }
            />{" "}
            I currently work here
          </label>
        </div>
        {!draft.isCurrent && (
          <div className="form-grid form-grid--two">
            <div className="field">
              <label htmlFor="endMonth">End month</label>
              <input
                id="endMonth"
                type="number"
                min="1"
                max="12"
                required
                disabled={!hasUser}
                value={draft.endMonth}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, endMonth: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="endYear">End year</label>
              <input
                id="endYear"
                type="number"
                min="1900"
                max="2100"
                required
                disabled={!hasUser}
                value={draft.endYear}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, endYear: e.target.value }))
                }
              />
            </div>
          </div>
        )}
        <div className="form-actions">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={!hasUser || saving}
          >
            {saving ? "Saving…" : editingId ? "Update job" : "Add job"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditingId(null);
                setDraft(EMPTY);
              }}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </FormSection>
  );
}
