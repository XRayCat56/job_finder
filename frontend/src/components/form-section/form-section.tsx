import type { ReactNode } from "react";
import "./form-section.css";

interface FormSectionProps {
  title: string;
  description: string;
  children: ReactNode;
  notice?: string | null;
  error?: string | null;
}

export function FormSection({
  title,
  description,
  children,
  notice,
  error,
}: FormSectionProps) {
  return (
    <section className="form-section" aria-labelledby={`section-${title}`}>
      <header className="form-section__header">
        <h2 id={`section-${title}`}>{title}</h2>
        <p>{description}</p>
      </header>
      {notice && <p className="form-section__notice">{notice}</p>}
      {error && (
        <p className="form-section__error" role="alert">
          {error}
        </p>
      )}
      {children}
    </section>
  );
}
