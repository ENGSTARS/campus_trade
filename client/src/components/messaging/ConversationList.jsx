import { formatDate } from '@/utils/formatters'

export function ConversationList({ conversations, activeConversationId, onDelete, onSelect }) {
  return (
    <aside className="card-surface h-[70vh] overflow-auto p-2">
      <h2 className="px-2 py-2 text-sm font-semibold text-slate-900">Conversations</h2>
      <div className="space-y-1">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`rounded-xl px-3 py-3 transition ${
              conversation.id === activeConversationId ? 'bg-brand-50' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <button className="min-w-0 flex-1 text-left" onClick={() => onSelect(conversation.id)}>
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
              <button
                className="rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-white hover:text-rose-600"
                onClick={() => onDelete(conversation)}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
