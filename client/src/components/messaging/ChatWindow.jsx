import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function ChatWindow({ messages, participantName, onSend }) {
  const [text, setText] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <section className="card-surface flex h-[70vh] flex-col p-0">
      <header className="border-b border-slate-100 px-4 py-3">
        <h2 className="font-semibold text-slate-900">{participantName || 'Select a conversation'}</h2>
      </header>

      <div className="flex-1 space-y-2 overflow-auto bg-slate-50 p-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}>
            <p
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                message.fromMe ? 'bg-brand-600 text-white' : 'bg-white text-slate-800'
              }`}
            >
              {message.message}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input
          className="input-base"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type your message"
        />
        <Button type="submit">Send</Button>
      </form>
    </section>
  )
}
