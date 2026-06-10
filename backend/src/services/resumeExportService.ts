import { Document, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";

export const RESUME_DOWNLOAD_FORMAT = {
  DOCX: "docx",
  PDF: "pdf",
  TXT: "txt",
} as const;

export type ResumeDownloadFormat =
  (typeof RESUME_DOWNLOAD_FORMAT)[keyof typeof RESUME_DOWNLOAD_FORMAT];

const RESUME_FORMAT_CONTENT_TYPES: Record<ResumeDownloadFormat, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
};

export function isResumeDownloadFormat(
  value: unknown,
): value is ResumeDownloadFormat {
  return (
    value === RESUME_DOWNLOAD_FORMAT.DOCX ||
    value === RESUME_DOWNLOAD_FORMAT.PDF ||
    value === RESUME_DOWNLOAD_FORMAT.TXT
  );
}

export function getResumeContentType(format: ResumeDownloadFormat): string {
  return RESUME_FORMAT_CONTENT_TYPES[format];
}

function textLines(text: string): string[] {
  return text.split(/\r?\n/);
}

export async function exportResumeToDocx(text: string): Promise<Buffer> {
  const paragraphs = textLines(text).map(
    (line) =>
      new Paragraph({
        children: [new TextRun(line || " ")],
        spacing: { after: 120 },
      }),
  );

  const document = new Document({
    sections: [{ children: paragraphs }],
  });

  return Packer.toBuffer(document);
}

export function exportResumeToPdf(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    document.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    document.on("error", reject);

    document.font("Helvetica").fontSize(11);
    document.text(text, {
      align: "left",
      lineGap: 4,
    });
    document.end();
  });
}

export async function exportResumeContent(
  text: string,
  format: ResumeDownloadFormat,
): Promise<Buffer | string> {
  if (format === RESUME_DOWNLOAD_FORMAT.DOCX) {
    return exportResumeToDocx(text);
  }
  if (format === RESUME_DOWNLOAD_FORMAT.PDF) {
    return exportResumeToPdf(text);
  }
  return text;
}
