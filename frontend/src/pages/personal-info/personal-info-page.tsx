import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProfile } from "../../api/profile";
import { EducationSection } from "../../components/profile-sections/education-section";
import { PreviousJobsSection } from "../../components/profile-sections/previous-jobs-section";
import { ProjectsSection } from "../../components/profile-sections/projects-section";
import { SkillsSection } from "../../components/profile-sections/skills-section";
import { UserInfoSection } from "../../components/profile-sections/user-info-section";
import type { Profile, UserInfo } from "../../types/profile";
import "./personal-info-page.css";

const EMPTY_PROFILE: Profile = {
  user: null,
  education: [],
  skills: [],
  previousJobs: [],
  projects: [],
};

export function PersonalInfoPage() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
            initial={profile.user}
            onSaved={handleUserSaved}
          />
          <EducationSection
            entries={profile.education}
            hasUser={profile.user !== null}
            onChanged={handleSectionChanged}
          />
          <SkillsSection
            entries={profile.skills}
            hasUser={profile.user !== null}
            onChanged={handleSectionChanged}
          />
          <PreviousJobsSection
            entries={profile.previousJobs}
            hasUser={profile.user !== null}
            onChanged={handleSectionChanged}
          />
          <ProjectsSection
            entries={profile.projects}
            previousJobs={profile.previousJobs}
            skills={profile.skills}
            hasUser={profile.user !== null}
            onChanged={handleSectionChanged}
          />
        </div>
      )}
    </main>
  );
}
