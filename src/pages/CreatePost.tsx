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
  Linkedin,
  RefreshCw,
  Calendar,
  Clock,
  Send,
  Eye,
  FileImage,
  MessageSquare,
  Hash,
  Zap,
  Star,
  AlertCircle,
  Share2,
  Loader2,
} from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";

import { useAuth } from "@/contexts/AuthContext";

const steps = [
  { id: 0, title: "Upload Photos", icon: FileImage, description: "Add your job photos" },
  { id: 1, title: "Add Details", icon: MessageSquare, description: "Location & testimonial" },
  { id: 2, title: "AI Content", icon: Sparkles, description: "Review generated content" },
  { id: 3, title: "Submit", icon: Send, description: "Review & submit" },
];

const CreatePost = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [images, setImages] = useState<{ url: string; label: string }[]>([]);
  const [postcode, setPostcode] = useState("");
  const [jobType, setJobType] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  const [aiCaption, setAiCaption] = useState("");
  const [aiHashtags, setAiHashtags] = useState<string[]>([]);

  // Fetch Connected Social Accounts
  const { data: socialData } = useQuery({
    queryKey: ["socialAccounts"],
    queryFn: () => graphqlRequest(`
      query {
        socialAccounts {
          id
          platform
          accountName
        }
      }
    `),
  });

  const connectedAccounts = socialData?.socialAccounts || [];
  const [platformIds, setPlatformIds] = useState<string[]>([]);

  const [scheduleOption, setScheduleOption] = useState<"now" | "optimal" | "custom">("optimal");
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");

  // Fetch Post if in Edit Mode
  const { isLoading: isLoadingPost } = useQuery({
    queryKey: ["post", editId],
    queryFn: async () => {
      const result = await graphqlRequest(`
        query GetPost($id: ID!) {
          post(id: $id) {
            id
            content
            mediaUrls
            scheduledAt
            platformIds
            targetingRegions
          }
        }
      `, { id: editId });

      const p = result?.post;
      if (p) {
        // Pre-fill state
        setAiCaption(p.content.split('\n\n')[0] || p.content);
        setImages(p.mediaUrls.map((url: string, i: number) => ({ url, label: `Photo ${i + 1}` })));
        setPlatformIds(p.platformIds || []);
        setPostcode(p.targetingRegions?.[0] || "");

        if (p.scheduledAt) {
          const d = new Date(p.scheduledAt);
          setScheduleOption("custom");
          setCustomDate(format(d, "yyyy-MM-dd"));
          setCustomTime(format(d, "HH:mm"));
        }

        // Extract hashtags if any
        const tags = p.content.match(/#[\w]+/g) || [];
        setAiHashtags(tags);

        // Jump to preview step if editing
        setCurrentStep(2);
      }
      return p;
    },
    enabled: isEditMode,
  });

  const togglePlatform = (id: string) => {
    if (platformIds.includes(id)) {
      setPlatformIds(platformIds.filter(pid => pid !== id));
    } else {
      setPlatformIds([...platformIds, id]);
    }
  };

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
          label: `Photo ${prev.length + 1}`
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Clear the input so the same file can be uploaded again if needed
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImageLabel = (index: number, label: string) => {
    const newImages = [...images];
    newImages[index].label = label;
    setImages(newImages);
  };

  const nextStep = async () => {
    if (currentStep === 0 && images.length === 0) {
      toast({
        title: "Please add at least one photo",
        description: "Upload photos of your completed work to continue.",
        variant: "destructive",
      });
      return;
    }
    if (currentStep === 1 && !postcode) {
      toast({
        title: "Please enter a postcode",
        description: "The job location helps target local customers.",
        variant: "destructive",
      });
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Auto-generate AI content when entering step 3
      if (currentStep === 1) {
        await generateAICaption();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateAICaption = async () => {
    setIsGenerating(true);
    try {
      const prompt = `${jobType} completed${postcode ? ' in ' + postcode : ''}${customerName ? ' for ' + customerName : ''}${testimonial ? '. Customer said: "' + testimonial + '"' : ''}`;
      const imageUrlList = images.map(img => img.url);

      const result = await graphqlRequest(`
        mutation GenerateAI($prompt: String!, $tone: String, $location: String, $imageUrls: [String!]) {
          generateAIContent(prompt: $prompt, tone: $tone, location: $location, imageUrls: $imageUrls)
        }
      `, { prompt, tone: undefined, location: postcode, imageUrls: imageUrlList });

      const generatedText = result?.generateAIContent || '';

      // Split caption and hashtags
      const lines = generatedText.split('\n');
      const hashtagLine = lines.findIndex((l: string) => l.includes('#'));
      let captionLines = lines;
      let newHashtags: string[] = [];

      if (hashtagLine !== -1) {
        captionLines = lines.slice(0, hashtagLine);
        const hashtagText = lines.slice(hashtagLine).join(' ');
        newHashtags = hashtagText.match(/#[\w]+/g) || [];
      }

      setAiCaption(captionLines.join('\n').trim());
      if (newHashtags.length > 0) setAiHashtags(newHashtags);

      toast({
        title: "AI content generated!",
        description: "Caption is ready for your review.",
      });
    } catch (error: any) {
      toast({
        title: "AI generation failed",
        description: error.message || "Please check your API key and network connection.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateContent = () => generateAICaption();

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // Compute scheduledAt based on user's choice
      let scheduledAt: string | undefined;
      if (scheduleOption === 'custom' && customDate && customTime) {
        scheduledAt = new Date(`${customDate}T${customTime}`).toISOString();
      } else if (scheduleOption === 'optimal') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        scheduledAt = tomorrow.toISOString();
      }

      const publishNow = scheduleOption === 'now';

      const mutation = isEditMode ? `
        mutation UpdatePost($input: UpdatePostInput!) {
          updatePost(input: $input) {
            id
            status
          }
        }
      ` : `
        mutation CreatePost($input: CreatePostInput!) {
          createPost(input: $input) {
            id
            status
          }
        }
      `;

      const input: any = {
        content: aiCaption + (aiHashtags.length > 0 ? "\n\n" + aiHashtags.join(" ") : ""),
        mediaUrls: images.map(img => img.url),
        targetingRegions: postcode ? [postcode] : [],
        platformIds: platformIds,
        scheduledAt: scheduledAt,
        publishNow: publishNow,
        businessId: user.businessId,
        authorId: user.id
      };

      if (isEditMode) input.id = editId;

      const result = await graphqlRequest(mutation, { input });

      const postData = isEditMode ? result?.updatePost : result?.createPost;
      const status = postData?.status;

      toast({
        title: isEditMode ? 'Post updated!' : (publishNow ? 'Post published!' : (status === 'PENDING_APPROVAL' ? 'Post submitted for approval!' : 'Post scheduled!')),
        description: isEditMode ? 'Changes have been saved successfully.' : (status === 'PENDING_APPROVAL'
          ? 'Your post has been sent to the business owner for review.'
          : publishNow
            ? 'Your post has been published to the selected platforms.'
            : platformIds.length > 0
              ? `Your post has been scheduled to ${platformIds.length} platform(s).`
              : 'Your post has been saved.'),
      });

      setTimeout(() => {
        navigate('/schedule');
      }, 1500);
    } catch (error: any) {
      setIsSubmitting(false);
      toast({
        title: 'Error creating post',
        description: error.message || 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  const toggleHashtag = (tag: string) => {
    if (aiHashtags.includes(tag)) {
      setAiHashtags(aiHashtags.filter((t) => t !== tag));
    } else {
      setAiHashtags([...aiHashtags, tag]);
    }
  };

  const addHashtag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const input = e.currentTarget;
      let tag = input.value.trim();
      if (tag && !tag.startsWith("#")) {
        tag = `#${tag}`;
      }
      if (tag && !aiHashtags.includes(tag)) {
        setAiHashtags([...aiHashtags, tag]);
        input.value = "";
      }
    }
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
            {isEditMode ? 'Edit Post' : 'Create New Post'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isEditMode ? 'Modify your post details and schedule' : 'Upload your job photos and let AI create engaging social media content'}
          </p>
        </div>

        {/* Progress Steps - Desktop */}
        <div className="hidden sm:block mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line Background */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-border -z-10" />
            {/* Progress Line Active */}
            <div
              className="absolute top-6 left-0 h-0.5 bg-primary transition-all duration-500 -z-10"
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
                      ? "bg-primary text-primary-foreground"
                      : isActive
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-secondary text-muted-foreground"
                      }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <p
                      className={`text-sm font-medium ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                        }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Steps - Mobile */}
        <div className="sm:hidden mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">{steps[currentStep].title}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card variant="elevated" className="overflow-hidden">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            {/* Step 1: Upload Photos */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                    <FileImage className="w-5 h-5 text-primary" />
                    Upload Job Photos
                  </h2>
                  <p className="text-muted-foreground">
                    Add before & after photos of your completed work. High-quality images get better engagement.
                  </p>
                </div>

                {/* Upload Area */}
                <div
                  onClick={handleImageUpload}
                  className="border-2 border-dashed border-border rounded-xl p-8 lg:p-12 text-center hover:border-primary hover:bg-primary-soft/30 transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-soft flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-medium text-foreground text-lg">Click to upload photos</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    PNG, JPG or HEIC • Max 10MB per image
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tip: Include before & after shots for better engagement
                  </p>
                </div>

                {/* Image Preview Grid */}
                {images.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">
                        Uploaded Photos ({images.length})
                      </h3>
                      <Button variant="ghost" size="sm" onClick={handleImageUpload}>
                        <ImagePlus className="w-4 h-4 mr-1" />
                        Add More
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div
                          key={index}
                          className="relative group rounded-xl overflow-hidden border border-border"
                        >
                          <img
                            src={image.url}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-36 object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 bg-foreground/80 text-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-foreground/80 to-transparent">
                            <select
                              value={image.label}
                              onChange={(e) => updateImageLabel(index, e.target.value)}
                              className="w-full text-xs bg-transparent text-background border-none focus:outline-none cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="Before" className="text-foreground">Before</option>
                              <option value="After" className="text-foreground">After</option>
                              <option value="Detail" className="text-foreground">Detail</option>
                              <option value="Progress" className="text-foreground">Progress</option>
                              {Array.from({ length: 10 }, (_, i) => (
                                <option key={i} value={`Photo ${i + 1}`} className="text-foreground">
                                  Photo {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Add Details */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Job Details
                  </h2>
                  <p className="text-muted-foreground">
                    Add location and context to help AI create targeted content
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="postcode" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Job Location (Postcode)
                      </Label>
                      <Input
                        id="postcode"
                        placeholder="e.g., SW1A 1AA"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                        className="text-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Geo-targeting helps reach local customers in your service area
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobType">Type of Work</Label>
                      <select
                        id="jobType"
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        className="input-premium w-full"
                      >
                        <option>Kitchen Renovation</option>
                        <option>Bathroom Installation</option>
                        <option>Plumbing Repair</option>
                        <option>Boiler Installation</option>
                        <option>Central Heating</option>
                        <option>Emergency Repair</option>
                        <option>General Maintenance</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name (Optional)</Label>
                      <Input
                        id="customerName"
                        placeholder="e.g., Mrs. Smith"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        First name or initial only recommended for privacy
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="testimonial" className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-accent" />
                        Customer Testimonial (Optional)
                      </Label>
                      <Textarea
                        id="testimonial"
                        placeholder="Add a quote from your happy customer..."
                        value={testimonial}
                        onChange={(e) => setTestimonial(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Tip Box */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-soft/50 border border-accent/20">
                  <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Pro Tip</p>
                    <p className="text-sm text-muted-foreground">
                      Posts with customer testimonials get 40% more engagement on average
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review AI Content */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      AI Generated Content
                    </h2>
                    <p className="text-muted-foreground">
                      Review and customize your AI-generated post
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={regenerateContent}
                    disabled={isGenerating}
                    className="flex-shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                    {isGenerating ? "Generating..." : "Regenerate"}
                  </Button>
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                  {/* Caption Editor - 3 columns */}
                  <div className="lg:col-span-3 space-y-5">
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between">
                        <span>Caption</span>
                        <span className="text-xs text-muted-foreground">
                          {aiCaption.length} characters
                        </span>
                      </Label>

                      {isGenerating ? (
                        <div className="h-[300px] w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse scale-150" />
                            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-xl shadow-primary/20 flex items-center justify-center animate-bounce">
                              <Sparkles className="w-10 h-10 text-primary-foreground" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent border-4 border-background flex items-center justify-center animate-spin-slow">
                              <RefreshCw className="w-4 h-4 text-accent-foreground" />
                            </div>
                          </div>
                          <div className="text-center space-y-2 px-6">
                            <h3 className="font-display font-bold text-xl text-foreground">AI is crafting your post...</h3>
                            <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                              Analyzing your photos and job details to create a high-converting caption
                            </p>
                            <div className="flex items-center justify-center gap-1.5 pt-2">
                              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Textarea
                          value={aiCaption}
                          onChange={(e) => setAiCaption(e.target.value)}
                          rows={10}
                          className="resize-none font-normal"
                        />
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Hashtags
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {aiHashtags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => toggleHashtag(tag)}
                            className="px-3 py-1.5 rounded-full text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                          >
                            {tag}
                            <X className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                      <Input
                        placeholder="Type hashtag and press Enter..."
                        onKeyDown={addHashtag}
                        className="max-w-xs"
                      />
                    </div>
                  </div>

                  {/* Preview & Platform Selection - 2 columns */}
                  <div className="lg:col-span-2 space-y-5">
                    {/* Platform Selection */}
                    <div className="space-y-3">
                      <Label>Post to Platforms</Label>
                      <div className="space-y-2">
                        {connectedAccounts.length > 0 ? (
                          connectedAccounts.map((platform: any) => {
                            const platformInfo: Record<string, any> = {
                              FACEBOOK: { icon: Facebook, color: "#1877F2", label: "Facebook" },
                              INSTAGRAM: { icon: Instagram, color: "#E4405F", label: "Instagram" },
                              LINKEDIN: { icon: Linkedin, color: "#0A66C2", label: "LinkedIn" },
                            };
                            const info = platformInfo[platform.platform] || { icon: Share2, color: "#666", label: platform.platform };
                            const Icon = info.icon || Facebook;
                            const isSelected = platformIds.includes(platform.id);

                            return (
                              <button
                                key={platform.id}
                                onClick={() => togglePlatform(platform.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                                  }`}
                              >
                                <Icon
                                  className="w-5 h-5"
                                  style={{ color: isSelected ? info.color : undefined }}
                                />
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-sm">{info.label}</p>
                                  <p className="text-xs text-muted-foreground">{platform.accountName}</p>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground"
                                    }`}
                                >
                                  {isSelected && (
                                    <CheckCircle className="w-3 h-3 text-primary-foreground" />
                                  )}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-4 rounded-xl border border-dashed text-center">
                            <p className="text-sm text-muted-foreground">No accounts connected.</p>
                            <Button variant="link" size="sm" onClick={() => window.location.href = '/settings'}>
                              Connect in Settings
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image Preview */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </Label>
                      <div className="relative rounded-xl overflow-hidden border border-border">
                        <img
                          src={images[0]?.url}
                          alt="Preview"
                          className="w-full h-40 object-cover"
                        />
                        {images.length > 1 && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-foreground/80 text-background text-xs">
                            +{images.length - 1} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Submit */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-success-soft flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-success" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
                    Ready to Submit
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Review your post details and choose when to publish
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Post Summary */}
                  <Card variant="bordered" className="p-5">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      Post Summary
                    </h3>

                    <div className="space-y-4">
                      {/* Images */}
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {images.slice(0, 4).map((image, index) => (
                          <img
                            key={index}
                            src={image.url}
                            alt=""
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        ))}
                        {images.length > 4 && (
                          <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                            <span className="text-sm text-muted-foreground">+{images.length - 4}</span>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location</span>
                          <span className="font-medium text-foreground">{postcode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Job Type</span>
                          <span className="font-medium text-foreground">{jobType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platforms</span>
                          <div className="flex gap-1">
                            {platformIds.map(pid => {
                              const platform = connectedAccounts.find((a: any) => a.id === pid);
                              if (!platform) return null;
                              if (platform.platform === "FACEBOOK") return <Facebook key={pid} className="w-4 h-4 text-[#1877F2]" />;
                              if (platform.platform === "INSTAGRAM") return <Instagram key={pid} className="w-4 h-4 text-[#E4405F]" />;
                              if (platform.platform === "LINKEDIN") return <Linkedin key={pid} className="w-4 h-4 text-[#0A66C2]" />;
                              return <Share2 key={pid} className="w-4 h-4" />;
                            })}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hashtags</span>
                          <span className="font-medium text-foreground">{aiHashtags.length} tags</span>
                        </div>
                      </div>

                      {/* Caption Preview */}
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Caption Preview</p>
                        <p className="text-sm text-foreground line-clamp-3">{aiCaption}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Schedule Options */}
                  <Card variant="bordered" className="p-5">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Publishing Options
                    </h3>

                    <div className="space-y-3">
                      {[
                        {
                          value: "now",
                          label: "Post Now",
                          desc: "Publish your post immediately to all platforms",
                          icon: Zap,
                        },
                        {
                          value: "optimal",
                          label: "AI Optimal Time",
                          desc: "Let AI choose the best time for maximum engagement",
                          icon: Sparkles,
                        },
                        {
                          value: "custom",
                          label: "Schedule Custom Time",
                          desc: "Pick a specific date and time to publish",
                          icon: Clock,
                        },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setScheduleOption(option.value as typeof scheduleOption)}
                          className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${scheduleOption === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${scheduleOption === option.value ? "bg-primary text-primary-foreground" : "bg-secondary"
                              }`}
                          >
                            <option.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{option.label}</p>
                            <p className="text-sm text-muted-foreground">{option.desc}</p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${scheduleOption === option.value ? "border-primary bg-primary" : "border-muted-foreground"
                              }`}
                          >
                            {scheduleOption === option.value && (
                              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                            )}
                          </div>
                        </button>
                      ))}

                      {/* Custom Date/Time Picker */}
                      {scheduleOption === "custom" && (
                        <div className="grid grid-cols-2 gap-3 pt-3 animate-fade-in">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={customDate}
                              onChange={(e) => setCustomDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Time</Label>
                            <Input
                              type="time"
                              value={customTime}
                              onChange={(e) => setCustomTime(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0 || isGenerating || isSubmitting}
                className={`${currentStep === 0 ? "invisible" : ""} justify-center`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={nextStep}
                  disabled={isGenerating}
                  className="justify-center"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-success hover:bg-success/90 text-success-foreground justify-center min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {scheduleOption === 'now' ? 'Publishing...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      {scheduleOption === 'now' ? <Send className="w-4 h-4 mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                      {scheduleOption === 'now' ? 'Publish Now' : 'Schedule Post'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreatePost;
