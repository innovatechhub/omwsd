import { X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileViewerModalProps {
  open: boolean;
  url: string | null;
  title?: string;
  onClose: () => void;
}

function isImage(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

export function FileViewerModal({ open, url, title = "File viewer", onClose }: FileViewerModalProps) {
  if (!open || !url) return null;

  const image = isImage(url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close file viewer"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-panel",
        )}
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Close file viewer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-muted/30">
          {image ? (
            <div className="flex h-full min-h-[60vh] items-center justify-center p-4">
              <img
                src={url}
                alt={title}
                className="max-h-[70vh] max-w-full rounded object-contain shadow"
              />
            </div>
          ) : (
            <iframe
              src={url}
              title={title}
              className="h-[75vh] w-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}
