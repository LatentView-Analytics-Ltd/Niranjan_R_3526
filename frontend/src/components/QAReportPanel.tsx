import { useState } from 'react';
import type { QAReport, Misalignment, ExecutionPlan, CampaignBrief } from '../types';

interface QAReportPanelProps {
  report: QAReport;
  onFixPlan?: (fixes: string[]) => void;
  isFixing?: boolean;
  plan?: ExecutionPlan;
  brief?: CampaignBrief;
}

export default function QAReportPanel({ report, onFixPlan, isFixing = false, plan, brief }: QAReportPanelProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  const handleApproveAndLaunch = () => {
    setShowCelebration(true);
  };

  const handleExportPDF = () => {
    if (!plan || !brief) {
      alert('Plan data not available for export');
      return;
    }

    const safeName = plan.campaign_name.replace(/\s+/g, '_');
    
    const generatePlanHTML = () => {
      let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${plan.campaign_name} - Campaign Plan & QA Report</title>
  <style>
    @page { margin: 0.75in; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      color: #1f2937;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid #10b981;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    h1 {
      color: #059669;
      font-size: 24pt;
      margin: 0 0 8px 0;
      font-weight: 700;
    }
    .subtitle {
      color: #6b7280;
      font-size: 11pt;
      margin: 0;
    }
    .qa-score {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .score-number {
      font-size: 36pt;
      font-weight: 700;
      margin: 0;
    }
    .score-label {
      font-size: 11pt;
      opacity: 0.9;
      margin: 4px 0 0 0;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 9pt;
      font-weight: 600;
      margin: 8px 0;
    }
    .status-ready {
      background: #d1fae5;
      color: #065f46;
    }
    .status-review {
      background: #fef3c7;
      color: #92400e;
    }
    h2 {
      color: #374151;
      font-size: 16pt;
      margin: 24px 0 12px 0;
      padding-bottom: 6px;
      border-bottom: 2px solid #e5e7eb;
    }
    h3 {
      color: #4b5563;
      font-size: 12pt;
      margin: 16px 0 8px 0;
    }
    .section {
      margin: 16px 0;
      page-break-inside: avoid;
    }
    .issue-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      margin: 12px 0;
      page-break-inside: avoid;
    }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .severity-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    .critical { background: #fee2e2; color: #991b1b; }
    .high { background: #fef3c7; color: #92400e; }
    .medium { background: #fef9c3; color: #854d0e; }
    .low { background: #f3f4f6; color: #374151; }
    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 12px 0;
    }
    .comparison-box {
      border-radius: 6px;
      padding: 10px;
      font-size: 9pt;
    }
    .brief-box { background: #fee2e2; border: 1px solid #fecaca; }
    .plan-box { background: #dbeafe; border: 1px solid #bfdbfe; }
    .comparison-label {
      font-weight: 600;
      margin-bottom: 4px;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .brief-label { color: #991b1b; }
    .plan-label { color: #1e40af; }
    .fix-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 10px;
      margin-top: 10px;
      font-size: 9pt;
    }
    .fix-label {
      color: #166534;
      font-weight: 600;
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9pt;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px;
      text-align: left;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    ul, ol {
      margin: 8px 0;
      padding-left: 24px;
    }
    li {
      margin: 4px 0;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 16px 0;
    }
    .metric-box {
      text-align: center;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }
    .metric-number {
      font-size: 20pt;
      font-weight: 700;
      margin: 0;
    }
    .metric-label {
      font-size: 8pt;
      color: #6b7280;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .critical-num { color: #dc2626; }
    .high-num { color: #f59e0b; }
    .medium-num { color: #fbbf24; }
    .low-num { color: #9ca3af; }
    .checkmark { color: #10b981; font-weight: 700; }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 8pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 ${plan.campaign_name}</h1>
    <p class="subtitle">Campaign Execution Plan & QA Validation Report</p>
    <p class="subtitle">Generated by LaunchPilot AI • ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="qa-score">
    <p class="score-number">${Math.round(report.overall_alignment_score)}/100</p>
    <p class="score-label">Quality Alignment Score</p>
    <span class="status-badge ${report.ready_to_launch ? 'status-ready' : 'status-review'}">
      ${report.ready_to_launch ? '✓ Ready to Launch' : '⚠ Review Required'}
    </span>
  </div>

  <div class="section">
    <p><strong>Summary:</strong> ${report.summary}</p>
  </div>

  <div class="metric-grid">
    <div class="metric-box">
      <p class="metric-number critical-num">${report.critical_issues_count}</p>
      <p class="metric-label">Critical</p>
    </div>
    <div class="metric-box">
      <p class="metric-number high-num">${report.high_issues_count}</p>
      <p class="metric-label">High</p>
    </div>
    <div class="metric-box">
      <p class="metric-number medium-num">${report.medium_issues_count}</p>
      <p class="metric-label">Medium</p>
    </div>
    <div class="metric-box">
      <p class="metric-number low-num">${report.low_issues_count}</p>
      <p class="metric-label">Low</p>
    </div>
  </div>`;

      // Add issues
      if (report.misalignments.length > 0) {
        html += `<h2>📋 Issues Found (${report.misalignments.length})</h2>`;
        
        const groupedIssues: Record<string, Misalignment[]> = {};
        report.misalignments.forEach(issue => {
          if (!groupedIssues[issue.severity]) {
            groupedIssues[issue.severity] = [];
          }
          groupedIssues[issue.severity].push(issue);
        });

        (['critical', 'high', 'medium', 'low'] as const).forEach(severity => {
          const issues = groupedIssues[severity] || [];
          if (issues.length === 0) return;

          html += `<h3 style="text-transform: capitalize;">${severity} Issues (${issues.length})</h3>`;
          issues.forEach(issue => {
            html += `
            <div class="issue-card">
              <div class="issue-header">
                <strong>${issue.title}</strong>
                <span class="severity-badge ${severity}">${severity}</span>
              </div>
              <p>${issue.description}</p>
              <div class="comparison">
                <div class="comparison-box brief-box">
                  <div class="comparison-label brief-label">Brief Says</div>
                  <div>"${issue.brief_reference}"</div>
                </div>
                <div class="comparison-box plan-box">
                  <div class="comparison-label plan-label">Plan Says</div>
                  <div>"${issue.plan_reference}"</div>
                </div>
              </div>
              <p><strong>Impact:</strong> ${issue.impact}</p>
              ${issue.suggested_fix ? `
              <div class="fix-box">
                <div class="fix-label">✓ Suggested Fix:</div>
                <div>${issue.suggested_fix}</div>
              </div>
              ` : ''}
            </div>`;
          });
        });
      }

      // Add strengths
      if (report.strengths.length > 0) {
        html += `<h2>✅ Strengths</h2><ul>`;
        report.strengths.forEach(strength => {
          html += `<li><span class="checkmark">✓</span> ${strength}</li>`;
        });
        html += `</ul>`;
      }

      // Add recommendations
      if (report.recommendations.length > 0) {
        html += `<h2>💡 Recommendations</h2><ul>`;
        report.recommendations.forEach(rec => {
          html += `<li>${rec}</li>`;
        });
        html += `</ul>`;
      }

      // Add campaign plan summary
      html += `
      <div style="page-break-before: always;"></div>
      <h2>📊 Campaign Plan Summary</h2>
      
      <div class="section">
        <h3>Executive Summary</h3>
        <p>${plan.executive_summary}</p>
      </div>

      <div class="section">
        <h3>Channels (${plan.channels.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>Audience</th>
              <th>Format</th>
              <th>Budget</th>
            </tr>
          </thead>
          <tbody>`;

      plan.channels.forEach(channel => {
        html += `
            <tr>
              <td><strong>${channel.channel_type.replace('_', ' ').toUpperCase()}</strong>${channel.platform_details ? '<br/><small>' + channel.platform_details + '</small>' : ''}</td>
              <td>${channel.target_audience_segment}</td>
              <td>${channel.content_format}</td>
              <td>${channel.budget_allocated || '—'}</td>
            </tr>`;
      });

      html += `
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Budget Overview</h3>
        <p><strong>Total Budget:</strong> ${plan.budget.total_budget || 'Not specified'}</p>
        ${plan.budget.production_costs ? `<p><strong>Production Costs:</strong> ${plan.budget.production_costs}</p>` : ''}
        ${plan.budget.contingency ? `<p><strong>Contingency:</strong> ${plan.budget.contingency}</p>` : ''}
        ${plan.budget.notes ? `<p style="font-size: 9pt; color: #6b7280;"><em>${plan.budget.notes}</em></p>` : ''}
      </div>

      <div class="section">
        <h3>Timeline (${plan.timeline.length} Milestones)</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Milestone</th>
              <th>Deliverables</th>
            </tr>
          </thead>
          <tbody>`;

      plan.timeline.forEach(milestone => {
        html += `
            <tr>
              <td>${milestone.date}</td>
              <td>${milestone.description}</td>
              <td>${milestone.deliverables.join(', ')}</td>
            </tr>`;
      });

      html += `
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Generated by LaunchPilot — AI-Powered Campaign Intelligence Platform</p>
        <p>Campaign: ${plan.campaign_name} | Generated: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>`;

      return html;
    };

    const html = generatePlanHTML();
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } else {
      alert('Please allow popups to export PDF');
    }

    setShowCelebration(false);
  };
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
            <button 
              onClick={handleApproveAndLaunch}
              className="bg-emerald-500 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
            >
              Approve & Launch
            </button>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setShowCelebration(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center transform animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Celebration Icon */}
            <div className="mb-6 relative">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mx-auto flex items-center justify-center animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* Confetti particles */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                <div className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti-1" style={{ top: '-20px', left: '-40px' }} />
                <div className="absolute w-2 h-2 bg-pink-400 rounded-full animate-confetti-2" style={{ top: '-30px', left: '40px' }} />
                <div className="absolute w-2 h-2 bg-blue-400 rounded-full animate-confetti-3" style={{ top: '-25px', left: '0px' }} />
                <div className="absolute w-2 h-2 bg-purple-400 rounded-full animate-confetti-4" style={{ top: '-15px', left: '-60px' }} />
                <div className="absolute w-2 h-2 bg-green-400 rounded-full animate-confetti-5" style={{ top: '-35px', left: '60px' }} />
              </div>
            </div>

            {/* Success Message */}
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              🎉 Campaign Approved!
            </h2>
            <p className="text-gray-600 mb-2">
              Your campaign plan has been successfully approved and is ready for launch.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              All quality checks passed with an alignment score of <span className="font-semibold text-emerald-600">{Math.round(report.overall_alignment_score)}/100</span>
            </p>

            {/* Action Button */}
            <button
              onClick={() => setShowCelebration(false)}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all font-medium shadow-md hover:shadow-lg"
            >
              Continue Working
            </button>

            {/* Close button */}
            <button
              onClick={() => setShowCelebration(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
