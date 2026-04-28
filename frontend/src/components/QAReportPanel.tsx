import { useState } from 'react';
import type { QAReport, Misalignment } from '../types';

interface QAReportPanelProps {
  report: QAReport;
  onFixPlan?: (fixes: string[]) => void;
  isFixing?: boolean;
}

export default function QAReportPanel({ report, onFixPlan, isFixing = false }: QAReportPanelProps) {
  const getSeverityBadge = (severity: string) => {
    const classes = {
      critical: 'badge-critical',
      high: 'badge-high',
      medium: 'badge-medium',
      low: 'badge-low',
    };
    return classes[severity as keyof typeof classes] || 'badge-low';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-400';
  };

  const groupedMisalignments = report.misalignments.reduce((acc, item) => {
    if (!acc[item.severity]) {
      acc[item.severity] = [];
    }
    acc[item.severity].push(item);
    return acc;
  }, {} as Record<string, Misalignment[]>);

  return (
    <div className="w-full space-y-6">
      {/* Header Summary */}
      <div className={`card ${report.ready_to_launch ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-800">QA Validation Report</h2>
              {report.ready_to_launch ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-500">
                  Ready to Launch
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-500">
                  Review Required
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-4">{report.summary}</p>
          </div>
          <div className="ml-6 text-center">
            <div className={`text-4xl font-semibold ${getScoreColor(report.overall_alignment_score)}`}>
              {Math.round(report.overall_alignment_score)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Alignment</div>
          </div>
        </div>

        {/* Issue Counts */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-red-400">{report.critical_issues_count}</div>
            <div className="text-xs text-gray-400">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-amber-400">{report.high_issues_count}</div>
            <div className="text-xs text-gray-400">High</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-400">{report.medium_issues_count}</div>
            <div className="text-xs text-gray-400">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-400">{report.low_issues_count}</div>
            <div className="text-xs text-gray-400">Low</div>
          </div>
        </div>
      </div>

      {/* Misalignments by Severity */}
      {report.misalignments.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4">
            Issues Found ({report.misalignments.length})
          </h3>

          <div className="space-y-4">
            {(['critical', 'high', 'medium', 'low'] as const).map(severity => {
              const issues = groupedMisalignments[severity] || [];
              if (issues.length === 0) return null;

              return (
                <div key={severity} className="space-y-3">
                  <h4 className="font-semibold text-gray-700 capitalize flex items-center gap-2">
                    <span className={getSeverityBadge(severity)}>{severity}</span>
                    <span>({issues.length})</span>
                  </h4>
                  {issues.map(issue => (
                    <div key={issue.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-700">{issue.title}</h5>
                        <span className="text-xs text-gray-400 px-2 py-0.5 bg-slate-50 rounded-md">
                          {issue.category}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-3">{issue.description}</p>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div className="bg-red-50/50 border border-red-50 rounded-lg p-2.5">
                          <p className="text-xs font-medium text-red-400 mb-1">Brief Says</p>
                          <p className="text-xs text-gray-600 italic">"{issue.brief_reference}"</p>
                        </div>
                        <div className="bg-blue-50/50 border border-blue-50 rounded-lg p-2.5">
                          <p className="text-xs font-medium text-blue-400 mb-1">Plan Says</p>
                          <p className="text-xs text-gray-600 italic">"{issue.plan_reference}"</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs mb-1.5">
                          <span className="font-medium text-gray-600">Impact:</span>{' '}
                          <span className="text-gray-500">{issue.impact}</span>
                        </p>
                        {issue.suggested_fix && (
                          <p className="text-xs">
                            <span className="font-medium text-emerald-500">Suggested Fix:</span>{' '}
                            <span className="text-gray-500">{issue.suggested_fix}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths */}
      {report.strengths.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span>Strengths</span>
          </h3>
          <ul className="space-y-2">
            {report.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5 text-sm">✓</span>
                <span className="text-sm text-gray-500">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-slate-400 text-sm">→</span>
                <span className="text-sm text-gray-500 flex-1">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Button */}
      {!report.ready_to_launch && (
        <div className="card bg-amber-50/40 border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Action Required</p>
              <p className="text-xs text-gray-400 mt-1">
                Address {report.critical_issues_count + report.high_issues_count} critical/high issues before launch.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onFixPlan && (
                <button
                  onClick={() => {
                    const fixes = report.misalignments
                      .filter(m => m.suggested_fix)
                      .map(m => m.suggested_fix!);
                    if (fixes.length > 0) onFixPlan(fixes);
                  }}
                  disabled={isFixing || report.misalignments.filter(m => m.suggested_fix).length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg hover:from-violet-700 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {isFixing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Fixing Plan...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.65-5.65a2.25 2.25 0 013.18-3.18l5.65 5.65m-1.41 1.41l5.65 5.65a2.25 2.25 0 01-3.18 3.18l-5.65-5.65" />
                      </svg>
                      Fix & Regenerate Plan
                    </>
                  )}
                </button>
              )}
              <button className="btn-primary text-xs">
                Review Issues
              </button>
            </div>
          </div>
          {onFixPlan && (
            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-amber-100">
              AI will apply {report.misalignments.filter(m => m.suggested_fix).length} suggested fixes and regenerate the plan.
            </p>
          )}
        </div>
      )}

      {report.ready_to_launch && (
        <div className="card bg-emerald-50/40 border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Plan Ready for Launch</p>
              <p className="text-xs text-gray-400 mt-1">
                No critical or high severity issues. The plan aligns well with the brief.
              </p>
            </div>
            <button className="bg-emerald-500 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium">
              Approve & Launch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
