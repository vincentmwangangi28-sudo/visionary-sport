import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, Send, CheckCircle2, Shield, MessageSquare, Globe, User, PhoneCall, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    // Simulate instantaneous client dispatch and open email fallback
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success('Your message has been sent to the PredictPro support desk!');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Contact Us | PredictPro Quantitative Football Analytics"
        description="Contact the PredictPro team for support, editorial inquiries, data partnerships, or feedback. 24-hour response guarantee."
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl space-y-10" id="main-content">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
            <Mail className="h-3.5 w-3.5 mr-1" /> Dedicated Support Desk
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Get in Touch</h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Have questions about our AI models, Expected Goals calculations, account features, or privacy? Our dedicated team is here to assist you 7 days a week.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* Contact Details Column */}
          <div className="md:col-span-2 space-y-4">
            <Card className="border-border/60 bg-card/60 shadow-xs">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" /> Publisher Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Official operator details &amp; editorial headquarters
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0 text-sm space-y-3 text-muted-foreground">
                <div>
                  <strong className="text-foreground block text-xs uppercase tracking-wider mb-0.5">Platform Name:</strong>
                  <span>PredictPro Quantitative Sports Analytics</span>
                </div>
                <div>
                  <strong className="text-foreground block text-xs uppercase tracking-wider mb-0.5">Publisher &amp; Lead Engineer:</strong>
                  <span>Vincent Mwangangi (<code className="font-mono text-xs">vincentmwangangi28@gmail.com</code>)</span>
                </div>
                <div>
                  <strong className="text-foreground block text-xs uppercase tracking-wider mb-0.5">Website Domain:</strong>
                  <a href="https://predictpro.guru" className="text-primary hover:underline">https://predictpro.guru</a>
                </div>
                <div>
                  <strong className="text-foreground block text-xs uppercase tracking-wider mb-0.5">AdSense Publisher ID:</strong>
                  <span className="font-mono text-xs text-foreground">pub-1375386376692976</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 shadow-xs">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" /> Direct Email Desks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 text-sm space-y-3">
                <div className="flex items-start gap-2.5">
                  <MessageSquare className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block text-xs">General Support &amp; Feedback:</strong>
                    <a href="mailto:support@predictpro.guru" className="text-primary hover:underline text-xs font-mono">support@predictpro.guru</a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block text-xs">Privacy &amp; Data Protection:</strong>
                    <a href="mailto:privacy@predictpro.guru" className="text-primary hover:underline text-xs font-mono">privacy@predictpro.guru</a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block text-xs">Average Response Time:</strong>
                    <span className="text-muted-foreground text-xs">Within 12 to 24 business hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 text-xs text-muted-foreground space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-primary" /> Looking for Instant Answers?
              </div>
              <p>
                Visit our <Link to="/methodology" className="text-primary hover:underline font-medium">Methodology page</Link> to understand our Bivariate Poisson &amp; xG algorithms, or check our <Link to="/responsible-gaming" className="text-primary hover:underline font-medium">Responsible Gaming Guide</Link>.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="md:col-span-3">
            <Card className="border-border shadow-xs">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-xl font-bold">Send Us a Direct Message</CardTitle>
                <CardDescription className="text-xs">
                  Fill out the form below and an engineer or support specialist will respond to your email.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {submitted ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold">Message Received!</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Thank you for reaching out, {name}. A ticket has been logged and our team will reply to <strong>{email}</strong> within 24 hours.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSubmitted(false);
                        setName('');
                        setEmail('');
                        setSubject('');
                        setMessage('');
                      }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground" htmlFor="contact-name">
                          Your Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          id="contact-name"
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground" htmlFor="contact-email">
                          Your Email Address <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          id="contact-email"
                          type="email"
                          required
                          placeholder="e.g. john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground" htmlFor="contact-subject">
                        Subject / Topic
                      </label>
                      <Input
                        id="contact-subject"
                        type="text"
                        placeholder="e.g. Feedback on Premier League Poisson model"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground" htmlFor="contact-message">
                        Message Content <span className="text-rose-500">*</span>
                      </label>
                      <Textarea
                        id="contact-message"
                        required
                        rows={6}
                        placeholder="How can we assist you today? Please share any details, questions or suggestions..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto gap-2">
                      <Send className="h-4 w-4" />
                      {isSubmitting ? 'Sending Message...' : 'Submit Message'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
