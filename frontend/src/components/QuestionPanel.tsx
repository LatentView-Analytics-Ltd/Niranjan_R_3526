import { useState, useRef, useEffect } from 'react';
import api from '../services/apiClient';
import type {
  CampaignBrief,
  ClarifyingQuestionsResponse,
  QuestionAnswer,
  ExecutionPlan,
} from '../types';

interface QuestionPanelProps {
  brief: CampaignBrief;
  questions: ClarifyingQuestionsResponse;
  onSubmit: (answers: QuestionAnswer[], plan: ExecutionPlan) => void;
  onBack: () => void;
}

export default function QuestionPanel({ brief, questions, onSubmit, onBack }: QuestionPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generateProgress, setGenerateProgress] = useState(0);
  const generateTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (generateTimer.current) clearInterval(generateTimer.current); };
  }, []);

  const startGenerateProgress = () => {
    setGenerateProgress(0);
    let current = 0;
    generateTimer.current = setInterval(() => {
      current += Math.random() * 5 + 2;
      if (current > 92) current = 92;
      setGenerateProgress(Math.round(current));
    }, 250);
  };

  const stopGenerateProgress = (success: boolean) => {
    if (generateTimer.current) clearInterval(generateTimer.current);
    if (success) setGenerateProgress(100);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const answersList: QuestionAnswer[] = Object.entries(answers).map(([question_id, answer]) => ({
      question_id,
      answer,
    }));

    setLoading(true);
    setError(null);
    startGenerateProgress();

    try {
      const plan = await api.generatePlan(brief, answersList);
      stopGenerateProgress(true);
      await new Promise(r => setTimeout(r, 400));
      onSubmit(answersList, plan);
    } catch (err) {
      stopGenerateProgress(false);
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setLoading(false);
      setGenerateProgress(0);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    setError(null);
    startGenerateProgress();

    try {
      const plan = await api.generatePlan(brief, []);
      stopGenerateProgress(true);
      await new Promise(r => setTimeout(r, 400));
      onSubmit([], plan);
    } catch (err) {
      stopGenerateProgress(false);
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setLoading(false);
      setGenerateProgress(0);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const classes = {
      critical: 'badge-critical',
      high: 'badge-high',
      medium: 'badge-medium',
      low: 'badge-low',
    };
    return classes[priority as keyof typeof classes] || 'badge-low';
  };

  return (
    <div className="w-full space-y-6">
      {/* Summary Card */}
      <div className="card border-slate-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Brief Analysis Complete
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          We found <span className="font-medium text-gray-700">{questions.gaps_identified.length}</span> gaps in your brief.
          Answer the questions below to refine your execution plan.
        </p>
        {questions.gaps_identified.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Gaps Identified</p>
            <ul className="space-y-1 text-sm text-gray-500">
              {questions.gaps_identified.map((gap, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">·</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50/60 border border-red-100 rounded-lg">
          <p className="text-sm font-medium text-red-600">Error</p>
          <p className="text-xs text-red-500 mt-0.5">{error}</p>
        </div>
      )}

      {/* Questions Form */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Clarifying Questions</h2>

        {questions.questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              Your brief has enough information to generate a plan!
            </p>
            <button
              onClick={handleSkip}
              disabled={loading}
              className="btn-primary mt-4"
            >
              Generate Execution Plan
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-100 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-400">
                        Q{index + 1}
                      </span>
                      <span className={getPriorityBadge(question.priority)}>
                        {question.priority}
                      </span>
                      <span className="text-xs text-gray-300">
                        {question.field_related}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1.5">
                      {question.question}
                    </p>
                    <p className="text-xs text-gray-400">
                      {question.context}
                    </p>
                  </div>
                </div>

                {question.options && question.options.length > 0 ? (
                  <div className="mt-3">
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className="flex items-center space-x-3 p-2.5 border border-gray-100 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={e => handleAnswerChange(question.id, e.target.value)}
                            className="h-4 w-4 text-slate-600 focus:ring-slate-400"
                          />
              <span className="text-gray-600">{option}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Or provide your own answer..."
                        value={!question.options.includes(answers[question.id] || '') ? answers[question.id] || '' : ''}
                        onChange={e => handleAnswerChange(question.id, e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    value={answers[question.id] || ''}
                    onChange={e => handleAnswerChange(question.id, e.target.value)}
                    className="textarea-field mt-3"
                    placeholder="Your answer..."
                  />
                )}
              </div>
            ))}

            <div className="flex justify-between items-center pt-5 border-t border-gray-100">
              <button
                type="button"
                onClick={onBack}
                className="btn-secondary"
              >
                Back to Brief
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="btn-secondary"
                >
                  Skip & Generate Plan
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="relative w-5 h-5">
                        <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
                          <circle
                            cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 10}`}
                            strokeDashoffset={`${2 * Math.PI * 10 * (1 - generateProgress / 100)}`}
                            className="transition-all duration-200"
                          />
                        </svg>
                      </div>
                      Generating... {generateProgress}%
                    </>
                  ) : (
                    'Generate Execution Plan'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
