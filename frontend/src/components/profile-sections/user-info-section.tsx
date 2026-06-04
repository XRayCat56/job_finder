import {
  forwardRef,
  useImperativeHandle,
  useState,
  type FormEvent,
} from "react";
import { saveUserInfo } from "../../api/profile";
import type { UserInfo, UserInfoInput } from "../../types/profile";
import { FormSection } from "../form-section/form-section";
import type { ProfileSectionHandle } from "./profile-section-handle";
import "../../styles/forms.css";

interface UserInfoSectionProps {
  initial: UserInfo | null;
  onSaved: (user: UserInfo) => void;
}

const EMPTY: UserInfoInput = {
  fullName: "",
  email: "",
  phone: "",
};

function isUserFormFilled(form: UserInfoInput): boolean {
  return form.fullName.trim() !== "" && form.email.trim() !== "";
}

function isUserFormDirty(
  form: UserInfoInput,
  initial: UserInfo | null,
): boolean {
  if (!initial) {
    return isUserFormFilled(form);
  }
  return (
    form.fullName !== initial.fullName ||
    form.email !== initial.email ||
    form.phone !== (initial.phone ?? "")
  );
}

export const UserInfoSection = forwardRef<
  ProfileSectionHandle,
  UserInfoSectionProps
>(function UserInfoSection({ initial, onSaved }, ref) {
  const [form, setForm] = useState<UserInfoInput>(() =>
    initial
      ? {
          fullName: initial.fullName,
          email: initial.email,
          phone: initial.phone ?? "",
        }
      : EMPTY,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function persistUser(): Promise<void> {
    if (!isUserFormDirty(form, initial) || !isUserFormFilled(form)) {
      return;
    }
    const user = await saveUserInfo(form);
    onSaved(user);
    setNotice("Profile information saved.");
  }

  useImperativeHandle(ref, () => ({
    savePending: persistUser,
  }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await persistUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormSection
      title="Profile"
      description="Your contact details used across job applications."
      notice={notice}
      error={error}
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            name="fullName"
            required
            value={form.fullName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, fullName: e.target.value }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone (optional)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </FormSection>
  );
});
