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

      <section className="home-page__card" aria-labelledby="apply-heading">
        <h2 id="apply-heading">Apply to a job</h2>
        <p>
          Submit a LinkedIn job posting URL to save the application and generate
          a resume tailored to the listing.
        </p>
        <Link className="home-page__cta" to="/apply">
          Submit job URL
        </Link>
      </section>

      <section
        className="home-page__card home-page__card--secondary"
        aria-labelledby="get-started-heading"
      >
        <h2 id="get-started-heading">Get started</h2>
        <p>
          Add your contact details, education, skills, work history, and projects
          so generated resumes stay accurate.
        </p>
        <Link className="home-page__cta home-page__cta--secondary" to="/personal-info">
          Manage personal info
        </Link>
      </section>
    </main>
  );
}
