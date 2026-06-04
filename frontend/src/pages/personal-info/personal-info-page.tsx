import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProfile } from "../../api/profile";
import { EducationSection } from "../../components/profile-sections/education-section";
import { PreviousJobsSection } from "../../components/profile-sections/previous-jobs-section";
import { ProjectsSection } from "../../components/profile-sections/projects-section";
import type { ProfileSectionHandle } from "../../components/profile-sections/profile-section-handle";
import { SkillsSection } from "../../components/profile-sections/skills-section";
import { UserInfoSection } from "../../components/profile-sections/user-info-section";
import type { Profile, UserInfo } from "../../types/profile";
import "../../styles/forms.css";
import "./personal-info-page.css";

const EMPTY_PROFILE: Profile = {
  user: null,
  education: [],
  skills: [],
  previousJobs: [],
  projects: [],
};

export function PersonalInfoPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const userRef = useRef<ProfileSectionHandle>(null);
  const educationRef = useRef<ProfileSectionHandle>(null);
  const skillsRef = useRef<ProfileSectionHandle>(null);
  const previousJobsRef = useRef<ProfileSectionHandle>(null);
  const projectsRef = useRef<ProfileSectionHandle>(null);

  const reloadProfile = useCallback(async (): Promise<void> => {
    const data = await fetchProfile();
    setProfile(data);
  }, []);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleUserSaved(user: UserInfo): void {
    setProfile((prev) => ({ ...prev, user }));
  }

  async function handleSectionChanged(): Promise<void> {
    await reloadProfile();
  }

  async function handleSubmitAll(): Promise<void> {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await userRef.current?.savePending();
      await reloadProfile();
      await educationRef.current?.savePending();
      await skillsRef.current?.savePending();
      await previousJobsRef.current?.savePending();
      await reloadProfile();
      await projectsRef.current?.savePending();
      await reloadProfile();
      navigate("/");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save profile",
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="personal-info-page">
      <header className="personal-info-page__header">
        <Link className="personal-info-page__back" to="/">
          ← Home
        </Link>
        <h1>Personal info</h1>
        <p>Build the profile data used for resumes and applications.</p>
      </header>

      {loading && <p className="personal-info-page__status">Loading profile…</p>}
      {loadError && (
        <p className="personal-info-page__status personal-info-page__status--error" role="alert">
          {loadError}
        </p>
      )}

      {!loading && !loadError && (
        <div className="personal-info-page__sections">
          <UserInfoSection
            ref={userRef}
            initial={profile.user}
            onSaved={handleUserSaved}
          />
          <EducationSection
            ref={educationRef}
            entries={profile.education}
            hasUser={profile.user !== null}
            onChanged={handleSectionChanged}
          />
          <SkillsSection
            ref={skillsRef}
            entries={profile.skills}
            hasUser={profile.user !== null}
            onChanged={handleSectionChanged}
          />
          <PreviousJobsSection
            ref={previousJobsRef}
            entries={profile.previousJobs}
            hasUser={profile.user !== null}
            onChanged={handleSectionChanged}
          />
          <ProjectsSection
            ref={projectsRef}
            entries={profile.projects}
            previousJobs={profile.previousJobs}
            skills={profile.skills}
            hasUser={profile.user !== null}
            onChanged={handleSectionChanged}
          />
          <footer className="personal-info-page__submit">
            {submitError && (
              <p
                className="personal-info-page__submit-notice personal-info-page__submit-notice--error"
                role="alert"
              >
                {submitError}
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary personal-info-page__submit-btn"
              disabled={submitting}
              onClick={() => void handleSubmitAll()}
            >
              {submitting ? "Saving profile…" : "Save profile"}
            </button>
          </footer>
        </div>
      )}
    </main>
  );
}
