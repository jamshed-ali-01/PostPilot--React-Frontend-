import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    ImagePlus,
    MapPin,
    Sparkles,
    X,
    Upload,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    Facebook,
    Instagram,
    RefreshCw,
    Send,
    Eye,
    FileImage,
    MessageSquare,
    Zap,
    Star,
    Loader2,
    Megaphone,
    Target,
    DollarSign,
} from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
    { id: 0, title: "Creative", icon: FileImage, description: "Add ad photos" },
    { id: 1, title: "Audience", icon: Target, description: "Targeting & details" },
    { id: 2, title: "Ad Copy", icon: Sparkles, description: "AI generated copy" },
    { id: 3, title: "Launch", icon: Megaphone, description: "Review & publish" },
];

const CreateAd = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [images, setImages] = useState<{ url: string; label: string }[]>([]);
    const [postcode, setPostcode] = useState("");
    const [jobType, setJobType] = useState("Kitchen Renovation");
    const [testimonial, setTestimonial] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const [aiCaption, setAiCaption] = useState("");
    const [budget, setBudget] = useState("50");

    const handleImageUpload = () => {
        fileInputRef.current?.click();
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, {
                    url: reader.result as string,
                    label: `Ad Photo ${prev.length + 1}`
                }]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const nextStep = async () => {
        if (currentStep === 0 && images.length === 0) {
            toast({
                title: "Please add at least one photo",
                description: "Ads perform better with high-quality job photos.",
                variant: "destructive",
            });
            return;
        }
        if (currentStep === 1 && !postcode) {
            toast({
                title: "Please enter a postcode",
                description: "Postcode helps target the right local audience.",
                variant: "destructive",
            });
            return;
        }
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            if (currentStep === 1) {
                await generateAdCopy();
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const generateAdCopy = async () => {
        setIsGenerating(true);
        try {
            const prompt = `Create a high-converting Meta Ad for ${jobType} completed${postcode ? ' in ' + postcode : ''}${customerName ? ' for ' + customerName : ''}${testimonial ? '. Customer testimonial: "' + testimonial + '"' : ''}. Focus on local lead generation.`;
            const imageUrlList = images.map(img => img.url);

            const result = await graphqlRequest(`
        mutation GenerateAI($prompt: String!, $tone: String, $location: String, $imageUrls: [String!]) {
          generateAIContent(prompt: $prompt, tone: $tone, location: $location, imageUrls: $imageUrls)
        }
      `, { prompt, tone: "Professional & Persuasive", location: postcode, imageUrls: imageUrlList });

            setAiCaption(result?.generateAIContent || '');
            toast({
                title: "AI Ad Copy generated!",
                description: "The copy is optimized for Meta lead generation.",
            });
        } catch (error: any) {
            toast({
                title: "AI generation failed",
                description: "We couldn't generate the ad copy right now.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // UI Mock: In a real app, this would call a createMetaAd mutation
        setTimeout(() => {
            toast({
                title: "Ad submitted for review!",
                description: "Your Meta Ad has been sent for approval.",
            });
            navigate('/dashboard');
        }, 2000);
    };

    return (
        <DashboardLayout>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={onFileChange}
            />
            <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-4 sm:mb-8">
                    <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                        Create Meta Ad
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Launch professional Facebook & Instagram ads using your recent work photos
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="hidden sm:block mb-8">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-6 left-0 right-0 h-0.5 bg-border -z-10" />
                        <div
                            className="absolute top-6 left-0 h-0.5 bg-accent transition-all duration-500 -z-10"
                            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                        />

                        {steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isCompleted = index < currentStep;
                            const isActive = index === currentStep;
                            return (
                                <div key={step.id} className="flex flex-col items-center relative">
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isCompleted
                                            ? "bg-accent text-accent-foreground"
                                            : isActive
                                                ? "bg-accent text-accent-foreground ring-4 ring-accent/20"
                                                : "bg-secondary text-muted-foreground"
                                            }`}
                                    >
                                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                                    </div>
                                    <div className="mt-3 text-center">
                                        <p className={`text-sm font-medium ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                                            {step.title}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <Card variant="elevated" className="overflow-hidden border-t-4 border-t-accent">
                    <CardContent className="p-4 sm:p-6 lg:p-8">
                        {/* Step 1: Creative */}
                        {currentStep === 0 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-soft/30 border border-accent/20">
                                    <Megaphone className="w-6 h-6 text-accent" />
                                    <div>
                                        <p className="font-semibold text-foreground">Marketing Strategy</p>
                                        <p className="text-sm text-muted-foreground">Showcase your best transformation to attract local leads.</p>
                                    </div>
                                </div>

                                <div
                                    onClick={handleImageUpload}
                                    className="border-2 border-dashed border-border rounded-xl p-8 lg:p-12 text-center hover:border-accent hover:bg-accent-soft/10 transition-all cursor-pointer group"
                                >
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-soft flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-accent" />
                                    </div>
                                    <p className="font-medium text-foreground text-lg">Upload Ad Creative</p>
                                    <p className="text-sm text-muted-foreground mt-2">Best for 1080x1080 resolution</p>
                                </div>

                                {images.length > 0 && (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {images.map((image, index) => (
                                            <div key={index} className="relative group rounded-xl overflow-hidden border border-border">
                                                <img src={image.url} alt="" className="w-full h-36 object-cover" />
                                                <button
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-2 right-2 w-7 h-7 bg-foreground/80 text-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Audience */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Target className="w-4 h-4 text-accent" />
                                                Target Area (Postcode)
                                            </Label>
                                            <Input
                                                placeholder="e.g., SW1A 1AA"
                                                value={postcode}
                                                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-accent" />
                                                Daily Budget (£)
                                            </Label>
                                            <Input
                                                type="number"
                                                value={budget}
                                                onChange={(e) => setBudget(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Job Description</Label>
                                            <select
                                                value={jobType}
                                                onChange={(e) => setJobType(e.target.value)}
                                                className="input-premium w-full"
                                            >
                                                <option>Kitchen Renovation</option>
                                                <option>Bathroom Installation</option>
                                                <option>Boiler Service</option>
                                                <option>Emergency Plumbing</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Customer Result (Optional)</Label>
                                            <Textarea
                                                placeholder="Describe the result or add a testimonial..."
                                                value={testimonial}
                                                onChange={(e) => setTestimonial(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Ad Copy */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-accent" />
                                        AI Optimized Ad Copy
                                    </h2>
                                    <Button variant="outline" size="sm" onClick={generateAdCopy} disabled={isGenerating}>
                                        <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                                        Refresh
                                    </Button>
                                </div>
                                {isGenerating ? (
                                    <div className="h-64 flex flex-col items-center justify-center bg-accent-soft/10 rounded-xl border-2 border-dashed border-accent/20">
                                        <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
                                        <p className="text-muted-foreground font-medium">Fine-tuning your ad strategy...</p>
                                    </div>
                                ) : (
                                    <Textarea
                                        value={aiCaption}
                                        onChange={(e) => setAiCaption(e.target.value)}
                                        rows={12}
                                        className="font-normal border-accent/20 focus:border-accent"
                                    />
                                )}
                            </div>
                        )}

                        {/* Step 4: Final Preview */}
                        {currentStep === 3 && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="grid lg:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="font-display font-bold text-foreground">Mobile Ad Preview</h3>
                                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg max-w-sm mx-auto">
                                            <div className="p-3 flex items-center gap-2 border-b">
                                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">P</div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold">{user?.business?.name || "Your Business"}</p>
                                                    <p className="text-[10px] text-muted-foreground">Sponsored</p>
                                                </div>
                                            </div>
                                            <div className="aspect-square bg-secondary">
                                                <img src={images[0]?.url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="p-3 space-y-2">
                                                <p className="text-xs text-foreground line-clamp-3">{aiCaption}</p>
                                                <div className="flex items-center justify-between bg-secondary/50 p-2 rounded border">
                                                    <p className="text-[10px] font-bold uppercase tracking-tight">Learn More</p>
                                                    <ArrowRight className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="font-display font-bold text-foreground">Campaign Settings</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between p-3 rounded-lg bg-secondary/30 border">
                                                <span className="text-muted-foreground">Target Postcode</span>
                                                <span className="font-bold">{postcode}</span>
                                            </div>
                                            <div className="flex justify-between p-3 rounded-lg bg-secondary/30 border">
                                                <span className="text-muted-foreground">Daily Budget</span>
                                                <span className="font-bold text-accent">£{budget}</span>
                                            </div>
                                            <div className="flex justify-between p-3 rounded-lg bg-secondary/30 border">
                                                <span className="text-muted-foreground">Estimated Daily Reach</span>
                                                <span className="font-bold">1.2k - 3.5k</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="mt-8 pt-6 border-t flex items-center justify-between">
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                disabled={currentStep === 0 || isSubmitting}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                variant="default"
                                onClick={currentStep === steps.length - 1 ? handleSubmit : nextStep}
                                disabled={isSubmitting}
                                className={currentStep === steps.length - 1 ? "bg-accent hover:bg-accent/90" : ""}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : currentStep === steps.length - 1 ? (
                                    <>
                                        < Megaphone className="w-4 h-4 mr-2" />
                                        Launch Campaign
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default CreateAd;
