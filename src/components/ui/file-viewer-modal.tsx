import { X, FileText, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FileViewerModalProps {
  open: boolean;
  url: string | null;
  title?: string;
  mimeType?: string | null;
  onClose: () => void;
}

function isImage(url: string, title: string, mimeType?: string | null) {
  if (mimeType?.startsWith("image/")) return true;
  if (mimeType === "application/pdf") return false;
  let path = url.split(/[?#]/)[0];
  try { path = decodeURIComponent(path); } catch { /* Use the original path if malformed. */ }
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(path) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(title);
}

function ImagePreview({ url, title }: { url: string; title: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  return (
    <div className="relative flex min-h-[60dvh] items-center justify-center p-4">
      {status === "loading" && <p role="status" className="absolute flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading document...</p>}
      {status === "error" ? (
        <div role="alert" className="space-y-3 text-center text-sm text-muted-foreground">
          <p>Unable to display this image. Check your connection and try again.</p>
          <Button variant="outline" onClick={() => { setStatus("loading"); setAttempt((value) => value + 1); }}>Retry preview</Button>
        </div>
      ) : (
        <img key={attempt} src={url} alt={title} onLoad={() => setStatus("loaded")} onError={() => setStatus("error")} className="max-h-[70dvh] max-w-full rounded-sm object-contain shadow-sm" style={{ visibility: status === "loaded" ? "visible" : "hidden" }} />
      )}
    </div>
  );
}

export function FileViewerModal({ open, url, title = "File viewer", mimeType, onClose }: FileViewerModalProps) {
  if (!url) return null;

  const image = isImage(url, title, mimeType);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        hideClose
        className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100vh-3rem)] sm:w-full"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-foreground">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <DialogTitle className="text-base font-semibold [overflow-wrap:anywhere]">{title}</DialogTitle>
            <DialogDescription className="sr-only">Document preview. Close to return to your review.</DialogDescription>
          </div>
          <DialogClose
            aria-label="Close file viewer"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </DialogClose>
        </header>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain bg-muted/30">
          {image ? (
            <ImagePreview key={url} url={url} title={title} />
          ) : (
            <iframe src={url} title={title} className="h-[75vh] w-full border-0" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
