"use client";

import { useRef, useCallback, useState } from "react";
import { ImagePlus, X } from "lucide-react";
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
import { MAX_IMAGES_PER_TWEET, MAX_IMAGE_SIZE_MB } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ImageState } from "@/lib/types";

interface ImageUploadProps {
  images: ImageState[];
  onChange: (images: ImageState[]) => void;
  disabled?: boolean;
}

export function ImageUpload({
  images,
  onChange,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [altDialogOpen, setAltDialogOpen] = useState(false);
  const [altDialogIndex, setAltDialogIndex] = useState<number | null>(null);
  const [altDraft, setAltDraft] = useState("");

  const canAdd = images.length < MAX_IMAGES_PER_TWEET && !disabled;
  const maxSizeBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const remaining = MAX_IMAGES_PER_TWEET - images.length;
      const validFiles = files
        .filter((file) => file.type.startsWith("image/"))
        .filter((file) => file.size <= maxSizeBytes)
        .slice(0, remaining);

      if (validFiles.length === 0) return;

      const newImages: ImageState[] = validFiles.map((file) => ({
        url: URL.createObjectURL(file),
        altText: "",
        file,
        mediaType: "IMAGE" as const,
      }));

      onChange([...images, ...newImages]);
    },
    [images, onChange, maxSizeBytes]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    processFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  }

  function handleRemove(index: number) {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  }

  function openAltDialog(index: number) {
    setAltDialogIndex(index);
    setAltDraft(images[index].altText);
    setAltDialogOpen(true);
  }

  function saveAltText() {
    if (altDialogIndex === null) return;
    const updated = images.map((img, i) =>
      i === altDialogIndex ? { ...img, altText: altDraft } : img
    );
    onChange(updated);
    setAltDialogOpen(false);
    setAltDialogIndex(null);
    setAltDraft("");
  }

  return (
    <div className="space-y-3">
      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.altText || `Image ${index + 1}`}
                className="size-full object-cover"
              />

              {/* Remove button */}
              <Button
                variant="destructive"
                size="icon-xs"
                className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleRemove(index)}
                type="button"
              >
                <X className="size-3" />
                <span className="sr-only">Remove image</span>
              </Button>

              {/* Alt text button */}
              <button
                type="button"
                className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity hover:bg-black/90 group-hover:opacity-100"
                onClick={() => openAltDialog(index)}
              >
                {image.altText ? "ALT" : "+ALT"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / browse button */}
      {canAdd && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
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
            Drop images here or click to browse
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            Max {MAX_IMAGES_PER_TWEET} images, {MAX_IMAGE_SIZE_MB}MB each
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Alt text dialog */}
      <Dialog open={altDialogOpen} onOpenChange={setAltDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alt text</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Describe this image for people who use screen readers.
          </p>
          {altDialogIndex !== null && images[altDialogIndex] && (
            <div className="overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[altDialogIndex].url}
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
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={saveAltText} type="button">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
