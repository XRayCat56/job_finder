import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import {
  getResumeDownloadUrl,
  submitJobApplication,
} from "../../api/job-applications";
import type { CreateJobApplicationResult } from "../../types/job-application";
import "../../styles/forms.css";
import "./apply-page.css";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ApplyPage() {
  const [url, setUrl] = useState("");
  const [appliedDate, setAppliedDate] = useState(todayIsoDate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateJobApplicationResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await submitJobApplication({ url, appliedDate });
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process job application",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="apply-page">
      <header className="apply-page__header">
        <Link className="apply-page__back" to="/">
          ← Home
        </Link>
        <h1>Apply to a job</h1>
        <p className="apply-page__subtitle">
          Paste a LinkedIn job posting URL. We will scrape the listing, save the
          application, and generate a tailored resume from your profile.
        </p>
      </header>

      <form className="apply-page__form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="job-url">LinkedIn job URL</label>
          <input
            id="job-url"
            type="url"
            required
            placeholder="https://www.linkedin.com/jobs/view/..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="field">
          <label htmlFor="applied-date">Applied date</label>
          <input
            id="applied-date"
            type="date"
            required
            value={appliedDate}
            onChange={(event) => setAppliedDate(event.target.value)}
            disabled={submitting}
          />
        </div>

        {error ? (
          <p className="apply-page__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="form-actions">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Processing…" : "Submit application"}
          </button>
        </div>
      </form>

      {result ? (
        <section className="apply-page__result" aria-live="polite">
          <h2>Application saved</h2>
          <dl className="apply-page__details">
            <div>
              <dt>Job title</dt>
              <dd>{result.jobApplication.title}</dd>
            </div>
            <div>
              <dt>Applied date</dt>
              <dd>{result.jobApplication.appliedDate}</dd>
            </div>
            <div>
              <dt>Posting</dt>
              <dd>
                <a
                  href={result.jobApplication.link}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View on LinkedIn
                </a>
              </dd>
            </div>
          </dl>
          <a
            className="apply-page__download"
            href={getResumeDownloadUrl(result.resume.id)}
            download
          >
            Download tailored resume
          </a>
        </section>
      ) : null}
    </main>
  );
}
