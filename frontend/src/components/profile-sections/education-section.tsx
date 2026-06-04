import {
  forwardRef,
  useImperativeHandle,
  useState,
  type FormEvent,
} from "react";
import {
  createEducation,
  deleteEducation,
  updateEducation,
} from "../../api/profile";
import type { Education, EducationInput } from "../../types/profile";
import { FormSection } from "../form-section/form-section";
import type { ProfileSectionHandle } from "./profile-section-handle";
import "../../styles/forms.css";

interface EducationSectionProps {
  entries: Education[];
  hasUser: boolean;
  onChanged: () => Promise<void>;
}

const EMPTY: EducationInput = {
  school: "",
  degreeType: "",
  areaOfStudy: "",
  gpa: "",
};

function toInput(entry: Education): EducationInput {
  return {
    school: entry.school,
    degreeType: entry.degreeType,
    areaOfStudy: entry.areaOfStudy,
    gpa: entry.gpa ?? "",
  };
}

function hasEducationDraft(
  draft: EducationInput,
  editingId: number | null,
): boolean {
  if (editingId !== null) {
    return true;
  }
  return (
    draft.school.trim() !== "" ||
    draft.degreeType.trim() !== "" ||
    draft.areaOfStudy.trim() !== "" ||
    draft.gpa.trim() !== ""
  );
}

export const EducationSection = forwardRef<
  ProfileSectionHandle,
  EducationSectionProps
>(function EducationSection({ entries, hasUser, onChanged }, ref) {
  const [draft, setDraft] = useState<EducationInput>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function persistDraft(): Promise<void> {
    if (!hasUser) {
      throw new Error("Save your profile information first.");
    }
    if (!hasEducationDraft(draft, editingId)) {
      return;
    }
    if (editingId) {
      await updateEducation(editingId, draft);
      setNotice("Education entry updated.");
    } else {
      await createEducation(draft);
      setNotice("Education entry added.");
    }
    setDraft(EMPTY);
    setEditingId(null);
    await onChanged();
  }

  useImperativeHandle(ref, () => ({
    savePending: persistDraft,
  }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await persistDraft();
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
      await deleteEducation(id);
      if (editingId === id) {
        setEditingId(null);
        setDraft(EMPTY);
      }
      setNotice("Education entry removed.");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(entry: Education): void {
    setEditingId(entry.id);
    setDraft(toInput(entry));
    setNotice(null);
    setError(null);
  }

  function cancelEdit(): void {
    setEditingId(null);
    setDraft(EMPTY);
  }

  return (
    <FormSection
      title="Education"
      description="Schools, degrees, and areas of study."
      notice={notice}
      error={error}
    >
      {!hasUser && (
        <p className="hint">Save your profile information to add education.</p>
      )}

      {entries.map((entry) => (
        <article key={entry.id} className="entry-card">
          <h3>
            {entry.degreeType} — {entry.school}
          </h3>
          <p className="hint">
            {entry.areaOfStudy}
            {entry.gpa ? ` · GPA ${entry.gpa}` : ""}
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => startEdit(entry)}
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
        <div className="field">
          <label htmlFor="school">School</label>
          <input
            id="school"
            required
            disabled={!hasUser}
            value={draft.school}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, school: e.target.value }))
            }
          />
        </div>
        <div className="form-grid form-grid--two">
          <div className="field">
            <label htmlFor="degreeType">Degree type</label>
            <input
              id="degreeType"
              required
              disabled={!hasUser}
              value={draft.degreeType}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, degreeType: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="areaOfStudy">Area of study</label>
            <input
              id="areaOfStudy"
              required
              disabled={!hasUser}
              value={draft.areaOfStudy}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, areaOfStudy: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="gpa">GPA (optional)</label>
          <input
            id="gpa"
            type="number"
            min="0"
            max="4"
            step="0.01"
            disabled={!hasUser}
            value={draft.gpa}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, gpa: e.target.value }))
            }
          />
        </div>
        <div className="form-actions">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={!hasUser || saving}
          >
            {saving
              ? "Saving…"
              : editingId
                ? "Update education"
                : "Add education"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </FormSection>
  );
});
