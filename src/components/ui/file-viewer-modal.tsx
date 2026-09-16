import { X, FileText } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
  if (!url) return null;

  const image = isImage(url);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        hideClose
        className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100vh-3rem)] sm:w-full"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
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
            <div className="flex h-full min-h-[60vh] items-center justify-center p-4">
              <img
                src={url}
                alt={title}
                className="max-h-[70vh] max-w-full rounded-sm object-contain shadow-sm"
              />
            </div>
          ) : (
            <iframe src={url} title={title} className="h-[75vh] w-full border-0" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
