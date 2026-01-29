export type MediaState = {
  url: string;
  altText: string;
  file?: File;
  mediaType: "IMAGE" | "VIDEO" | "GIF";
};

// Keep backward compat alias
export type ImageState = MediaState;

export type ThreadItemState = {
  id: string;
  text: string;
  images: MediaState[];
  pollOptions: string[];
};

export type XAccountOption = {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
};
