import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Star, MessageSquare } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const CustomerTestimonial = () => {
  const [submitted, setSubmitted] = useState(false);
  const [areaOfWork, setAreaOfWork] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [testimonialText, setTestimonialText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send to the backend
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-20 h-20 rounded-full bg-success-soft flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">
            Thank You!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your testimonial has been received. We really appreciate you taking the time to share your experience with us.
          </p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-6 h-6 text-accent fill-accent" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" />
          </div>
          <CardTitle className="font-display text-2xl">Share Your Experience</CardTitle>
          <p className="text-muted-foreground mt-2">
            We'd love to hear about the work we did for you
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="areaOfWork" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                What work did we do for you?
              </Label>
              <select
                id="areaOfWork"
                value={areaOfWork}
                onChange={(e) => setAreaOfWork(e.target.value)}
                className="input-premium w-full"
                required
              >
                <option value="">Select type of work...</option>
                <option value="Kitchen Renovation">Kitchen Renovation</option>
                <option value="Bathroom Installation">Bathroom Installation</option>
                <option value="Plumbing Repair">Plumbing Repair</option>
                <option value="Boiler Installation">Boiler Installation</option>
                <option value="Central Heating">Central Heating</option>
                <option value="Emergency Repair">Emergency Repair</option>
                <option value="General Maintenance">General Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Your Name</Label>
              <Input
                id="customerName"
                placeholder="e.g., John Smith"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                First name only is fine if you prefer
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testimonial" className="flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" />
                Your Testimonial
              </Label>
              <Textarea
                id="testimonial"
                placeholder="Tell us about your experience..."
                value={testimonialText}
                onChange={(e) => setTestimonialText(e.target.value)}
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Submit Testimonial
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By submitting, you agree that we may use your testimonial for marketing purposes.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerTestimonial;
