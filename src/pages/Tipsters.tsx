import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ThumbsUp, ThumbsDown, Trophy, Star, Send, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/EmptyState';

interface Tip {
  id: string; user_id: string; match: string; prediction: string;
  reasoning: string; odds: number; likes: number; dislikes: number;
  created_at: string; profiles?: { full_name: string; };
  user_vote?: 'like' | 'dislike' | null;
}

export default function Tipsters() {
  const { user } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ match: '', prediction: '', reasoning: '', odds: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTips = async () => {
    const { data } = await supabase
      .from('community_tips')
      .select('*, profiles(full_name)')
      .order('likes', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30);
    setTips(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTips(); }, []);

  const submitTip = async () => {
    if (!user) { toast.error('Sign in to share tips'); return; }
    if (!form.match || !form.prediction || !form.reasoning) { toast.error('Fill all fields'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('community_tips').insert({
        user_id: user.id, match: form.match,
        prediction: form.prediction, reasoning: form.reasoning,
        odds: parseFloat(form.odds) || null, likes: 0, dislikes: 0,
      });
      if (error) throw error;
      toast.success('Tip shared! 🎉');
      setForm({ match: '', prediction: '', reasoning: '', odds: '' });
      setShowForm(false);
      fetchTips();
    } catch { toast.error('Failed to submit tip'); }
    finally { setSubmitting(false); }
  };

  const vote = async (tipId: string, type: 'like' | 'dislike') => {
    if (!user) { toast.error('Sign in to vote'); return; }
    const tip = tips.find(t => t.id === tipId);
    if (tip?.user_vote === type) return;
    await supabase.from('tip_votes').upsert({ tip_id: tipId, user_id: user.id, vote: type }, { onConflict: 'tip_id,user_id' });
    const delta = type === 'like' ? { likes: (tip?.likes ?? 0) + 1 } : { dislikes: (tip?.dislikes ?? 0) + 1 };
    await supabase.from('community_tips').update(delta).eq('id', tipId);
    setTips(prev => prev.map(t => t.id === tipId ? { ...t, ...delta, user_vote: type } : t));
  };

  const topTipsters = [...new Map(tips.map(t => [t.user_id, { name: t.profiles?.full_name ?? 'Anonymous', tips: tips.filter(x => x.user_id === t.user_id).length, likes: tips.filter(x => x.user_id === t.user_id).reduce((s, x) => s + x.likes, 0) }])).values()]
    .sort((a, b) => b.likes - a.likes).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Community Tipsters | PredictPro" description="Community football tips from verified tipsters. Share predictions, vote on tips, track accuracy." />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Users className="h-8 w-8 text-primary" />Community Tipsters</h1>
            <p className="text-muted-foreground mt-1">Share tips, vote on predictions, track who's hot.</p>
          </div>
          <Button onClick={() => setShowForm(f => !f)} className="gap-2">
            <Send className="h-4 w-4" />{showForm ? 'Cancel' : 'Share a Tip'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Submit form */}
            {showForm && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3"><CardTitle className="text-base">Share Your Tip</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Match (e.g. Arsenal vs Chelsea)" value={form.match} onChange={e => setForm(f => ({ ...f, match: e.target.value }))} />
                  <Input placeholder="Prediction (e.g. Arsenal Win / Over 2.5)" value={form.prediction} onChange={e => setForm(f => ({ ...f, prediction: e.target.value }))} />
                  <Input placeholder="Odds (e.g. 1.85)" type="number" step="0.01" value={form.odds} onChange={e => setForm(f => ({ ...f, odds: e.target.value }))} />
                  <Textarea placeholder="Your reasoning (min 20 chars)..." value={form.reasoning} onChange={e => setForm(f => ({ ...f, reasoning: e.target.value }))} rows={3} />
                  <Button onClick={submitTip} disabled={submitting} className="w-full">
                    {submitting ? 'Submitting...' : 'Share Tip 🚀'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Tips list */}
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Card key={i}><CardContent className="p-4 h-28 animate-pulse bg-muted/30" /></Card>)}</div>
            ) : tips.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No tips yet" description="Be the first to share a tip with the community!" actionLabel="Share a Tip" onAction={() => setShowForm(true)} />
            ) : tips.map(tip => (
              <Card key={tip.id} className="hover:border-primary/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {(tip.profiles?.full_name ?? 'A').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{tip.profiles?.full_name ?? 'Anonymous'}</span>
                        <span className="text-xs text-muted-foreground">{new Date(tip.created_at).toLocaleDateString('en-KE')}</span>
                        {tip.odds && <Badge variant="outline" className="text-xs">@ {tip.odds}</Badge>}
                      </div>
                      <p className="font-bold mt-1">{tip.match}</p>
                      <Badge className="my-1.5 bg-primary/10 text-primary border-primary/20">{tip.prediction}</Badge>
                      <p className="text-sm text-muted-foreground">{tip.reasoning}</p>
                      <div className="flex gap-3 mt-3">
                        <button onClick={() => vote(tip.id, 'like')}
                          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors ${tip.user_vote === 'like' ? 'bg-green-500 text-white' : 'bg-muted hover:bg-green-100 hover:text-green-700'}`}>
                          <ThumbsUp className="h-3.5 w-3.5" />{tip.likes}
                        </button>
                        <button onClick={() => vote(tip.id, 'dislike')}
                          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors ${tip.user_vote === 'dislike' ? 'bg-red-500 text-white' : 'bg-muted hover:bg-red-100 hover:text-red-700'}`}>
                          <ThumbsDown className="h-3.5 w-3.5" />{tip.dislikes}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top tipsters sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />Top Tipsters</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {topTipsters.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No tipsters yet</p>
                ) : topTipsters.map((t, i) => (
                  <div key={t.name} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-400 text-orange-900' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.tips} tips • {t.likes} 👍</p>
                    </div>
                    {i === 0 && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
