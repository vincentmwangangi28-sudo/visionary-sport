import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Send, User, Loader2, Sparkles, X, MessageSquare } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

const QUICK_QUESTIONS = [
  "What are today's best bets?",
  "Which match has highest confidence?",
  "Explain value betting",
  "How does AI predict matches?",
  "Best leagues to bet on?",
];

export const AIChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey! I'm PredictPro AI 🤖 Ask me anything about today's matches, predictions, or betting strategy. How can I help?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const { data } = await supabase.functions.invoke('ai-chat', {
        body: { message: msg, history: newMessages.slice(-8) },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data?.reply || 'Sorry, I could not respond. Please try again.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
        aria-label="Open AI Chat">
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {!open && <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[350px] max-w-[calc(100vw-3rem)]">
          <Card className="shadow-2xl border-primary/20">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="relative">
                  <Bot className="h-6 w-6 text-primary" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-background" />
                </div>
                PredictPro AI
                <span className="ml-auto text-xs font-normal text-green-600 flex items-center gap-1"><Sparkles className="h-3 w-3" />Online</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages */}
              <div className="h-72 overflow-y-auto p-3 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><Bot className="h-4 w-4" /></div>
                    <div className="bg-muted rounded-xl px-3 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick questions */}
              {messages.length <= 1 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1">
                  {QUICK_QUESTIONS.map(q => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded-full border transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t flex gap-2">
                <Input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about any match..." className="text-sm" disabled={loading} />
                <Button size="sm" onClick={() => sendMessage()} disabled={!input.trim() || loading} className="px-3">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
