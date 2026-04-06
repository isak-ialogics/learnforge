"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type QuestionData = {
  id: string;
  content: string;
  type: string;
  difficulty: number;
  options: { label: string; text: string }[];
};

type AnswerResult = {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
  streak: number;
  previousDifficulty: number;
  newDifficulty: number;
  difficultyChanged: boolean;
  session: { totalQuestions: number; correctAnswers: number };
};

export default function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [sessionDifficulty, setSessionDifficulty] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0 });

  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  const fetchNextQuestion = useCallback(
    async (sid: string) => {
      setLoading(true);
      setSelectedAnswer(null);
      setResult(null);

      const res = await fetch(`/api/sessions/${sid}/next`);
      const data = await res.json();

      if (data.done) {
        setDone(true);
        setQuestion(null);
      } else {
        setQuestion(data.question);
        setSessionDifficulty(data.sessionDifficulty);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (sessionId) fetchNextQuestion(sessionId);
  }, [sessionId, fetchNextQuestion]);

  async function submitAnswer() {
    if (!selectedAnswer || !question || !sessionId) return;
    setSubmitting(true);

    const res = await fetch(`/api/sessions/${sessionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: question.id,
        answer: selectedAnswer,
      }),
    });

    const data: AnswerResult = await res.json();
    setResult(data);
    setStats({
      total: data.session.totalQuestions,
      correct: data.session.correctAnswers,
    });
    setSessionDifficulty(data.newDifficulty);
    setSubmitting(false);
  }

  async function endSession() {
    if (!sessionId) return;
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    router.push(`/practice/${sessionId}/results`);
  }

  function nextQuestion() {
    if (sessionId) fetchNextQuestion(sessionId);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-500">Loading question...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            All Done!
          </h2>
          <p className="text-gray-600 mb-2">
            You&apos;ve answered all available questions for this topic.
          </p>
          <p className="text-gray-600 mb-6">
            Score: {stats.correct}/{stats.total} correct
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={endSession}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View Results
            </button>
            <button
              onClick={() => router.push("/practice")}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Topics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Question {stats.total + 1}
            </span>
            <span className="text-sm px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
              Difficulty {sessionDifficulty}/5
            </span>
          </div>
          <div className="flex items-center gap-4">
            {stats.total > 0 && (
              <span className="text-sm text-gray-500">
                {stats.correct}/{stats.total} correct
              </span>
            )}
            <button
              onClick={endSession}
              className="text-sm text-red-600 hover:text-red-700"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Question card */}
        {question && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-lg font-medium text-gray-900 mb-6">
              {question.content}
            </p>

            <div className="space-y-3">
              {question.options.map((option) => {
                let optionStyle =
                  "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";

                if (result) {
                  if (option.label === result.correctAnswer) {
                    optionStyle =
                      "border-green-500 bg-green-50 text-green-900";
                  } else if (
                    option.label === selectedAnswer &&
                    !result.isCorrect
                  ) {
                    optionStyle = "border-red-500 bg-red-50 text-red-900";
                  } else {
                    optionStyle = "border-gray-200 opacity-50";
                  }
                } else if (option.label === selectedAnswer) {
                  optionStyle =
                    "border-indigo-500 bg-indigo-50 text-indigo-900";
                }

                return (
                  <button
                    key={option.label}
                    onClick={() => !result && setSelectedAnswer(option.label)}
                    disabled={!!result}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${optionStyle} disabled:cursor-default`}
                  >
                    <span className="font-semibold mr-3">{option.label}.</span>
                    {option.text}
                  </button>
                );
              })}
            </div>

            {/* Feedback area */}
            {result && (
              <div
                className={`mt-6 p-4 rounded-lg ${
                  result.isCorrect
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p
                  className={`font-semibold ${
                    result.isCorrect ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.isCorrect ? "Correct!" : "Incorrect"}
                </p>
                {result.explanation && (
                  <p className="text-gray-700 mt-1 text-sm">
                    {result.explanation}
                  </p>
                )}
                {result.difficultyChanged && (
                  <p className="text-gray-600 mt-2 text-sm">
                    Difficulty adjusted: {result.previousDifficulty} →{" "}
                    {result.newDifficulty}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex justify-end">
              {!result ? (
                <button
                  onClick={submitAnswer}
                  disabled={!selectedAnswer || submitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Checking..." : "Submit Answer"}
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
