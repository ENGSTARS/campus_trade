import { formatDate } from '@/utils/formatters'

export function ConversationList({ conversations, activeConversationId, onSelect }) {
  return (
    <aside className="card-surface h-[70vh] overflow-auto p-2">
      <h2 className="px-2 py-2 text-sm font-semibold text-slate-900">Conversations</h2>
      <div className="space-y-1">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            className={`w-full rounded-xl px-3 py-3 text-left transition ${
              conversation.id === activeConversationId ? 'bg-brand-50' : 'hover:bg-slate-50'
            }`}
            onClick={() => onSelect(conversation.id)}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-slate-800">{conversation.name}</p>
              {conversation.unread > 0 ? (
                <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-semibold text-white">
                  {conversation.unread}
                </span>
              ) : null}
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">{conversation.lastMessage}</p>
            <p className="mt-1 text-[11px] text-slate-400">{formatDate(conversation.updatedAt)}</p>
          </button>
        ))}
      </div>
    </aside>
  )
}
