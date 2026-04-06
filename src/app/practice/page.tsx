"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Subtopic = {
  id: string;
  name: string;
  _count: { questions: number };
};

type Topic = {
  id: string;
  name: string;
  subtopics: Subtopic[];
};

type Subject = {
  id: string;
  name: string;
  topics: Topic[];
};

export default function PracticePage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        setSubjects(data);
        setLoading(false);
      });
  }, []);

  async function startSession(subtopicId: string) {
    setStarting(subtopicId);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtopicId }),
    });
    const session = await res.json();
    router.push(`/practice/${session.id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-500">Loading subjects...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice</h1>
        <p className="text-gray-600 mb-8">
          Choose a topic to start a practice session.
        </p>

        {subjects.map((subject) => (
          <div key={subject.id} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {subject.name}
            </h2>
            {subject.topics.map((topic) => (
              <div key={topic.id} className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  {topic.name}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {topic.subtopics.map((subtopic) => (
                    <button
                      key={subtopic.id}
                      onClick={() => startSession(subtopic.id)}
                      disabled={
                        subtopic._count.questions === 0 ||
                        starting === subtopic.id
                      }
                      className="text-left p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="font-medium text-gray-900">
                        {subtopic.name}
                      </span>
                      <span className="block text-sm text-gray-500 mt-1">
                        {subtopic._count.questions} question
                        {subtopic._count.questions !== 1 ? "s" : ""}
                      </span>
                      {starting === subtopic.id && (
                        <span className="block text-sm text-indigo-600 mt-1">
                          Starting...
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        {subjects.length === 0 && (
          <p className="text-gray-500">
            No subjects available. Run the seed script first.
          </p>
        )}
      </div>
    </div>
  );
}
