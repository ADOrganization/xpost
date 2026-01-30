export interface FeedbackUser {
  id: string;
  name: string | null;
  image: string | null;
}

export interface FeedbackComment {
  id: string;
  content: string;
  createdAt: string;
  user: FeedbackUser;
}

export interface FeedbackSuggestion {
  id: string;
  threadItemPosition: number;
  suggestedText: string;
  note: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  user: FeedbackUser;
}

export interface ThreadItemInfo {
  position: number;
  text: string;
}

export const SUGGESTION_STATUS_STYLE: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-green-500/10 text-green-600 border-green-500/30",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-500/10 text-red-600 border-red-500/30",
  },
};
