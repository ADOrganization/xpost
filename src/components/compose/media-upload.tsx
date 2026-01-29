"use client";

import { useRef, useCallback, useState } from "react";
import { ImagePlus, X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { MAX_IMAGES_PER_TWEET, MAX_IMAGE_SIZE_MB, MAX_VIDEO_SIZE_MB, ACCEPTED_MEDIA_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MediaState } from "@/lib/types";

interface MediaUploadProps {
  media: MediaState[];
  onChange: (media: MediaState[]) => void;
  disabled?: boolean;
}

export function MediaUpload({ media, onChange, disabled = false }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [altDialogOpen, setAltDialogOpen] = useState(false);
  const [altDialogIndex, setAltDialogIndex] = useState<number | null>(null);
  const [altDraft, setAltDraft] = useState("");

  const canAdd = media.length < MAX_IMAGES_PER_TWEET && !disabled;

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const remaining = MAX_IMAGES_PER_TWEET - media.length;
      const validFiles = files
        .filter((file) => ACCEPTED_MEDIA_TYPES.includes(file.type))
        .filter((file) => {
          const isVideo = file.type.startsWith("video/");
          const maxSize = (isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB) * 1024 * 1024;
          return file.size <= maxSize;
        })
        .slice(0, remaining);

      if (validFiles.length === 0) return;

      const newMedia: MediaState[] = validFiles.map((file) => ({
        url: URL.createObjectURL(file),
        altText: "",
        file,
        mediaType: file.type.startsWith("video/")
          ? "VIDEO"
          : file.type === "image/gif"
          ? "GIF"
          : "IMAGE",
      }));

      onChange([...media, ...newMedia]);
    },
    [media, onChange]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    processFiles(e.dataTransfer.files);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  }

  function handleRemove(index: number) {
    onChange(media.filter((_, i) => i !== index));
  }

  function openAltDialog(index: number) {
    setAltDialogIndex(index);
    setAltDraft(media[index].altText);
    setAltDialogOpen(true);
  }

  function saveAltText() {
    if (altDialogIndex === null) return;
    const updated = media.map((m, i) =>
      i === altDialogIndex ? { ...m, altText: altDraft } : m
    );
    onChange(updated);
    setAltDialogOpen(false);
    setAltDialogIndex(null);
    setAltDraft("");
  }

  return (
    <div className="space-y-3">
      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {media.map((m, index) => (
            <div
              key={`${m.url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              {m.mediaType === "VIDEO" ? (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <Video className="size-8 text-muted-foreground" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt={m.altText || `Media ${index + 1}`}
                  className="size-full object-cover"
                />
              )}

              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1.5 right-1.5 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleRemove(index)}
                type="button"
              >
                <X className="size-3" />
              </Button>

              {m.mediaType !== "VIDEO" && (
                <button
                  type="button"
                  className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity hover:bg-black/90 group-hover:opacity-100"
                  onClick={() => openAltDialog(index)}
                >
                  {m.altText ? "ALT" : "+ALT"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
        >
          <ImagePlus className="size-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Drop images or videos here
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            Images: {MAX_IMAGE_SIZE_MB}MB max | Videos: {MAX_VIDEO_SIZE_MB}MB max
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MEDIA_TYPES.join(",")}
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      <Dialog open={altDialogOpen} onOpenChange={setAltDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alt text</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Describe this image for people who use screen readers.
          </p>
          {altDialogIndex !== null && media[altDialogIndex] && (
            <div className="overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media[altDialogIndex].url}
                alt="Preview"
                className="max-h-40 w-full object-cover"
              />
            </div>
          )}
          <Input
            value={altDraft}
            onChange={(e) => setAltDraft(e.target.value)}
            placeholder="Describe this image..."
            maxLength={1000}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button onClick={saveAltText} type="button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
