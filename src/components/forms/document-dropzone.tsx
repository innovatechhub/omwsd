import { FileText, UploadCloud, X } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";

const acceptedFileTypes = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

interface DocumentDropzoneProps {
  label: string;
  description: string;
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export function DocumentDropzone({
  label,
  description,
  files,
  onChange,
  maxFiles = 5,
}: DocumentDropzoneProps) {
  const dropzone = useDropzone({
    accept: acceptedFileTypes,
    maxFiles,
    onDrop: (acceptedFiles) => {
      const merged = [...files];

      for (const file of acceptedFiles) {
        const duplicate = merged.some(
          (existing) => existing.name === file.name && existing.size === file.size,
        );

        if (!duplicate && merged.length < maxFiles) {
          merged.push(file);
        }
      }

      onChange(merged);
    },
  });

  function removeFile(targetFile: File) {
    onChange(
      files.filter(
        (file) => !(file.name === targetFile.name && file.size === targetFile.size),
      ),
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div
        {...dropzone.getRootProps()}
        className="rounded-3xl border border-dashed border-primary/25 bg-secondary/35 p-6 text-center transition-colors hover:border-primary/45 hover:bg-secondary/55"
      >
        <input {...dropzone.getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Drop files here or click to browse.</p>
            <p className="text-sm text-muted-foreground">PDF, JPG, and PNG are accepted.</p>
          </div>
        </div>
      </div>

      {files.length > 0 ? (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between gap-4 rounded-2xl border bg-white/90 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
