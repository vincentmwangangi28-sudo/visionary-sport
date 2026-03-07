import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const MAX_MESSAGE_LENGTH = 500;
const MIN_MESSAGE_LENGTH = 1;
const RATE_LIMIT_MS = 2000; // 2 seconds between messages

function sanitizeMessage(input: string): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{S}\p{M}]/gu, '') // allow only valid unicode chars
    .slice(0, MAX_MESSAGE_LENGTH);
}

interface ChatMessage {
  id: string;
  match_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string;
}

interface LiveMatchChatProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
}

export const LiveMatchChat = ({ matchId, homeTeam, awayTeam }: LiveMatchChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("match_chat_messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`match-chat-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_chat_messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please login to chat");
      return;
    }

    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("match_chat_messages").insert({
        match_id: matchId,
        user_id: user.id,
        message: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Live Chat: {homeTeam} vs {awayTeam}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <ScrollArea className="h-[200px] pr-3" ref={scrollRef}>
          <div className="space-y-2">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No messages yet. Be the first to chat!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 text-sm ${
                    msg.user_id === user?.id ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <div
                    className={`rounded-lg px-3 py-1.5 max-w-[75%] ${
                      msg.user_id === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="break-words">{msg.message}</p>
                    <span className="text-[10px] opacity-70">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="flex gap-2 mt-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={user ? "Type a message..." : "Login to chat"}
            disabled={!user || isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!user || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
