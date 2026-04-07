"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type SessionRow = {
  id: string;
  date: string;
  completedAt: string | null;
  subtopic: string;
  topic: string;
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  difficultyReached: number;
  status: string;
};

type SubtopicStat = {
  subtopicId: string;
  subtopic: string;
  topic: string;
  subject: string;
  sessions: number;
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number;
};

type DashboardData = {
  overall: {
    totalSessions: number;
    totalQuestions: number;
    totalCorrect: number;
    accuracy: number;
  };
  sessions: SessionRow[];
  subtopicStats: SubtopicStat[];
};

function AccuracyBar({ value }: { value: number }) {
  const color =
    value >= 80
      ? "bg-green-500"
      : value >= 60
      ? "bg-yellow-500"
      : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-10 text-right">
        {value}%
      </span>
    </div>
  );
}

function DifficultyBadge({ level }: { level: number }) {
  const labels = ["", "Beginner", "Easy", "Medium", "Hard", "Expert"];
  const colors = [
    "",
    "bg-green-100 text-green-800",
    "bg-blue-100 text-blue-800",
    "bg-yellow-100 text-yellow-800",
    "bg-orange-100 text-orange-800",
    "bg-red-100 text-red-800",
  ];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[level] ?? ""}`}
    >
      {labels[level] ?? `Level ${level}`}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    ABANDONED: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!data) return null;

  const { overall, sessions, subtopicStats } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Your practice history and performance.</p>
          </div>
          <Link
            href="/practice"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Practice Now
          </Link>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {overall.totalSessions}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Questions Answered</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {overall.totalQuestions}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Correct Answers</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {overall.totalCorrect}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Overall Accuracy</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {overall.accuracy}%
            </p>
            <div className="mt-2">
              <AccuracyBar value={overall.accuracy} />
            </div>
          </div>
        </div>

        {/* Per-Topic Performance */}
        {subtopicStats.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Performance by Subtopic
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {subtopicStats.map((st) => (
                <div key={st.subtopicId} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{st.subtopic}</p>
                      <p className="text-xs text-gray-500">
                        {st.subject} › {st.topic}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <span>
                        {st.totalCorrect}/{st.totalQuestions} correct
                      </span>
                      <span className="ml-3">
                        {st.sessions} session{st.sessions !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <AccuracyBar value={st.accuracy} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session History */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Session History
            </h2>
          </div>

          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">No sessions yet.</p>
              <Link
                href="/practice"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Start your first session →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="px-6 py-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-gray-900 truncate">
                        {s.subtopic}
                      </p>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {s.subject} › {s.topic} · {formatDate(s.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {s.correctAnswers}/{s.totalQuestions}
                      </p>
                      <p className="text-xs text-gray-500">correct</p>
                    </div>
                    <div className="w-20">
                      <AccuracyBar value={s.accuracy} />
                    </div>
                    <DifficultyBadge level={s.difficultyReached} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
