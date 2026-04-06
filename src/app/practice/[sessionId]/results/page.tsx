"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Answer = {
  id: string;
  givenAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
  question: {
    id: string;
    content: string;
    answer: string;
    explanation: string | null;
    difficulty: number;
    options: { label: string; text: string }[];
  };
};

type Session = {
  id: string;
  currentDifficulty: number;
  status: string;
  totalQuestions: number;
  correctAnswers: number;
  createdAt: string;
  completedAt: string | null;
  subtopic: {
    name: string;
    topic: {
      name: string;
      subject: { name: string };
    };
  };
  answers: Answer[];
};

export default function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ sessionId }) => {
      fetch(`/api/sessions/${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          setSession(data);
          setLoading(false);
        });
    });
  }, [params]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-500">Loading results...</p>
      </div>
    );
  }

  const accuracy =
    session.totalQuestions > 0
      ? Math.round((session.correctAnswers / session.totalQuestions) * 100)
      : 0;

  const difficulties = session.answers.map((a) => a.question.difficulty);
  const minDifficulty = difficulties.length > 0 ? Math.min(...difficulties) : 0;
  const maxDifficulty = difficulties.length > 0 ? Math.max(...difficulties) : 0;

  const duration =
    session.completedAt && session.createdAt
      ? Math.round(
          (new Date(session.completedAt).getTime() -
            new Date(session.createdAt).getTime()) /
            1000
        )
      : null;

  function formatDuration(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Session Results
          </h1>
          <p className="text-gray-600">
            {session.subtopic.topic.subject.name} &gt;{" "}
            {session.subtopic.topic.name} &gt; {session.subtopic.name}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">{accuracy}%</p>
            <p className="text-sm text-gray-500 mt-1">Accuracy</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">
              {session.correctAnswers}/{session.totalQuestions}
            </p>
            <p className="text-sm text-gray-500 mt-1">Correct</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">
              {minDifficulty}-{maxDifficulty}
            </p>
            <p className="text-sm text-gray-500 mt-1">Difficulty Range</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">
              {duration !== null ? formatDuration(duration) : "-"}
            </p>
            <p className="text-sm text-gray-500 mt-1">Duration</p>
          </div>
        </div>

        {/* Performance bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Performance</span>
            <span>
              {session.correctAnswers} correct,{" "}
              {session.totalQuestions - session.correctAnswers} incorrect
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        {/* Question breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Question Breakdown
          </h2>
          <div className="space-y-4">
            {session.answers.map((answer, i) => (
              <div
                key={answer.id}
                className={`p-4 rounded-lg border ${
                  answer.isCorrect
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-medium ${
                          answer.isCorrect
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        Q{i + 1}
                        {answer.isCorrect ? " — Correct" : " — Incorrect"}
                      </span>
                      <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">
                        Difficulty {answer.question.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-900 text-sm">
                      {answer.question.content}
                    </p>
                    {!answer.isCorrect && (
                      <p className="text-sm text-gray-600 mt-1">
                        Your answer: {answer.givenAnswer} — Correct:{" "}
                        {answer.question.answer}
                      </p>
                    )}
                    {answer.question.explanation && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        {answer.question.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/practice")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Practice Again
          </button>
        </div>
      </div>
    </div>
  );
}
