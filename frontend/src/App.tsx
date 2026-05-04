import { useState, useEffect, useCallback } from 'react';
import BriefForm from './components/BriefForm';
import QuestionPanel from './components/QuestionPanel';
import PlanViewer from './components/PlanViewer';
import QAReportPanel from './components/QAReportPanel';
import ConsistencyPanel from './components/ConsistencyPanel';
import CampaignSidebar from './components/CampaignSidebar';
import api from './services/apiClient';
import type {
  CampaignBrief,
  ClarifyingQuestionsResponse,
  QuestionAnswer,
  ExecutionPlan,
  QAReport,
  ConsistencyReport,
  PlanVersion,
  CampaignSession,
  WorkflowStep,
} from './types';

const STORAGE_KEY = 'launchpilot_sessions';

function loadSessions(): CampaignSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: CampaignSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function newSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function App() {
  const [sessions, setSessions] = useState<CampaignSession[]>(loadSessions);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Current working state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('brief');
  const [brief, setBrief] = useState<CampaignBrief | null>(null);
  const [questionsData, setQuestionsData] = useState<ClarifyingQuestionsResponse | null>(null);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [qaReport, setQAReport] = useState<QAReport | null>(null);
  const [consistencyReport, setConsistencyReport] = useState<ConsistencyReport | null>(null);
  const [planVersions, setPlanVersions] = useState<PlanVersion[]>([]);
  const [currentPlanVersion, setCurrentPlanVersion] = useState(1);
  const [isFixing, setIsFixing] = useState(false);

  // Persist sessions to localStorage whenever they change
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Save current state into active session
  const persistCurrentSession = useCallback((
    overrides?: Partial<Pick<CampaignSession, 'step' | 'brief' | 'questionsData' | 'answers' | 'plan' | 'qaReport' | 'consistencyReport' | 'planVersions' | 'name'>>
  ) => {
    if (!activeId) return;
    setSessions(prev => prev.map(s =>
      s.id === activeId
        ? {
            ...s,
            step: overrides?.step ?? currentStep,
            brief: overrides?.brief ?? brief,
            questionsData: overrides?.questionsData ?? questionsData,
            answers: overrides?.answers ?? answers,
            plan: overrides?.plan ?? plan,
            qaReport: overrides?.qaReport ?? qaReport,
            consistencyReport: overrides?.consistencyReport ?? consistencyReport,
            planVersions: overrides?.planVersions ?? planVersions,
            name: overrides?.name ?? s.name,
          }
        : s
    ));
  }, [activeId, currentStep, brief, questionsData, answers, plan, qaReport, consistencyReport, planVersions]);

  // Create a new blank session and make it active
  const handleNewCampaign = () => {
    const id = newSessionId();
    const session: CampaignSession = {
      id,
      name: '',
      createdAt: new Date().toISOString(),
      step: 'brief',
      brief: null,
      questionsData: null,
      answers: [],
      plan: null,
      qaReport: null,
      consistencyReport: null,
      planVersions: [],
    };
    // Save current session before switching
    persistCurrentSession();
    setSessions(prev => [session, ...prev]);
    setActiveId(id);
    setCurrentStep('brief');
    setBrief(null);
    setQuestionsData(null);
    setAnswers([]);
    setPlan(null);
    setQAReport(null);
    setConsistencyReport(null);
    setPlanVersions([]);
    setCurrentPlanVersion(1);
  };

  // Load a session from history
  const handleSelectSession = (session: CampaignSession) => {
    // Save current first
    persistCurrentSession();
    setActiveId(session.id);
    setCurrentStep(session.step);
    setBrief(session.brief);
    setQuestionsData(session.questionsData);
    setAnswers(session.answers);
    setPlan(session.plan);
    setQAReport(session.qaReport);
    setConsistencyReport(session.consistencyReport ?? null);
    setPlanVersions(session.planVersions ?? []);
    setCurrentPlanVersion(session.planVersions?.length ?? 1);
  };

  // Delete a session
  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setCurrentStep('brief');
      setBrief(null);
      setQuestionsData(null);
      setAnswers([]);
      setPlan(null);
      setQAReport(null);
      setConsistencyReport(null);
      setPlanVersions([]);
      setCurrentPlanVersion(1);
    }
  };

  const handleBriefSubmit = (
    submittedBrief: CampaignBrief,
    questions: ClarifyingQuestionsResponse
  ) => {
    const campaignName = submittedBrief.campaign_name || 'Untitled Campaign';
    setBrief(submittedBrief);
    setQuestionsData(questions);
    setCurrentStep('questions');

    // Auto-create session if none active
    if (!activeId) {
      const id = newSessionId();
      const session: CampaignSession = {
        id,
        name: campaignName,
        createdAt: new Date().toISOString(),
        step: 'questions',
        brief: submittedBrief,
        questionsData: questions,
        answers: [],
        plan: null,
        qaReport: null,
      };
      setSessions(prev => [session, ...prev]);
      setActiveId(id);
    } else {
      persistCurrentSession({
        step: 'questions',
        brief: submittedBrief,
        questionsData: questions,
        name: campaignName,
      });
    }
  };

  const handleAnswersSubmit = (submittedAnswers: QuestionAnswer[], generatedPlan: ExecutionPlan) => {
    setAnswers(submittedAnswers);
    setPlan(generatedPlan);
    setCurrentStep('plan');
    setConsistencyReport(null);
    setQAReport(null);
    const v1: PlanVersion = { version: 1, plan: generatedPlan, timestamp: new Date().toISOString() };
    setPlanVersions([v1]);
    setCurrentPlanVersion(1);
    persistCurrentSession({ step: 'plan', answers: submittedAnswers, plan: generatedPlan, planVersions: [v1] });
  };

  const handlePlanValidated = (report: QAReport) => {
    setQAReport(report);
    setCurrentStep('qa');
    // Store QA report in current version
    const updatedVersions = planVersions.map(v =>
      v.version === currentPlanVersion ? { ...v, qaReport: report } : v
    );
    setPlanVersions(updatedVersions);
    persistCurrentSession({ step: 'qa', qaReport: report, planVersions: updatedVersions });
  };

  const handleConsistencyChecked = (report: ConsistencyReport) => {
    setConsistencyReport(report);
    // Store in current version
    const updatedVersions = planVersions.map(v =>
      v.version === currentPlanVersion ? { ...v, consistencyReport: report } : v
    );
    setPlanVersions(updatedVersions);
    persistCurrentSession({ consistencyReport: report, planVersions: updatedVersions });
  };

  const handleFixPlan = async (fixes: string[]) => {
    if (!brief || !plan) return;
    setIsFixing(true);
    try {
      const fixedPlan = await api.fixPlan(brief, plan, fixes);
      const newVersion = planVersions.length + 1;
      const newPlanVersion: PlanVersion = {
        version: newVersion,
        plan: fixedPlan,
        timestamp: new Date().toISOString(),
      };
      const updatedVersions = [...planVersions, newPlanVersion];
      setPlan(fixedPlan);
      setPlanVersions(updatedVersions);
      setCurrentPlanVersion(newVersion);
      setQAReport(null);
      setConsistencyReport(null);
      setCurrentStep('plan');
      persistCurrentSession({
        step: 'plan',
        plan: fixedPlan,
        qaReport: null,
        consistencyReport: null,
        planVersions: updatedVersions,
      });
    } catch (err) {
      console.error('Fix plan failed:', err);
    } finally {
      setIsFixing(false);
    }
  };

  const handleVersionChange = (version: number) => {
    const v = planVersions.find(pv => pv.version === version);
    if (v) {
      setPlan(v.plan);
      setQAReport(v.qaReport ?? null);
      setConsistencyReport(v.consistencyReport ?? null);
      setCurrentPlanVersion(version);
    }
  };

  const handleReset = () => {
    handleNewCampaign();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-6 lg:px-10 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 bg-slate-800 rounded-lg">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 tracking-tight leading-tight">
                  LaunchPilot
                </h1>
                <p className="text-xs text-gray-400">
                  AI-Powered Campaign Intelligence
                </p>
              </div>
            </div>
            {currentStep !== 'brief' && (
              <button
                onClick={handleReset}
                className="btn-secondary text-xs"
              >
                + New Campaign
              </button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="mt-4 flex items-center justify-center">
            {(['brief', 'questions', 'plan', 'qa'] as const).map((step, index) => {
              const stepIndex = ['brief', 'questions', 'plan', 'qa'].indexOf(currentStep);
              const isCompleted = index < stepIndex || (step === 'qa' && currentStep === 'qa' && qaReport !== null);
              const isCurrent = currentStep === step && !isCompleted;
              return (
                <div key={step} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all ${
                        isCurrent
                          ? 'bg-slate-800 text-white'
                          : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-transparent text-gray-400 border border-gray-300'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${
                      isCurrent ? 'text-gray-800' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                    }`}>
                      {step === 'brief' && 'Brief'}
                      {step === 'questions' && 'Clarify'}
                      {step === 'plan' && 'Plan'}
                      {step === 'qa' && 'QA'}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`mx-4 sm:mx-6 h-px w-10 sm:w-20 ${
                        isCompleted ? 'bg-emerald-300' : 'bg-gray-100'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Body: Sidebar + Main */}
      <div className="flex flex-1 overflow-hidden">
        <CampaignSidebar
          sessions={sessions}
          activeSessionId={activeId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onNewCampaign={handleNewCampaign}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(prev => !prev)}
        />

        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Main Content */}
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-8">
            {currentStep === 'brief' && (
              <BriefForm onSubmit={handleBriefSubmit} />
            )}

            {currentStep === 'questions' && questionsData && brief && (
              <QuestionPanel
                brief={brief}
                questions={questionsData}
                onSubmit={handleAnswersSubmit}
                onBack={handleReset}
              />
            )}

            {currentStep === 'plan' && plan && brief && (
              <div className="space-y-6">
                <PlanViewer
                  plan={plan}
                  brief={brief}
                  onValidate={handlePlanValidated}
                  onConsistencyCheck={handleConsistencyChecked}
                  planVersions={planVersions}
                  currentVersion={currentPlanVersion}
                  onVersionChange={handleVersionChange}
                />
                {consistencyReport && (
                  <ConsistencyPanel report={consistencyReport} />
                )}
              </div>
            )}

            {currentStep === 'qa' && qaReport && plan && brief && (
              <div className="space-y-6">
                <QAReportPanel
                  report={qaReport}
                  onFixPlan={handleFixPlan}
                  isFixing={isFixing}
                  plan={plan}
                  brief={brief}
                />
                {consistencyReport && (
                  <ConsistencyPanel report={consistencyReport} />
                )}
                <PlanViewer
                  plan={plan}
                  brief={brief}
                  onValidate={handlePlanValidated}
                  showValidateButton={false}
                  planVersions={planVersions}
                  currentVersion={currentPlanVersion}
                  onVersionChange={handleVersionChange}
                />
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-100 mt-auto">
            <div className="w-full px-6 lg:px-10 py-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="font-medium text-gray-500">LaunchPilot</span>
                <span className="text-gray-300">·</span>
                <span>AI-Powered Campaign Intelligence</span>
              </div>
              <p className="text-xs text-gray-300">Powered by Azure OpenAI</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
