import { useState, useRef, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { MessageCircle, X, Send, Bot, Loader2, ChevronDown } from 'lucide-react';

interface Msg { role: 'user' | 'assistant'; content: string; }

export const AIChatbot = () => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'assistant',
    content: "Hi! I'm PredictPro AI 🤖 Ask me about any match, today's best bets, or betting strategy!",
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaId = useId();
  const chatId = useId();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMsgs(m => [...m, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const data = await callEdgeFn('ai-chat', { message: text, history: msgs.slice(-8) }) as { reply?: string };
      setMsgs(m => [...m, { role: 'assistant', content: data?.reply ?? 'Sorry, I had trouble responding. Try again!' }]);
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close AI chat' : 'Open AI football predictions chat'}
        aria-expanded={open}
        aria-controls="ai-chatbot-panel"
        className="fixed bottom-20 right-4 md:bottom-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
      >
        {open
          ? <X className="h-6 w-6" aria-hidden="true" />
          : <MessageCircle className="h-6 w-6" aria-hidden="true" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          id="ai-chatbot-panel"
          role="dialog"
          aria-modal="true"
          aria-label="PredictPro AI Chat"
          className="fixed bottom-36 right-4 md:bottom-24 z-50 w-[92vw] max-w-sm bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '420px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b bg-primary/5 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">PredictPro AI</p>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" aria-hidden="true" />Online
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Messages — proper list structure */}
          <ul
            id={chatId}
            aria-live="polite"
            aria-label="Chat messages"
            className="flex-1 overflow-y-auto p-4 space-y-3 list-none m-0"
          >
            {msgs.map((m, i) => (
              <li
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </li>
            ))}
            {loading && (
              <li className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="AI is thinking" />
                </div>
              </li>
            )}
            <li ref={bottomRef as React.RefObject<HTMLLIElement>} aria-hidden="true" />
          </ul>

          {/* Quick prompts */}
          <div className="px-3 pb-1.5 flex gap-2 overflow-x-auto flex-shrink-0">
            {["Today's picks", 'Best bets', 'KPL tips'].map(q => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                aria-label={`Ask: ${q}`}
                className="text-xs whitespace-nowrap px-2.5 py-1 bg-muted hover:bg-muted/70 rounded-full border border-border transition-colors flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 pb-3 flex gap-2 flex-shrink-0 border-t pt-2">
            <label htmlFor={textareaId} className="sr-only">Chat message input</label>
            <Textarea
              id={textareaId}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about any match..."
              rows={1}
              className="resize-none text-sm min-h-0 flex-1"
              aria-label="Type your message"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 disabled:opacity-50 hover:bg-primary/90 transition-colors mt-0.5"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
