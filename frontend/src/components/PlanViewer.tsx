import { useState, useRef } from 'react';
import api from '../services/apiClient';
import type { CampaignBrief, ExecutionPlan, QAReport, ConsistencyReport, PlanVersion } from '../types';

interface PlanViewerProps {
  plan: ExecutionPlan;
  brief: CampaignBrief;
  onValidate: (report: QAReport) => void;
  onConsistencyCheck?: (report: ConsistencyReport) => void;
  showValidateButton?: boolean;
  planVersions?: PlanVersion[];
  currentVersion?: number;
  onVersionChange?: (version: number) => void;
}

export default function PlanViewer({
  plan, brief, onValidate, onConsistencyCheck,
  showValidateButton = true,
  planVersions = [], currentVersion = 1, onVersionChange,
}: PlanViewerProps) {
  const [loading, setLoading] = useState(false);
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [qaProgress, setQaProgress] = useState(0);
  const [qaStage, setQaStage] = useState('');
  const qaTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [consistencyProgress, setConsistencyProgress] = useState(0);
  const [consistencyStage, setConsistencyStage] = useState('');
  const consistencyTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleConsistencyCheck = async () => {
    if (!onConsistencyCheck) return;
    setConsistencyLoading(true);
    setError(null);
    setConsistencyProgress(0);
    setConsistencyStage('Extracting channel data...');

    const stages = [
      { progress: 15, stage: 'Extracting channel data...' },
      { progress: 35, stage: 'Comparing key messages...' },
      { progress: 55, stage: 'Analyzing CTAs across channels...' },
      { progress: 70, stage: 'Checking tone consistency...' },
      { progress: 85, stage: 'Building consistency matrix...' },
      { progress: 92, stage: 'Finalizing report...' },
    ];
    let stageIdx = 0;
    consistencyTimer.current = setInterval(() => {
      if (stageIdx < stages.length) {
        setConsistencyProgress(stages[stageIdx].progress);
        setConsistencyStage(stages[stageIdx].stage);
        stageIdx++;
      }
    }, 2000);

    try {
      const report = await api.checkConsistency(plan);
      if (consistencyTimer.current) clearInterval(consistencyTimer.current);
      setConsistencyProgress(100);
      setConsistencyStage('Complete!');
      setTimeout(() => {
        setConsistencyProgress(0);
        setConsistencyStage('');
        onConsistencyCheck(report);
      }, 500);
    } catch (err) {
      if (consistencyTimer.current) clearInterval(consistencyTimer.current);
      setConsistencyProgress(0);
      setConsistencyStage('');
      setError(err instanceof Error ? err.message : 'Failed to check consistency');
    } finally {
      setConsistencyLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleValidate = async () => {
    setLoading(true);
    setError(null);
    setQaProgress(0);
    setQaStage('Analyzing plan against brief...');

    const stages = [
      { progress: 15, stage: 'Analyzing plan against brief...' },
      { progress: 35, stage: 'Checking channel alignment...' },
      { progress: 55, stage: 'Validating budget & timeline...' },
      { progress: 70, stage: 'Reviewing copy guidelines...' },
      { progress: 85, stage: 'Generating QA report...' },
      { progress: 92, stage: 'Finalizing validation...' },
    ];

    let stageIndex = 0;
    qaTimer.current = setInterval(() => {
      if (stageIndex < stages.length) {
        setQaProgress(stages[stageIndex].progress);
        setQaStage(stages[stageIndex].stage);
        stageIndex++;
      }
    }, 2000);

    try {
      const report = await api.validatePlan(brief, plan);
      if (qaTimer.current) clearInterval(qaTimer.current);
      setQaProgress(100);
      setQaStage('Validation complete!');
      setTimeout(() => {
        setQaProgress(0);
        setQaStage('');
        onValidate(report);
      }, 500);
    } catch (err) {
      if (qaTimer.current) clearInterval(qaTimer.current);
      setQaProgress(0);
      setQaStage('');
      setError(err instanceof Error ? err.message : 'Failed to validate plan');
    } finally {
      setLoading(false);
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  const safeName = plan.campaign_name.replace(/\s+/g, '_');

  const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    downloadBlob(JSON.stringify(plan, null, 2), `${safeName}_plan.json`, 'application/json');
    setShowExportMenu(false);
  };

  const generateMarkdown = (): string => {
    let md = `# ${plan.campaign_name} — Execution Plan\n\n`;
    md += `## Executive Summary\n\n${plan.executive_summary}\n\n`;
    md += `---\n\n## Channels (${plan.channels.length})\n\n`;
    for (const ch of plan.channels) {
      md += `### ${ch.channel_type.replace('_', ' ').toUpperCase()}`;
      if (ch.platform_details) md += ` — ${ch.platform_details}`;
      md += `\n\n`;
      md += `| Field | Details |\n|---|---|\n`;
      md += `| Audience | ${ch.target_audience_segment} |\n`;
      md += `| Format | ${ch.content_format} |\n`;
      if (ch.frequency) md += `| Frequency | ${ch.frequency} |\n`;
      if (ch.budget_allocated) md += `| Budget | ${ch.budget_allocated} |\n`;
      if (ch.owner) md += `| Owner | ${ch.owner} |\n`;
      md += `\n**Copy Guidance:** ${ch.copy_guidance}\n\n`;
      if (ch.success_metrics.length) {
        md += `**Success Metrics:**\n${ch.success_metrics.map(m => `- ${m}`).join('\n')}\n\n`;
      }
    }
    md += `---\n\n## Timeline (${plan.timeline.length} milestones)\n\n`;
    md += `| Date | Milestone | Deliverables | Owner |\n|---|---|---|---|\n`;
    for (const m of plan.timeline) {
      md += `| ${m.date} | ${m.description} | ${m.deliverables.join('; ')} | ${m.owner || '—'} |\n`;
    }
    md += `\n---\n\n## Budget Breakdown\n\n`;
    if (plan.budget.total_budget) md += `**Total:** ${plan.budget.total_budget}\n\n`;
    if (Object.keys(plan.budget.channel_allocations).length) {
      md += `| Channel | Amount |\n|---|---|\n`;
      for (const [ch, amt] of Object.entries(plan.budget.channel_allocations)) {
        md += `| ${ch.replace('_', ' ')} | ${amt} |\n`;
      }
      md += `\n`;
    }
    if (plan.budget.production_costs) md += `- Production Costs: ${plan.budget.production_costs}\n`;
    if (plan.budget.contingency) md += `- Contingency: ${plan.budget.contingency}\n`;
    if (plan.budget.notes) md += `\n*${plan.budget.notes}*\n`;
    md += `\n---\n\n## Copy Guidelines\n\n`;
    for (const cg of plan.copy_guidelines) {
      md += `### ${cg.audience_segment}\n\n`;
      md += `- **Tone:** ${cg.tone}\n`;
      md += `- **CTA:** ${cg.call_to_action}\n`;
      md += `- **Key Points:** ${cg.key_points.join(', ')}\n`;
      if (cg.prohibited_terms?.length) md += `- **Avoid:** ${cg.prohibited_terms.join(', ')}\n`;
      md += `\n`;
    }
    md += `---\n\n## Success Metrics\n\n${plan.success_metrics.map(m => `- ${m}`).join('\n')}\n\n`;
    md += `---\n\n## Pre-Launch Verification Checklist\n\n${plan.verification_checklist.map(v => `- [ ] ${v}`).join('\n')}\n\n`;
    if (plan.assumptions_made.length) {
      md += `---\n\n## Assumptions Made\n\n${plan.assumptions_made.map(a => `- ${a}`).join('\n')}\n`;
    }
    return md;
  };

  const handleExportMarkdown = () => {
    downloadBlob(generateMarkdown(), `${safeName}_plan.md`, 'text/markdown');
    setShowExportMenu(false);
  };

  const handleExportWord = () => {
    const md = generateMarkdown();
    // Build a minimal HTML document that MS Word can open
    const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${plan.campaign_name} — Execution Plan</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #222; margin: 1in; }
  h1 { color: #1d4ed8; font-size: 22pt; border-bottom: 2px solid #1d4ed8; padding-bottom: 6px; }
  h2 { color: #2563eb; font-size: 16pt; margin-top: 24px; }
  h3 { color: #374151; font-size: 13pt; margin-top: 16px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; font-size: 10pt; }
  th { background: #eff6ff; font-weight: bold; }
  ul { margin: 8px 0; padding-left: 24px; }
  li { margin: 3px 0; }
  .meta { color: #6b7280; font-size: 9pt; }
</style></head><body>
  ${md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- \[ \] (.+)$/gm, '<li>☐ $1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => '<ul>' + match + '</ul>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim() !== '');
      if (cells.every(c => c.trim().match(/^-+$/))) return '';
      const tag = cells[0]?.trim().match(/^(Field|Date|Channel|)$/) ? 'th' : 'td';
      return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, (match) => '<table>' + match + '</table>')
  }
  <p class="meta">Generated by LaunchPilot — AI-Powered Campaign Intelligence</p>
</body></html>`;

    downloadBlob(html, `${safeName}_plan.doc`, 'application/msword');
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const md = generateMarkdown();
    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${plan.campaign_name} — Execution Plan</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #222; margin: 40px; }
  h1 { color: #1d4ed8; font-size: 22pt; border-bottom: 2px solid #1d4ed8; padding-bottom: 6px; }
  h2 { color: #2563eb; font-size: 16pt; margin-top: 24px; }
  h3 { color: #374151; font-size: 13pt; margin-top: 16px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; font-size: 10pt; }
  th { background: #eff6ff; font-weight: bold; }
  ul { margin: 8px 0; padding-left: 24px; }
  li { margin: 3px 0; }
  .meta { color: #6b7280; font-size: 9pt; }
</style></head><body>
  ${md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- \[ \] (.+)$/gm, '<li>☐ $1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => '<ul>' + match + '</ul>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim() !== '');
      if (cells.every(c => c.trim().match(/^-+$/))) return '';
      const tag = cells[0]?.trim().match(/^(Field|Date|Channel|)$/) ? 'th' : 'td';
      return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, (match) => '<table>' + match + '</table>')
  }
  <p class="meta">Generated by LaunchPilot — AI-Powered Campaign Intelligence</p>
</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    setShowExportMenu(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{plan.campaign_name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">Execution Plan Generated</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                    <button
                      onClick={handleExportJSON}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 border-b border-gray-50 transition-colors"
                    >
                      <span className="w-7 h-7 rounded-md bg-amber-50 text-amber-500 flex items-center justify-center text-xs font-semibold">{ }</span>
                      <div>
                        <p className="text-sm text-gray-700">JSON</p>
                        <p className="text-xs text-gray-400">Structured data</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportMarkdown}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 border-b border-gray-50 transition-colors"
                    >
                      <span className="w-7 h-7 rounded-md bg-slate-50 text-slate-500 flex items-center justify-center text-xs font-semibold">MD</span>
                      <div>
                        <p className="text-sm text-gray-700">Markdown</p>
                        <p className="text-xs text-gray-400">Docs &amp; wikis</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportWord}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 border-b border-gray-50 transition-colors"
                    >
                      <span className="w-7 h-7 rounded-md bg-blue-50 text-blue-400 flex items-center justify-center text-xs font-semibold">W</span>
                      <div>
                        <p className="text-sm text-gray-700">Word Document</p>
                        <p className="text-xs text-gray-400">For stakeholders</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <span className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center text-xs font-semibold">PDF</span>
                      <div>
                        <p className="text-sm text-gray-700">PDF</p>
                        <p className="text-xs text-gray-400">Print-ready document</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
            {showValidateButton && onConsistencyCheck && (
              <button
                onClick={handleConsistencyCheck}
                disabled={consistencyLoading}
                className="btn-secondary flex items-center gap-2"
              >
                {consistencyLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Checking...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    Channel Consistency
                  </>
                )}
              </button>
            )}
            {showValidateButton && (
              <button
                onClick={handleValidate}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Validating...
                  </>
                ) : (
                  'Run QA Validation'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QA Validation Progress */}
      {loading && qaProgress > 0 && (
        <div className="card border border-blue-100 bg-blue-50/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Running QA Validation</p>
              <p className="text-xs text-blue-600 mt-0.5">{qaStage}</p>
            </div>
            <span className="text-xs font-semibold text-blue-700">{qaProgress}%</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${qaProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Consistency Check Progress */}
      {consistencyLoading && consistencyProgress > 0 && (
        <div className="card border border-violet-100 bg-violet-50/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
              <svg className="animate-spin h-4 w-4 text-violet-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-violet-800">Checking Channel Consistency</p>
              <p className="text-xs text-violet-600 mt-0.5">{consistencyStage}</p>
            </div>
            <span className="text-xs font-semibold text-violet-700">{consistencyProgress}%</span>
          </div>
          <div className="w-full bg-violet-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${consistencyProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Version Selector */}
      {planVersions.length > 1 && (
        <div className="card border border-slate-100 bg-slate-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan Version</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onVersionChange?.(currentVersion - 1)}
                  disabled={currentVersion <= 1}
                  className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-semibold text-gray-700 min-w-[80px] text-center">
                  v{currentVersion} of {planVersions.length}
                </span>
                <button
                  onClick={() => onVersionChange?.(currentVersion + 1)}
                  disabled={currentVersion >= planVersions.length}
                  className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            {planVersions.length >= 2 && currentVersion === planVersions.length && (
              <div className="flex items-center gap-2">
                {(() => {
                  const prev = planVersions[planVersions.length - 2]?.qaReport?.overall_alignment_score;
                  const curr = planVersions[planVersions.length - 1]?.qaReport?.overall_alignment_score;
                  if (prev != null && curr != null) {
                    const diff = Math.round(curr - prev);
                    return (
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        Alignment: {Math.round(prev)} → {Math.round(curr)} ({diff >= 0 ? '+' : ''}{diff})
                      </span>
                    );
                  }
                  return null;
                })()}
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-50 text-green-600">
                  Latest
                </span>
              </div>
            )}
            {currentVersion < planVersions.length && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-600">
                Viewing older version
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-50/60 border border-red-100 rounded-lg">
          <p className="text-sm font-medium text-red-600">Error</p>
          <p className="text-xs text-red-500 mt-0.5">{error}</p>
        </div>
      )}

      {/* Executive Summary */}
      <div className="card">
        <button
          onClick={() => toggleSection('summary')}
          className="w-full flex justify-between items-center text-left"
        >
          <h3 className="text-base font-semibold text-gray-700">Executive Summary</h3>
          <span className="text-gray-300 text-sm">{expandedSections.has('summary') ? '−' : '+'}</span>
        </button>
        {expandedSections.has('summary') && (
          <p className="mt-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{plan.executive_summary}</p>
        )}
      </div>

      {/* Channels */}
      <div className="card">
        <button
          onClick={() => toggleSection('channels')}
          className="w-full flex justify-between items-center text-left"
        >
          <h3 className="text-base font-semibold text-gray-700">
            Channels ({plan.channels.length})
          </h3>
          <span className="text-gray-300 text-sm">{expandedSections.has('channels') ? '−' : '+'}</span>
        </button>
        {expandedSections.has('channels') && (
          <div className="mt-4 space-y-4">
            {plan.channels.map((channel, index) => (
              <div key={index} className="border border-gray-100 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-800 capitalize">
                      {channel.channel_type.replace('_', ' ')}
                    </h4>
                    {channel.platform_details && (
                      <p className="text-xs text-gray-400 mt-0.5">{channel.platform_details}</p>
                    )}
                  </div>
                  {channel.budget_allocated && (
                    <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                      {channel.budget_allocated}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-gray-400">Audience</span>
                    <p className="text-gray-600 mt-0.5">{channel.target_audience_segment}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Format</span>
                    <p className="text-gray-600 mt-0.5">{channel.content_format}</p>
                  </div>
                  {channel.frequency && (
                    <div>
                      <span className="text-xs text-gray-400">Frequency</span>
                      <p className="text-gray-600 mt-0.5">{channel.frequency}</p>
                    </div>
                  )}
                  {channel.owner && (
                    <div>
                      <span className="text-xs text-gray-400">Owner</span>
                      <p className="text-gray-600 mt-0.5">{channel.owner}</p>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <span className="text-xs text-gray-400">Copy Guidance</span>
                  <p className="text-gray-600 text-sm mt-0.5">{channel.copy_guidance}</p>
                </div>
                {channel.success_metrics.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs text-gray-400">Success Metrics</span>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                      {channel.success_metrics.map((metric, idx) => (
                        <li key={idx}>{metric}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="card">
        <button
          onClick={() => toggleSection('timeline')}
          className="w-full flex justify-between items-center text-left"
        >
          <h3 className="text-base font-semibold text-gray-700">
            Timeline ({plan.timeline.length} milestones)
          </h3>
          <span className="text-gray-300 text-sm">{expandedSections.has('timeline') ? '−' : '+'}</span>
        </button>
        {expandedSections.has('timeline') && (
          <div className="mt-4 space-y-3">
            {plan.timeline.map((milestone, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-24 text-xs font-medium text-gray-400">
                  {milestone.date}
                </div>
                <div className="flex-1 border-l border-slate-200 pl-4 pb-4">
                  <p className="text-sm font-medium text-gray-700">{milestone.description}</p>
                  {milestone.deliverables.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                      {milestone.deliverables.map((deliverable, idx) => (
                        <li key={idx}>{deliverable}</li>
                      ))}
                    </ul>
                  )}
                  {milestone.owner && (
                    <p className="text-sm text-gray-500 mt-1">Owner: {milestone.owner}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget */}
      <div className="card">
        <button
          onClick={() => toggleSection('budget')}
          className="w-full flex justify-between items-center text-left"
        >
          <h3 className="text-base font-semibold text-gray-700">Budget Breakdown</h3>
          <span className="text-gray-300 text-sm">{expandedSections.has('budget') ? '−' : '+'}</span>
        </button>
        {expandedSections.has('budget') && (
          <div className="mt-4">
            {plan.budget.total_budget && (
              <div className="mb-4">
                <span className="text-xs text-gray-400">Total Budget</span>
                <p className="text-xl font-semibold text-gray-800 mt-0.5">{plan.budget.total_budget}</p>
              </div>
            )}
            {Object.keys(plan.budget.channel_allocations).length > 0 && (
              <div className="mb-4">
                <span className="text-xs text-gray-400">Channel Allocations</span>
                <div className="mt-2 space-y-1.5">
                  {Object.entries(plan.budget.channel_allocations).map(([channel, amount]) => (
                    <div key={channel} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                      <span className="text-sm text-gray-600 capitalize">{channel.replace('_', ' ')}</span>
                      <span className="text-sm font-medium text-gray-700">{amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plan.budget.production_costs && (
              <div className="mb-2">
                <span className="text-gray-700">Production Costs:</span>
                <span className="ml-2 font-medium">{plan.budget.production_costs}</span>
              </div>
            )}
            {plan.budget.contingency && (
              <div className="mb-2">
                <span className="text-gray-700">Contingency:</span>
                <span className="ml-2 font-medium">{plan.budget.contingency}</span>
              </div>
            )}
            {plan.budget.notes && (
              <p className="text-sm text-gray-600 mt-3 italic">{plan.budget.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Copy Guidelines, Success Metrics, Verification Checklist, Assumptions */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Success Metrics</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {plan.success_metrics.map((metric, index) => (
              <li key={index}>{metric}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Verification Checklist</h3>
          <ul className="space-y-2">
            {plan.verification_checklist.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5" />
                <span className="text-sm text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {plan.assumptions_made.length > 0 && (
        <div className="card bg-amber-50/40 border-amber-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Assumptions Made</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {plan.assumptions_made.map((assumption, index) => (
              <li key={index}>{assumption}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
