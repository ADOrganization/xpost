export type ImageState = {
  url: string;
  altText: string;
  file?: File;
};

export type ThreadItemState = {
  id: string;
  text: string;
  images: ImageState[];
  pollOptions: string[];
};

export type XAccountOption = {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
};
