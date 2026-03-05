import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Camera,
  Wand2,
  Calendar,
  MapPin,
  Star,
  ChevronRight,
} from "lucide-react";

import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";

const features = [
  {
    icon: Camera,
    title: "Upload Job Photos",
    description: "Staff upload before & after photos directly from the field",
  },
  {
    icon: Wand2,
    title: "AI-Powered Captions",
    description: "Automatically generate engaging, branded social content",
  },
  {
    icon: MapPin,
    title: "Geo-Targeted Posts",
    description: "Reach customers in your service area with local hashtags",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "AI picks the best times to post for maximum engagement",
  },
];

const testimonials = [
  {
    quote: "PostPilot has transformed how we handle social media. Our engagement is up 300%.",
    author: "Sarah Mitchell",
    role: "Owner, Mitchell's HVAC",
    rating: 5,
  },
  {
    quote: "My team uploads photos from jobs and PostPilot does the rest. It's incredible.",
    author: "James Carter",
    role: "Manager, Carter Roofing",
    rating: 5,
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="gradient-hero pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft text-accent text-sm font-medium mb-6 animate-fade-up">
              <Sparkles className="w-4 h-4" />
              AI-Powered Social Media for Local Businesses
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-up delay-100">
              Turn Job Photos Into
              <span className="text-primary"> Powerful Social Posts</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 animate-fade-up delay-200 max-w-2xl mx-auto">
              Your team uploads photos from the field. Our AI creates geo-targeted,
              engagement-optimized posts that bring in more local customers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
              <Link to="/pricing">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-up delay-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              From Job Site to Social Media in Minutes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple workflow that turns your team's daily work into consistent, professional social content.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="stat-card group hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center mb-4 group-hover:bg-accent-soft transition-colors">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Simple 3-Step Process
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload", desc: "Staff capture and upload job photos with a single tap" },
              { step: "02", title: "Generate", desc: "AI creates captions, hashtags, and picks optimal posting times" },
              { step: "03", title: "Approve & Post", desc: "Review, edit if needed, and publish across all platforms" },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                <div className="flex items-start gap-4">
                  <span className="font-display text-5xl font-bold text-primary/20">{item.step}</span>
                  <div className="pt-2">
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                {index < 2 && (
                  <ChevronRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Trusted by Local Businesses
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial) => (
              <div key={testimonial.author} className="stat-card">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>
                <blockquote className="text-lg text-foreground mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 gradient-subtle">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Automate Your Social Media?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of local businesses growing their online presence with AI.
          </p>
          <Link to="/pricing">
            <Button variant="hero" size="xl">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Landing;
