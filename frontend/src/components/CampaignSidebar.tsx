import type { CampaignSession } from '../types';

interface CampaignSidebarProps {
  sessions: CampaignSession[];
  activeSessionId: string | null;
  onSelectSession: (session: CampaignSession) => void;
  onDeleteSession: (id: string) => void;
  onNewCampaign: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

const stepLabels: Record<string, string> = {
  brief: 'Brief',
  questions: 'Clarify',
  plan: 'Plan',
  qa: 'QA Complete',
};

const stepColors: Record<string, string> = {
  brief: 'bg-slate-100 text-slate-600',
  questions: 'bg-blue-50 text-blue-600',
  plan: 'bg-amber-50 text-amber-600',
  qa: 'bg-emerald-50 text-emerald-600',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CampaignSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onNewCampaign,
  collapsed,
  onToggle,
}: CampaignSidebarProps) {
  if (collapsed) {
    return (
      <div className="w-12 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-3">
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="w-6 h-px bg-gray-100" />
        {sessions.slice(0, 5).map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectSession(s)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
              activeSessionId === s.id
                ? 'bg-slate-800 text-white'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
            title={s.name || 'Untitled'}
          >
            {(s.name || 'U')[0].toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Sidebar header */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Campaign History</span>
        </div>
        <button
          onClick={onToggle}
          className="w-7 h-7 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          title="Collapse sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* New campaign button */}
      <div className="px-3 py-3">
        <button
          onClick={onNewCampaign}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Campaign
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {sessions.length === 0 ? (
          <div className="text-center py-10">
            <svg className="w-8 h-8 mx-auto text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-xs text-gray-400">No campaigns yet</p>
            <p className="text-xs text-gray-300 mt-0.5">Start your first one above</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`group relative px-3 py-3 rounded-xl cursor-pointer transition-all ${
                  activeSessionId === session.id
                    ? 'bg-slate-50 border border-slate-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${
                      activeSessionId === session.id ? 'text-slate-800' : 'text-gray-700'
                    }`}>
                      {session.name || 'Untitled Campaign'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${stepColors[session.step]}`}>
                        {stepLabels[session.step]}
                      </span>
                      {(session.planVersions?.length ?? 0) > 1 && (
                        <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-violet-50 text-violet-600">
                          v{session.planVersions!.length}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {timeAgo(session.createdAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-all"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar footer */}
      {sessions.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-300 text-center">
            {sessions.length} campaign{sessions.length !== 1 ? 's' : ''} · Stored locally
          </p>
        </div>
      )}
    </div>
  );
}
