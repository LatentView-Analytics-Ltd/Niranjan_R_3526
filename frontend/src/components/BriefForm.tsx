import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/apiClient';
import { SAMPLE_BRIEFS, SampleBriefKey } from '../data/sampleBriefs';
import type { CampaignBrief, ClarifyingQuestionsResponse } from '../types';

interface BriefFormProps {
  onSubmit: (brief: CampaignBrief, questions: ClarifyingQuestionsResponse) => void;
}

export default function BriefForm({ onSubmit }: BriefFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedTemplate, setLoadedTemplate] = useState<SampleBriefKey | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showSmartFill, setShowSmartFill] = useState(false);
  const [smartFillText, setSmartFillText] = useState('');
  const [smartFillLoading, setSmartFillLoading] = useState(false);
  const [smartFillError, setSmartFillError] = useState<string | null>(null);
  const [smartFillProgress, setSmartFillProgress] = useState(0);
  const [smartFillStage, setSmartFillStage] = useState('');
  const [showCriteria, setShowCriteria] = useState(false);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const analyzeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const emptyBrief: CampaignBrief = {
    campaign_name: '',
    business_objective: '',
    target_audience: '',
    key_message: '',
    channels: '',
    budget: '',
    timeline: '',
    success_metrics: '',
    constraints: '',
  };

  const [formData, setFormData] = useState<CampaignBrief>(emptyBrief);

  // Brief completeness scoring
  type FieldStrength = 'empty' | 'weak' | 'good' | 'strong';

  const fieldWeights: Record<keyof CampaignBrief, number> = {
    campaign_name: 5,
    business_objective: 15,
    target_audience: 15,
    key_message: 15,
    channels: 10,
    budget: 10,
    timeline: 10,
    success_metrics: 15,
    constraints: 5,
  };

  const getFieldStrength = (field: keyof CampaignBrief, value: string | undefined): FieldStrength => {
    if (!value || value.trim().length === 0) return 'empty';
    const len = value.trim().length;
    const hasNumbers = /\d/.test(value);
    const hasPercentages = /%/.test(value);
    const hasSpecifics = hasNumbers || hasPercentages || len > 80;
    if (field === 'campaign_name') return len > 5 ? (len > 15 ? 'strong' : 'good') : 'weak';
    if (hasSpecifics && len > 50) return 'strong';
    if (len > 30) return 'good';
    return 'weak';
  };

  const strengthScore: Record<FieldStrength, number> = { empty: 0, weak: 0.4, good: 0.7, strong: 1.0 };

  const completenessData = useMemo(() => {
    const fields = Object.keys(fieldWeights) as (keyof CampaignBrief)[];
    const fieldStatuses: Record<string, FieldStrength> = {};
    let score = 0;
    for (const field of fields) {
      const strength = getFieldStrength(field, formData[field]);
      fieldStatuses[field] = strength;
      score += fieldWeights[field] * strengthScore[strength];
    }
    return { score: Math.round(score), fieldStatuses };
  }, [formData]);

  const getStrengthColor = (s: FieldStrength) => {
    if (s === 'strong') return 'bg-emerald-400';
    if (s === 'good') return 'bg-green-400';
    if (s === 'weak') return 'bg-amber-400';
    return 'bg-gray-200';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    if (score > 0) return 'text-orange-400';
    return 'text-gray-300';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'from-emerald-400 to-emerald-500';
    if (score >= 50) return 'from-amber-400 to-amber-500';
    if (score > 0) return 'from-orange-300 to-orange-400';
    return 'from-gray-200 to-gray-300';
  };

  const handleChange = (field: keyof CampaignBrief, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const loadSampleBrief = (key: SampleBriefKey) => {
    setFormData(SAMPLE_BRIEFS[key]);
    setLoadedTemplate(key);
    setShowHint(false);
    setError(null);
  };

  const revertTemplate = () => {
    setFormData(emptyBrief);
    setLoadedTemplate(null);
    setError(null);
  };

  const progressStages = [
    { at: 5, label: 'Sending to AI...' },
    { at: 15, label: 'Reading your description...' },
    { at: 30, label: 'Identifying campaign details...' },
    { at: 50, label: 'Extracting fields...' },
    { at: 70, label: 'Structuring brief...' },
    { at: 85, label: 'Almost there...' },
  ];

  const startProgress = () => {
    setSmartFillProgress(0);
    setSmartFillStage('Preparing...');
    let current = 0;
    progressTimer.current = setInterval(() => {
      current += Math.random() * 4 + 1;
      if (current > 90) current = 90;
      const stage = [...progressStages].reverse().find(s => current >= s.at);
      if (stage) setSmartFillStage(stage.label);
      setSmartFillProgress(Math.round(current));
    }, 300);
  };

  const stopProgress = (success: boolean) => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    if (success) {
      setSmartFillProgress(100);
      setSmartFillStage('Done!');
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      if (analyzeTimer.current) clearInterval(analyzeTimer.current);
    };
  }, []);

  const handleSmartFill = async () => {
    if (!smartFillText.trim()) return;
    setSmartFillLoading(true);
    setSmartFillError(null);
    startProgress();

    try {
      const filled = await api.smartFill(smartFillText);
      stopProgress(true);
      // Brief pause to show 100% before closing
      await new Promise(r => setTimeout(r, 600));
      setFormData(filled);
      setLoadedTemplate(null);
      setShowHint(false);
      setShowSmartFill(false);
      setSmartFillText('');
    } catch (err) {
      stopProgress(false);
      setSmartFillError(err instanceof Error ? err.message : 'Smart fill failed');
    } finally {
      setSmartFillLoading(false);
      setSmartFillProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAnalyzeProgress(0);

    let current = 0;
    analyzeTimer.current = setInterval(() => {
      current += Math.random() * 5 + 2;
      if (current > 92) current = 92;
      setAnalyzeProgress(Math.round(current));
    }, 250);

    try {
      const questions = await api.analyzeBrief(formData);
      if (analyzeTimer.current) clearInterval(analyzeTimer.current);
      setAnalyzeProgress(100);
      await new Promise(r => setTimeout(r, 400));
      onSubmit(formData, questions);
    } catch (err) {
      if (analyzeTimer.current) clearInterval(analyzeTimer.current);
      setError(err instanceof Error ? err.message : 'Failed to analyze brief');
    } finally {
      setLoading(false);
      setAnalyzeProgress(0);
    }
  };

  return (
    <div className="w-full">
      <div className="card">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-800">Campaign Brief</h2>
              {/* Info tooltip — inline next to title */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowInfoTooltip(prev => !prev)}
                  onMouseEnter={() => setShowInfoTooltip(true)}
                  onMouseLeave={() => { if (!showInfoTooltip) return; }}
                  className="w-5 h-5 rounded-full border border-gray-200 text-gray-300 hover:text-gray-500 hover:border-gray-300 flex items-center justify-center text-xs transition-colors"
                >
                  ?
                </button>
                {showInfoTooltip && (
                  <div className="absolute left-0 top-8 w-80 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-30">
                    <div className="absolute -top-1.5 left-4 w-3 h-3 bg-gray-800 rotate-45" />
                    <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-700">
                      <p className="font-medium">Brief Fields Guide</p>
                      <button
                        type="button"
                        onClick={() => setShowInfoTooltip(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <ul className="space-y-1.5 text-gray-300 px-3 py-2.5 max-h-56 overflow-y-auto scrollbar-thin">
                      <li><span className="text-white font-medium">Campaign Name</span> — A short identifier for your campaign</li>
                      <li><span className="text-white font-medium">Business Objective</span> — Quantified goals you want to achieve</li>
                      <li><span className="text-white font-medium">Target Audience</span> — Who you're reaching (roles, industries, company size)</li>
                      <li><span className="text-white font-medium">Key Message</span> — The one thing you want the audience to believe</li>
                      <li><span className="text-white font-medium">Channels</span> — Where you'll run the campaign (email, social, webinar, etc.)</li>
                      <li><span className="text-white font-medium">Budget</span> — Total spend limit for the campaign</li>
                      <li><span className="text-white font-medium">Timeline</span> — Start date, end date, and key milestones</li>
                      <li><span className="text-white font-medium">Success Metrics</span> — KPIs and targets to measure results</li>
                      <li><span className="text-white font-medium">Constraints / Brand Notes</span> — Compliance rules, brand guidelines, or restrictions</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Enter your campaign details or load a sample to get started
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Smart Fill button */}
            <button
              type="button"
              onClick={() => { setShowSmartFill(true); setSmartFillError(null); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-violet-600 bg-violet-50 border border-violet-100 rounded-lg hover:bg-violet-100 hover:border-violet-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Smart Fill
            </button>

            <div className="w-px h-6 bg-gray-100" />

            {/* Hint for new users */}
            <div className="relative">
              {showHint && !loadedTemplate && (
                <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg animate-pulse">
                  <span className="text-xs font-medium text-indigo-500">New here? Try a sample</span>
                  <span className="text-indigo-300">→</span>
                  <button
                    type="button"
                    onClick={() => setShowHint(false)}
                    className="ml-0.5 text-indigo-300 hover:text-indigo-500 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => loadSampleBrief('b2b_saas')}
              className={`btn-secondary text-xs ${loadedTemplate === 'b2b_saas' ? 'border-slate-400 bg-slate-50' : ''}`}
            >
              B2B SaaS Sample
            </button>
            <button
              type="button"
              onClick={() => loadSampleBrief('b2c_retail')}
              className={`btn-secondary text-xs ${loadedTemplate === 'b2c_retail' ? 'border-slate-400 bg-slate-50' : ''}`}
            >
              B2C Retail Sample
            </button>
            {loadedTemplate && (
              <button
                type="button"
                onClick={revertTemplate}
                className="text-xs text-gray-400 hover:text-red-400 px-3 py-2 rounded-lg border border-gray-100 hover:border-red-100 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                Revert
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50/60 border border-red-100 rounded-lg">
            <p className="text-sm font-medium text-red-600">Error</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
        )}

        {/* Brief Completeness Score */}
        <div className="mb-6 p-4 bg-slate-50/70 border border-slate-100 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Brief Completeness</span>
            <span className={`text-lg font-bold ${getScoreColor(completenessData.score)}`}>{completenessData.score}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getBarColor(completenessData.score)} transition-all duration-500 ease-out`}
              style={{ width: `${completenessData.score}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCriteria(prev => !prev)}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className={`w-3 h-3 transition-transform duration-200 ${showCriteria ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {showCriteria ? 'Hide field scores' : 'View field scores'}
          </button>
          {showCriteria && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
              {(Object.keys(fieldWeights) as (keyof CampaignBrief)[]).map(field => {
                const strength = completenessData.fieldStatuses[field];
                const pct = Math.round(strengthScore[strength] * 100);
                const pctColor = pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : pct > 0 ? 'text-orange-400' : 'text-gray-300';
                return (
                  <div key={field} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${getStrengthColor(strength)} transition-colors duration-300`} />
                    <span className="text-[10px] text-gray-500 capitalize">{field.replace(/_/g, ' ')}</span>
                    <span className={`text-[10px] font-semibold ${pctColor} transition-colors duration-300`}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Campaign Name *
            </label>
            <input
              type="text"
              required
              value={formData.campaign_name}
              onChange={e => handleChange('campaign_name', e.target.value)}
              className="input-field"
              placeholder="e.g., Q3 Enterprise Trial-to-Paid Push"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Business Objective *
            </label>
            <textarea
              required
              rows={3}
              value={formData.business_objective}
              onChange={e => handleChange('business_objective', e.target.value)}
              className="textarea-field"
              placeholder="What is the business trying to achieve? Include quantified goals."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Target Audience *
            </label>
            <textarea
              required
              rows={3}
              value={formData.target_audience}
              onChange={e => handleChange('target_audience', e.target.value)}
              className="textarea-field"
              placeholder="Who are you trying to reach? Include job titles, company sizes, industries."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Key Message *
            </label>
            <textarea
              required
              rows={2}
              value={formData.key_message}
              onChange={e => handleChange('key_message', e.target.value)}
              className="textarea-field"
              placeholder="The single thing you want the audience to believe"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Channels *
            </label>
            <input
              type="text"
              required
              value={formData.channels}
              onChange={e => handleChange('channels', e.target.value)}
              className="input-field"
              placeholder="e.g., Email, LinkedIn, social"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Budget
              </label>
              <input
                type="text"
                value={formData.budget}
                onChange={e => handleChange('budget', e.target.value)}
                className="input-field"
                placeholder="e.g., $50,000 or Not specified"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Timeline *
              </label>
              <input
                type="text"
                required
                value={formData.timeline}
                onChange={e => handleChange('timeline', e.target.value)}
                className="input-field"
                placeholder="e.g., Campaign live by July 1"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Success Metrics *
            </label>
            <textarea
              required
              rows={2}
              value={formData.success_metrics}
              onChange={e => handleChange('success_metrics', e.target.value)}
              className="textarea-field"
              placeholder="How will you know the campaign worked?"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Constraints / Brand Notes
            </label>
            <textarea
              rows={3}
              value={formData.constraints}
              onChange={e => handleChange('constraints', e.target.value)}
              className="textarea-field"
              placeholder="Any mandatory inclusions, exclusions, tone guidelines, or legal restrictions"
            />
          </div>

          <div className="flex justify-end pt-5 border-t border-gray-100">
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
                        strokeDashoffset={`${2 * Math.PI * 10 * (1 - analyzeProgress / 100)}`}
                        className="transition-all duration-200"
                      />
                    </svg>
                  </div>
                  Analyzing... {analyzeProgress}%
                </>
              ) : (
                'Analyze Brief & Continue'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Smart Fill Modal */}
      {showSmartFill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !smartFillLoading && setShowSmartFill(false)} />
          <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Smart Fill with AI</h3>
                  <p className="text-xs text-gray-400">Describe your campaign and AI will fill the form</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !smartFillLoading && setShowSmartFill(false)}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Field guide */}
            <div className="px-6 pt-4">
              <div className="bg-slate-50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-gray-500 mb-1.5">For best results, try to mention:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Campaign name', 'Business objective', 'Target audience', 'Key message', 'Channels', 'Budget', 'Timeline', 'Success metrics', 'Constraints'].map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-white border border-gray-100 rounded-md text-gray-500">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Textarea / Progress */}
            {smartFillLoading ? (
              <div className="px-6 py-10 flex flex-col items-center justify-center">
                {/* Progress ring */}
                <div className="relative w-24 h-24 mb-5">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={smartFillProgress === 100 ? '#10b981' : '#8b5cf6'}
                      strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - smartFillProgress / 100)}`}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xl font-semibold ${
                      smartFillProgress === 100 ? 'text-emerald-500' : 'text-violet-600'
                    }`}>
                      {smartFillProgress}%
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">{smartFillStage}</p>
                <p className="text-xs text-gray-400 mt-1">AI is extracting your campaign details</p>
              </div>
            ) : (
              <div className="px-6 py-4">
                <textarea
                  rows={8}
                  value={smartFillText}
                  onChange={e => setSmartFillText(e.target.value)}
                  className="textarea-field text-sm"
                  placeholder="e.g., We're launching a cloud migration campaign targeting CTOs and IT Directors at mid-market companies (500-2000 employees) in financial services. The goal is to generate 150 qualified leads and book 40 demos by end of Q3. We'll use LinkedIn sponsored posts, a 6-part email nurture sequence, and a webinar series. Budget is $35,000. Key message: &quot;Migrate to cloud in 90 days with zero downtime.&quot; We need everything live by June 15. No mentioning competitor names, and all content must be FINRA compliant. Success looks like 3% email CTR and 25% webinar attendance rate."
                />
                {smartFillError && (
                  <p className="text-xs text-red-500 mt-2">{smartFillError}</p>
                )}
              </div>
            )}

            {/* Modal footer */}
            {!smartFillLoading && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowSmartFill(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSmartFill}
                  disabled={!smartFillText.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Let AI Fill
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
