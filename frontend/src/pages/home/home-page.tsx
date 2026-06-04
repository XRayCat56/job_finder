import { Link } from "react-router-dom";
import "./home-page.css";

export function HomePage() {
  return (
    <main className="home-page">
      <h1>Job Finder</h1>
      <p className="home-page__subtitle">
        Track applications, tailor resumes, and manage your professional profile
        in one place.
      </p>

      <section className="home-page__card" aria-labelledby="get-started-heading">
        <h2 id="get-started-heading">Get started</h2>
        <p>
          Add your contact details, education, skills, work history, and projects
          so generated resumes stay accurate.
        </p>
        <Link className="home-page__cta" to="/personal-info">
          Manage personal info
        </Link>
      </section>
    </main>
  );
}
