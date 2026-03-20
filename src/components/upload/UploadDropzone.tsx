"use client";

import { useRef, useState } from "react";
import { Upload, Image as ImageIcon, Video, X } from "lucide-react";

interface UploadDropzoneProps {
  onFile: (file: File, previewUrl: string) => Promise<void> | void;
  file: File | null;
  previewUrl: string;
  onClear: () => void;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"];
const MAX_MB = 100;

export function UploadDropzone({ onFile, file, previewUrl, onClear }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function processFile(f: File) {
    setError(null);
    if (!ACCEPTED.includes(f.type)) {
      setError("Unsupported file type. Use JPG, PNG, GIF, WEBP, MP4, or WEBM.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Maximum ${MAX_MB}MB.`);
      return;
    }
    const url = URL.createObjectURL(f);
    await onFile(f, url);
  }

  return (
    <div>
      {!file ? (
        <div
          className={`dropzone${dragging ? " active" : ""}`}
          style={{ padding: "48px 24px", textAlign: "center" }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) processFile(f);
          }}
        >
          <Upload size={28} style={{ color: "var(--ghost)", margin: "0 auto 12px" }} />
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--silver)" }}>
            Drop your artwork here
          </p>
          <p style={{ fontSize: 12, color: "var(--mist)", marginTop: 6 }}>
            JPG · PNG · GIF · WEBP · MP4 · WEBM — max {MAX_MB}MB
          </p>
          <button
            type="button"
            className="btn-ghost"
            style={{ marginTop: 20, fontSize: 12 }}
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
          />
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--wire-bright)",
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={onClear}
            style={{
              position: "absolute", top: 10, right: 10, zIndex: 2,
              background: "rgba(7,8,9,0.8)", border: "1px solid var(--wire-bright)",
              borderRadius: "50%", width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--silver)",
            }}
          >
            <X size={14} />
          </button>

          {file.type.startsWith("video") ? (
            <video
              src={previewUrl}
              controls
              style={{ width: "100%", maxHeight: 360, objectFit: "contain", background: "var(--void)" }}
            />
          ) : (
            <img
              src={previewUrl}
              alt="Preview"
              style={{ width: "100%", maxHeight: 360, objectFit: "contain", background: "var(--void)", display: "block" }}
            />
          )}

          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            {file.type.startsWith("video") ? (
              <Video size={14} style={{ color: "var(--mist)" }} />
            ) : (
              <ImageIcon size={14} style={{ color: "var(--mist)" }} />
            )}
            <span style={{ fontSize: 12, color: "var(--mist)" }}>{file.name}</span>
            <span className="tag" style={{ marginLeft: "auto" }}>
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
        </div>
      )}

      {error && (
        <p style={{ fontSize: 12, color: "var(--crimson)", marginTop: 8 }}>{error}</p>
      )}
    </div>
  );
}
