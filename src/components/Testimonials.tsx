import { Card } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "David Omondi",
    role: "Professional Bettor, Nairobi",
    content: "PredictPro's AI predictions have completely transformed my approach. The confidence scores and detailed reasoning help me make smarter decisions every single day.",
    rating: 5,
    avatar: "DO",
  },
  {
    name: "Sarah Mwangi",
    role: "Sports Analyst, Mombasa",
    content: "The accuracy rate is incredible. I've been tracking my bets for 3 months and I'm up 40% thanks to their insights. The real-time updates are game-changing.",
    rating: 5,
    avatar: "SM",
  },
  {
    name: "James Kamau",
    role: "Weekend Bettor, Kisumu",
    content: "I was skeptical at first, but the transparent reasoning behind each prediction won me over. It's like having an expert analyst in my pocket. Highly recommend!",
    rating: 5,
    avatar: "JK",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Trusted by <span className="bg-gradient-hero bg-clip-text text-transparent">Thousands</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our users are saying about PredictPro
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="p-8 hover:shadow-card transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-16 h-16 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Content */}
              <p className="text-muted-foreground mb-6 leading-relaxed italic relative z-10">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center">
                  <span className="text-white font-bold">{testimonial.avatar}</span>
                </div>
                <div>
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Join <span className="text-primary font-semibold">10,000+ active users</span> making smarter betting decisions
          </p>
        </div>
      </div>
    </section>
  );
};
