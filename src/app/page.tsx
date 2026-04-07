import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <main className="flex flex-col items-center gap-8 text-center max-w-lg">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            LearnForge
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Practice topics, track your progress, and master what you study.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/practice"
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start Practicing
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-8 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
