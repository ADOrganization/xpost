import Link from "next/link";
import {
  MessageSquareText,
  Clock,
  Users,
  Image,
  Shield,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const features = [
  {
    icon: MessageSquareText,
    title: "Thread Builder",
    description:
      "Compose multi-tweet threads with a visual editor. Drag to reorder, preview before publishing.",
  },
  {
    icon: Clock,
    title: "Smart Scheduling",
    description:
      "Pick the perfect time. Posts publish automatically, every minute on the dot.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite your team. Assign roles: Owner, Editor, Viewer. Share one queue.",
  },
  {
    icon: Image,
    title: "Image Support",
    description:
      "Upload up to 4 images per tweet with alt text. Drag and drop for easy uploads.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "OAuth tokens encrypted with AES-256-GCM. Your credentials are never stored in plain text.",
  },
  {
    icon: Calendar,
    title: "Calendar View",
    description:
      "See your scheduled posts on a monthly calendar. Drag and drop to reschedule.",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-6 pt-32 pb-24 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Schedule your X posts
          <br />
          with confidence
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Free, secure scheduling and team collaboration for X. Draft threads,
          upload images, and publish on your schedule.
        </p>

        <Button asChild size="lg" className="mt-10 gap-2 text-base">
          <Link href="/login">
            Get Started &mdash; It&apos;s Free
            <ArrowRight className="size-4" />
          </Link>
        </Button>

        {/* ── Dashboard Mockup ─────────────────────────────────────── */}
        <div className="mt-20 w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="size-3 rounded-full bg-[#f4212e]" />
            <span className="size-3 rounded-full bg-[#ffd400]" />
            <span className="size-3 rounded-full bg-[#00ba7c]" />
            <span className="ml-4 text-xs text-muted-foreground">
              XPost Dashboard
            </span>
          </div>

          {/* Body */}
          <div className="grid grid-cols-[200px_1fr] max-sm:grid-cols-1">
            {/* Sidebar */}
            <div className="hidden border-r border-border p-4 sm:block">
              <div className="mb-6 text-sm font-semibold text-foreground">
                XPost
              </div>
              {["Queue", "Drafts", "Published", "Calendar", "Settings"].map(
                (item) => (
                  <div
                    key={item}
                    className={`mb-1 rounded-md px-3 py-2 text-sm ${
                      item === "Queue"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item}
                  </div>
                )
              )}
            </div>

            {/* Main content area */}
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">
                  Scheduled Posts
                </div>
                <div className="h-7 w-24 rounded-md bg-primary/20" />
              </div>

              {/* Placeholder post cards */}
              <div className="space-y-3">
                {[
                  {
                    time: "Today, 3:00 PM",
                    lines: ["w-3/4", "w-1/2"],
                    hasImage: true,
                  },
                  {
                    time: "Today, 6:30 PM",
                    lines: ["w-5/6", "w-2/3"],
                    hasImage: false,
                  },
                  {
                    time: "Tomorrow, 9:00 AM",
                    lines: ["w-2/3", "w-1/3"],
                    hasImage: true,
                  },
                ].map((post) => (
                  <div
                    key={post.time}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {post.time}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Scheduled
                      </span>
                    </div>
                    <div className="space-y-2">
                      {post.lines.map((w) => (
                        <div
                          key={w}
                          className={`h-3 ${w} rounded bg-muted`}
                        />
                      ))}
                    </div>
                    {post.hasImage && (
                      <div className="mt-3 h-16 w-full rounded-md bg-muted" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything you need to own your schedule
        </h2>
        <p className="mx-auto mb-16 max-w-2xl text-center text-muted-foreground">
          A complete toolkit for scheduling, drafting, and collaborating on X
          posts — without paying a dime.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="border-border bg-card transition-colors hover:border-primary/30"
            >
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent className="-mt-2">
                <CardDescription className="leading-relaxed">
                  {description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="text-sm font-semibold text-foreground">XPost</div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Login
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} XPost. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
