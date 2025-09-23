'use client';
import { useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { Button } from './ui/button';

// Use module worker (.mjs)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

type Props = { url: string };

export default function PDFViewerClient({ url }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  // Make sure it's absolute when needed
  const fileUrl = useMemo(() => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
  }, [url]);

  return (
    <div className="p-2">
      <div className="border rounded overflow-auto flex justify-center">
        <Document
          file={fileUrl /* or: { url: fileUrl!, withCredentials: true } if cookie-protected */}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="p-8 text-center">Loading PDF…</div>}
          error={<div className="p-8 text-center text-red-600">Failed to load PDF.</div>}
        >
          <Page pageNumber={pageNumber} renderTextLayer renderAnnotationLayer />
        </Document>
      </div>
      <nav className="mt-4 flex items-center gap-3">
        <Button
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
          className="btn"
        >
          Prev
        </Button>
        <Button
          onClick={() => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p))}
          disabled={!numPages || pageNumber >= (numPages ?? 0)}
          className="btn"
        >
          Next
        </Button>
        <p className="m-0 font-semibold">
          Page {pageNumber} of {numPages ?? '...'}
        </p>
      </nav>
    </div>
  );
}
