import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createSkill, deleteSkill, updateSkill } from "../../api/profile";
import {
  PROFICIENCY_LEVELS,
  type Skill,
  type SkillInput,
} from "../../types/profile";
import { FormSection } from "../form-section/form-section";
import type { ProfileSectionHandle } from "./profile-section-handle";
import "../../styles/forms.css";

interface SkillsSectionProps {
  entries: Skill[];
  hasUser: boolean;
  onChanged: () => Promise<void>;
}

const EMPTY: SkillInput = {
  skillName: "",
  proficiencyLevel: PROFICIENCY_LEVELS[0],
};

function hasSkillDraft(draft: SkillInput, editingId: number | null): boolean {
  return editingId !== null || draft.skillName.trim() !== "";
}

export const SkillsSection = forwardRef<ProfileSectionHandle, SkillsSectionProps>(
  function SkillsSection({ entries, hasUser, onChanged }, ref) {
  const [draft, setDraft] = useState<SkillInput>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const skillNameRef = useRef<HTMLInputElement>(null);

  async function persistDraft(focusAfterAdd = false): Promise<void> {
    if (!hasUser) {
      throw new Error("Save your profile information first.");
    }
    if (!hasSkillDraft(draft, editingId)) {
      return;
    }
    if (editingId) {
      await updateSkill(editingId, draft);
      setNotice("Skill updated.");
    } else {
      await createSkill(draft);
      setNotice("Skill added.");
      if (focusAfterAdd) {
        setDraft(EMPTY);
        setEditingId(null);
        await onChanged();
        skillNameRef.current?.focus();
        return;
      }
    }
    setDraft(EMPTY);
    setEditingId(null);
    await onChanged();
  }

  useImperativeHandle(ref, () => ({
    savePending: () => persistDraft(false),
  }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await persistDraft(true);
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
      await deleteSkill(id);
      if (editingId === id) {
        setEditingId(null);
        setDraft(EMPTY);
      }
      setNotice("Skill removed.");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormSection
      title="Skills"
      description="Technical and professional skills with proficiency levels."
      notice={notice}
      error={error}
    >
      {!hasUser && (
        <p className="hint">Save your profile information to add skills.</p>
      )}

      {entries.map((entry) => (
        <article key={entry.id} className="entry-card entry-card--skill">
          <div className="entry-card__skill-row">
            <div className="entry-card__skill-main">
              <h3>{entry.skillName}</h3>
              <p className="hint">{entry.proficiencyLevel}</p>
            </div>
            <div className="form-actions entry-card__skill-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(entry.id);
                  setDraft({
                    skillName: entry.skillName,
                    proficiencyLevel: entry.proficiencyLevel,
                  });
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
          </div>
        </article>
      ))}

      <form className="form-grid form-grid--two" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="skillName">Skill name</label>
          <input
            ref={skillNameRef}
            id="skillName"
            required
            disabled={!hasUser}
            value={draft.skillName}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, skillName: e.target.value }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="proficiencyLevel">Proficiency</label>
          <select
            id="proficiencyLevel"
            disabled={!hasUser}
            value={draft.proficiencyLevel}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                proficiencyLevel: e.target.value,
              }))
            }
          >
            {PROFICIENCY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={!hasUser || saving}
          >
            {saving ? "Saving…" : editingId ? "Update skill" : "Add skill"}
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
  },
);
