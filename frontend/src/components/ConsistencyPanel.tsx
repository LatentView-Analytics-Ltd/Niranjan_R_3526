import { useState } from 'react';
import type { ConsistencyReport, ConsistencyPair } from '../types';

interface ConsistencyPanelProps {
  report: ConsistencyReport;
}

export default function ConsistencyPanel({ report }: ConsistencyPanelProps) {
  const [selectedPair, setSelectedPair] = useState<ConsistencyPair | null>(null);

  const getStatusColor = (status: string) => {
    if (status === 'aligned') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'adapted') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getStatusDot = (status: string) => {
    if (status === 'aligned') return 'bg-emerald-400';
    if (status === 'adapted') return 'bg-amber-400';
    return 'bg-red-400';
  };

  const getCellColor = (status: string) => {
    if (status === 'aligned') return 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100';
    if (status === 'adapted') return 'bg-amber-50 hover:bg-amber-100 border-amber-100';
    return 'bg-red-50 hover:bg-red-100 border-red-100';
  };

  const getCellIcon = (status: string) => {
    if (status === 'aligned') return '✓';
    if (status === 'adapted') return '~';
    return '✗';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-400';
  };

  const dimensionLabels: Record<string, string> = {
    key_message: 'Message',
    cta: 'CTA',
    tone: 'Tone',
  };

  // Build unique channel list
  const channels = Array.from(
    new Set(report.pairs.flatMap(p => [p.channel_a, p.channel_b]))
  );

  // Build lookup for pairs
  const getPair = (a: string, b: string, dim: string) =>
    report.pairs.find(
      p =>
        ((p.channel_a === a && p.channel_b === b) || (p.channel_a === b && p.channel_b === a)) &&
        p.dimension === dim
    );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Channel Consistency Report</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600">
                {channels.length} Channels
              </span>
            </div>
            <p className="text-sm text-gray-500">{report.summary}</p>
          </div>
          <div className="ml-6 text-center">
            <div className={`text-4xl font-semibold ${getScoreColor(report.overall_consistency_score)}`}>
              {Math.round(report.overall_consistency_score)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Consistency</div>
          </div>
        </div>

        {/* Status counts */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-emerald-500">{report.aligned_count}</div>
            <div className="text-xs text-gray-400">Aligned</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-amber-500">{report.adapted_count}</div>
            <div className="text-xs text-gray-400">Adapted</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-400">{report.divergent_count}</div>
            <div className="text-xs text-gray-400">Divergent</div>
          </div>
        </div>
      </div>

      {/* Consistency Matrix */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-700 mb-4">Consistency Matrix</h3>
        <p className="text-xs text-gray-400 mb-4">Click any cell to see details. Each cell shows 3 dots for Message, CTA, and Tone.</p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-xs text-gray-400 font-medium text-left"></th>
                {channels.map(ch => (
                  <th key={ch} className="p-2 text-xs text-gray-500 font-medium text-center capitalize">
                    {ch.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channels.map((rowCh, ri) => (
                <tr key={rowCh}>
                  <td className="p-2 text-xs text-gray-500 font-medium capitalize whitespace-nowrap">
                    {rowCh.replace(/_/g, ' ')}
                  </td>
                  {channels.map((colCh, ci) => {
                    if (ri === ci) {
                      return (
                        <td key={colCh} className="p-2 text-center">
                          <div className="w-full h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-300">—</span>
                          </div>
                        </td>
                      );
                    }
                    if (ri > ci) {
                      return (
                        <td key={colCh} className="p-2 text-center">
                          <div className="w-full h-12 bg-gray-50/50 rounded-lg" />
                        </td>
                      );
                    }
                    const msgPair = getPair(rowCh, colCh, 'key_message');
                    const ctaPair = getPair(rowCh, colCh, 'cta');
                    const tonePair = getPair(rowCh, colCh, 'tone');
                    const pairs = [msgPair, ctaPair, tonePair].filter(Boolean) as ConsistencyPair[];
                    const worstStatus = pairs.some(p => p.status === 'divergent')
                      ? 'divergent'
                      : pairs.some(p => p.status === 'adapted')
                        ? 'adapted'
                        : 'aligned';

                    return (
                      <td key={colCh} className="p-2 text-center">
                        <button
                          onClick={() => setSelectedPair(pairs.find(p => p.status === 'divergent') || pairs[0] || null)}
                          className={`w-full h-12 rounded-lg border ${getCellColor(worstStatus)} flex items-center justify-center gap-1.5 transition-colors cursor-pointer`}
                        >
                          {pairs.map((p, i) => (
                            <div
                              key={i}
                              className={`w-2.5 h-2.5 rounded-full ${getStatusDot(p.status)}`}
                              title={`${dimensionLabels[p.dimension] || p.dimension}: ${p.status}`}
                            />
                          ))}
                          {pairs.length === 0 && <span className="text-xs text-gray-300">—</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-500">Aligned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs text-gray-500">Adapted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-xs text-gray-500">Divergent</span>
          </div>
          <div className="text-xs text-gray-400 ml-auto">Dots = Message · CTA · Tone</div>
        </div>
      </div>

      {/* Selected Pair Detail */}
      {selectedPair && (
        <div className="card border-blue-100 bg-blue-50/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-700">
                {selectedPair.channel_a.replace(/_/g, ' ')} ↔ {selectedPair.channel_b.replace(/_/g, ' ')}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(selectedPair.status)}`}>
                  {selectedPair.status}
                </span>
                <span className="text-xs text-gray-400">
                  {dimensionLabels[selectedPair.dimension] || selectedPair.dimension}
                </span>
              </div>
            </div>
            <button onClick={() => setSelectedPair(null)} className="text-gray-300 hover:text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600">{selectedPair.explanation}</p>
          {selectedPair.suggested_fix && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-1">Suggested Fix</p>
              <p className="text-xs text-gray-600">{selectedPair.suggested_fix}</p>
            </div>
          )}
        </div>
      )}

      {/* All Divergent Issues */}
      {report.divergent_count > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Divergent Issues ({report.divergent_count})
          </h3>
          <div className="space-y-3">
            {report.pairs
              .filter(p => p.status === 'divergent')
              .map((p, i) => (
                <div key={i} className="p-3 bg-red-50/50 border border-red-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-red-600 capitalize">
                      {p.channel_a.replace(/_/g, ' ')} ↔ {p.channel_b.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {dimensionLabels[p.dimension] || p.dimension}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{p.explanation}</p>
                  {p.suggested_fix && (
                    <p className="text-xs text-blue-600 mt-1.5">Fix: {p.suggested_fix}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-3">Recommendations</h3>
          <div className="space-y-2">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-sm text-gray-600">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
