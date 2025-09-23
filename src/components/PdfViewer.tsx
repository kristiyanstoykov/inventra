'use client';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

type PDFViewerClientProps = { url: string };

const PDFViewerClient = dynamic<PDFViewerClientProps>(() => import('./PdfViewerClient'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-lg text-foreground/80">
      Loading PDF Viewer... <Loader2 className="inline animate-spin ml-2" />
    </div>
  ),
});

export default function PDFViewer({ url }: PDFViewerClientProps) {
  return <PDFViewerClient url={url} />;
}
