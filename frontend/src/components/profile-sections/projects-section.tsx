import { useState, type FormEvent } from "react";
import {
  createProject,
  deleteProject,
  updateProject,
} from "../../api/profile";
import type {
  PreviousJob,
  Project,
  ProjectInput,
  Skill,
} from "../../types/profile";
import { FormSection } from "../form-section/form-section";
import "../../styles/forms.css";

interface ProjectsSectionProps {
  entries: Project[];
  previousJobs: PreviousJob[];
  skills: Skill[];
  hasUser: boolean;
  onChanged: () => Promise<void>;
}

const EMPTY: ProjectInput = {
  name: "",
  description: "",
  jobId: "",
  skillIds: [],
};

function toInput(project: Project): ProjectInput {
  return {
    name: project.name,
    description: project.description ?? "",
    jobId: project.jobId ? String(project.jobId) : "",
    skillIds: project.skillIds,
  };
}

export function ProjectsSection({
  entries,
  previousJobs,
  skills,
  hasUser,
  onChanged,
}: ProjectsSectionProps) {
  const [draft, setDraft] = useState<ProjectInput>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleSkill(skillId: number): void {
    setDraft((prev) => {
      const hasSkill = prev.skillIds.includes(skillId);
      return {
        ...prev,
        skillIds: hasSkill
          ? prev.skillIds.filter((id) => id !== skillId)
          : [...prev.skillIds, skillId],
      };
    });
  }

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
        await updateProject(editingId, draft);
        setNotice("Project updated.");
      } else {
        await createProject(draft);
        setNotice("Project added.");
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
      await deleteProject(id);
      if (editingId === id) {
        setEditingId(null);
        setDraft(EMPTY);
      }
      setNotice("Project removed.");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  }

  function linkedJobLabel(jobId: number | null): string {
    if (!jobId) return "";
    const job = previousJobs.find((entry) => entry.id === jobId);
    return job ? ` · ${job.jobTitle} at ${job.companyName}` : "";
  }

  return (
    <FormSection
      title="Projects"
      description="Portfolio work, optionally linked to a previous job and skills."
      notice={notice}
      error={error}
    >
      {!hasUser && (
        <p className="hint">Save your profile information to add projects.</p>
      )}

      {entries.map((entry) => (
        <article key={entry.id} className="entry-card">
          <h3>
            {entry.name}
            {linkedJobLabel(entry.jobId)}
          </h3>
          {entry.description && <p className="hint">{entry.description}</p>}
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
        <div className="field">
          <label htmlFor="projectName">Project name</label>
          <input
            id="projectName"
            required
            disabled={!hasUser}
            value={draft.name}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="projectDescription">Description (optional)</label>
          <textarea
            id="projectDescription"
            disabled={!hasUser}
            rows={8}
            value={draft.description}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="projectJob">Linked previous job (optional)</label>
          <select
            id="projectJob"
            disabled={!hasUser || previousJobs.length === 0}
            value={draft.jobId}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, jobId: e.target.value }))
            }
          >
            <option value="">None</option>
            {previousJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.jobTitle} at {job.companyName}
              </option>
            ))}
          </select>
        </div>
        {skills.length > 0 && (
          <fieldset className="field">
            <legend>Skills used</legend>
            <div className="skill-checkboxes">
              {skills.map((skill) => (
                <label key={skill.id} className="skill-checkbox">
                  <input
                    type="checkbox"
                    disabled={!hasUser}
                    checked={draft.skillIds.includes(skill.id)}
                    onChange={() => toggleSkill(skill.id)}
                  />
                  {skill.skillName}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {skills.length === 0 && hasUser && (
          <p className="hint">Add skills above to link them to projects.</p>
        )}
        <div className="form-actions">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={!hasUser || saving}
          >
            {saving ? "Saving…" : editingId ? "Update project" : "Add project"}
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
