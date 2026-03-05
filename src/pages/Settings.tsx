import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Bell,
  Link2,
  Shield,
  Sparkles,
  MapPin,
  Save,
  Facebook,
  Instagram,
  Linkedin,
  Check,
  Upload,
  Clock,
  MessageSquare,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const settingsSections = [
  { id: "business", label: "Business Profile", icon: Building2 },
  { id: "testimonials", label: "Testimonial Link", icon: MessageSquare },
  { id: "ai", label: "AI Preferences", icon: Sparkles },
  { id: "posting", label: "Posting Rules", icon: Clock },
  { id: "social", label: "Social Accounts", icon: Link2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

const Settings = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("business");
  const [aiTone, setAiTone] = useState("professional");
  const [aiHashtags, setAiHashtags] = useState<string[]>([]);
  const [aiCaptionLength, setAiCaptionLength] = useState("medium");
  const [aiIncludeEmojis, setAiIncludeEmojis] = useState(true);
  const [autoSchedule, setAutoSchedule] = useState(true);
  const testimonialLink = "https://yourapp.com/testimonial/johns-plumbing";

  // Fetch Current User
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => graphqlRequest(`
      query {
        me {
          id
          email
          aiTone
          aiHashtags
          aiCaptionLength
          aiIncludeEmojis
        }
      }
    `),
  });

  useEffect(() => {
    if (userData?.me) {
      setAiTone(userData.me.aiTone || "professional");
      setAiHashtags(userData.me.aiHashtags || []);
      setAiCaptionLength(userData.me.aiCaptionLength || "medium");
      setAiIncludeEmojis(userData.me.aiIncludeEmojis ?? true);
    }
  }, [userData]);

  useEffect(() => {
    const status = searchParams.get("social");
    const message = searchParams.get("message");

    if (status === "success") {
      toast({
        title: "Platform connected!",
        description: "Your social media account has been successfully linked.",
      });
      // Clean up URL
      setSearchParams({}, { replace: true });
      queryClient.invalidateQueries({ queryKey: ["socialAccounts"] });
    } else if (status === "error") {
      toast({
        title: "Connection failed",
        description: message || "Could not connect account.",
        variant: "destructive",
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, toast, setSearchParams, queryClient]);

  // Fetch Social Accounts
  const { data: socialData, isLoading: socialLoading } = useQuery({
    queryKey: ["socialAccounts"],
    queryFn: () => graphqlRequest(`
      query {
        socialAccounts {
          id
          platform
          accountName
          accountId
          isActive
        }
      }
    `),
  });

  const connectedAccounts = socialData?.socialAccounts || [];

  const handleConnect = async (platform: string) => {
    try {
      const query = `
        query GetAuthUrl($platform: String!) {
          socialAccountAuthUrl(platform: $platform)
        }
      `;
      const response = await graphqlRequest(query, { platform: platform.toUpperCase() });
      if (response.socialAccountAuthUrl) {
        window.location.href = response.socialAccountAuthUrl;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate authorization link.",
        variant: "destructive",
      });
    }
  };
  const disconnectMutation = useMutation({
    mutationFn: (variables: { id: string }) => graphqlRequest(`
      mutation DisconnectSocialAccount($id: String!) {
        disconnectSocialAccount(id: $id) {
          id
          isActive
        }
      }
    `, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialAccounts"] });
      toast({
        title: "Account disconnected",
        description: "The social media account has been unlinked.",
      });
    },
  });

  const copyTestimonialLink = () => {
    navigator.clipboard.writeText(testimonialLink);
    toast({
      title: "Link copied!",
      description: "The testimonial link has been copied to your clipboard.",
    });
  };

  const updateAiMutation = useMutation({
    mutationFn: (input: any) => graphqlRequest(`
      mutation UpdateAi($input: UpdateAiPreferencesInput!) {
        updateAiPreferences(input: $input) {
          id
          aiTone
          aiHashtags
          aiCaptionLength
          aiIncludeEmojis
        }
      }
    `, { input }),
    onSuccess: () => {
      toast({ title: "AI preferences saved!" });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving preferences",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSaveAi = () => {
    updateAiMutation.mutate({
      aiTone,
      aiHashtags,
      aiCaptionLength,
      aiIncludeEmojis
    });
  };

  const handleAddHashtag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = e.currentTarget.value.trim();
      const tag = val.startsWith("#") ? val : `#${val}`;
      if (tag && !aiHashtags.includes(tag)) {
        setAiHashtags([...aiHashtags, tag]);
        e.currentTarget.value = "";
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Settings
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage your business settings and preferences
            </p>
          </div>
          <Button
            variant="accent"
            className="w-full sm:w-auto justify-center"
            onClick={() => {
              if (activeSection === 'ai') handleSaveAi();
            }}
            disabled={updateAiMutation.isPending}
          >
            <Save className="w-4 h-4" />
            {updateAiMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Settings Navigation - Mobile horizontal scroll, Desktop vertical */}
          <div className="lg:col-span-3">
            <Card variant="elevated" className="p-2">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg text-left transition-colors whitespace-nowrap flex-shrink-0 lg:flex-shrink lg:w-full ${activeSection === section.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                  >
                    <section.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm">{section.label}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Business Profile */}
            {activeSection === "business" && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Business Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload */}
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-xl bg-primary-soft flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">JP</span>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 2MB</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        defaultValue="John's Plumbing"
                        className="input-premium w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Service Type
                      </label>
                      <select className="input-premium w-full">
                        <option>Plumbing</option>
                        <option>Electrical</option>
                        <option>HVAC</option>
                        <option>General Contractor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue="john@johnsplumbing.com"
                        className="input-premium w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        defaultValue="+44 20 7123 4567"
                        className="input-premium w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Service Areas (Postcodes)
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-secondary/30">
                      {["CR0", "BR1", "SE13", "SE10", "SE18", "SE7"].map((postcode) => (
                        <span
                          key={postcode}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {postcode}
                          <button className="ml-1 text-primary/60 hover:text-primary">×</button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Add postcode..."
                        className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      These areas are used for geo-targeted posts on platforms like Facebook and Google. We don't access individual user locations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Testimonial Link */}
            {activeSection === "testimonials" && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Customer Testimonial Link
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">
                    Share this link with customers after completing a job. When they submit a testimonial, it will automatically create a draft post for you to review.
                  </p>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-foreground">
                      Your Testimonial Link
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-secondary/50 rounded-lg border border-border">
                        <p className="text-sm text-foreground truncate font-mono">
                          {testimonialLink}
                        </p>
                      </div>
                      <Button variant="outline" onClick={copyTestimonialLink}>
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <h4 className="font-medium text-foreground mb-2">How it works</h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                        Text or email this link to your customer after completing work
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                        Customer fills out a simple form with their testimonial
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                        A draft post appears in your pending items, ready for you to add photos
                      </li>
                    </ol>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h4 className="font-medium text-foreground mb-3">Preview what customers see</h4>
                    <a
                      href="/testimonial"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View testimonial form
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Preferences */}
            {activeSection === "ai" && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Content Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Writing Tone
                    </label>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {[
                        { value: "professional", label: "Professional", desc: "Formal and business-like" },
                        { value: "friendly", label: "Friendly", desc: "Warm and approachable" },
                        { value: "casual", label: "Casual", desc: "Relaxed and conversational" },
                        { value: "enthusiastic", label: "Enthusiastic", desc: "High energy and exciting" },
                      ].map((tone) => (
                        <button
                          key={tone.value}
                          onClick={() => setAiTone(tone.value)}
                          className={`p-4 rounded-xl border text-left transition-all ${aiTone === tone.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{tone.label}</span>
                            {aiTone === tone.value && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{tone.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Default Hashtags
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-secondary/30">
                      {aiHashtags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {tag}
                          <button onClick={() => setAiHashtags(aiHashtags.filter(t => t !== tag))} className="ml-1 text-primary/60 hover:text-primary">×</button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Add hashtag... (Press Enter)"
                        className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-sm"
                        onKeyDown={handleAddHashtag}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Caption Length Preference
                    </label>
                    <select
                      className="input-premium w-full sm:w-64"
                      value={aiCaptionLength}
                      onChange={(e) => setAiCaptionLength(e.target.value)}
                    >
                      <option value="short">Short (50-100 words)</option>
                      <option value="medium">Medium (100-150 words)</option>
                      <option value="long">Long (150-200 words)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="font-medium text-foreground">Include Emojis</p>
                      <p className="text-sm text-muted-foreground">Add emojis to generated captions</p>
                    </div>
                    <button
                      onClick={() => setAiIncludeEmojis(!aiIncludeEmojis)}
                      className={`w-12 h-6 rounded-full relative transition-colors ${aiIncludeEmojis ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${aiIncludeEmojis ? "right-1" : "left-1"}`} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posting Rules */}
            {activeSection === "posting" && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Posting Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="font-medium text-foreground">AI Auto-Schedule</p>
                      <p className="text-sm text-muted-foreground">
                        Let AI choose optimal posting times
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoSchedule(!autoSchedule)}
                      className={`w-12 h-6 rounded-full relative transition-colors ${autoSchedule ? "bg-primary" : "bg-muted"
                        }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${autoSchedule ? "right-1" : "left-1"
                          }`}
                      />
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Posting Window Start
                      </label>
                      <select className="input-premium w-full">
                        <option>8:00 AM</option>
                        <option>9:00 AM</option>
                        <option>10:00 AM</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Posting Window End
                      </label>
                      <select className="input-premium w-full">
                        <option>8:00 PM</option>
                        <option>9:00 PM</option>
                        <option>10:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Maximum Posts Per Day
                    </label>
                    <select className="input-premium w-full sm:w-64">
                      <option>1 post per day</option>
                      <option>2 posts per day</option>
                      <option>3 posts per day</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="font-medium text-foreground">Weekend Posting</p>
                      <p className="text-sm text-muted-foreground">Enable posts on Saturday & Sunday</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-primary relative">
                      <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white transition-transform" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Social Accounts */}
            {activeSection === "social" && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" />
                    Connected Social Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {socialLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : connectedAccounts.length > 0 ? (
                    connectedAccounts.map((account: any) => (
                      <div
                        key={account.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30"
                      >
                        {account.platform === "FACEBOOK" && (
                          <Facebook className="w-8 h-8 text-[#1877F2]" />
                        )}
                        {account.platform === "INSTAGRAM" && (
                          <Instagram className="w-8 h-8 text-[#E4405F]" />
                        )}
                        {account.platform === "LINKEDIN" && (
                          <Linkedin className="w-8 h-8 text-[#0A66C2]" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground">{account.platform}</p>
                            <span className="flex items-center gap-1 text-xs text-success bg-success-soft px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" /> Connected
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {account.accountName}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => disconnectMutation.mutate({ id: account.id })}
                          disabled={disconnectMutation.isPending}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 border border-dashed border-border rounded-xl">
                      <p className="text-muted-foreground mb-4">No social accounts connected yet.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                    {!connectedAccounts.some((a: any) => a.platform === "FACEBOOK") && (
                      <Button variant="outline" className="gap-2" onClick={() => handleConnect("Facebook")}>
                        <Facebook className="w-4 h-4 text-[#1877F2]" /> Connect Facebook
                      </Button>
                    )}
                    {!connectedAccounts.some((a: any) => a.platform === "INSTAGRAM") && (
                      <Button variant="outline" className="gap-2" onClick={() => handleConnect("Instagram")}>
                        <Instagram className="w-4 h-4 text-[#E4405F]" /> Connect Instagram
                      </Button>
                    )}
                    {!connectedAccounts.some((a: any) => a.platform === "LINKEDIN") && (
                      <Button variant="outline" className="gap-2" onClick={() => handleConnect("LinkedIn")}>
                        <Linkedin className="w-4 h-4 text-[#0A66C2]" /> Connect LinkedIn
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "New testimonials", desc: "When customers submit feedback", enabled: true },
                    { label: "Post published", desc: "When scheduled posts go live", enabled: true },
                    { label: "Weekly performance report", desc: "Summary of your social media performance", enabled: true },
                    { label: "Engagement alerts", desc: "When posts receive high engagement", enabled: false },
                  ].map((notification, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
                    >
                      <div>
                        <p className="font-medium text-foreground">{notification.label}</p>
                        <p className="text-sm text-muted-foreground">{notification.desc}</p>
                      </div>
                      <button
                        className={`w-12 h-6 rounded-full relative transition-colors ${notification.enabled ? "bg-primary" : "bg-muted"
                          }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notification.enabled ? "right-1" : "left-1"
                            }`}
                        />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Security */}
            {activeSection === "security" && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Current Password
                    </label>
                    <input type="password" className="input-premium w-full sm:w-96" placeholder="••••••••" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        New Password
                      </label>
                      <input type="password" className="input-premium w-full" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Confirm Password
                      </label>
                      <input type="password" className="input-premium w-full" placeholder="••••••••" />
                    </div>
                  </div>
                  <Button variant="outline">Update Password</Button>

                  <div className="border-t border-border pt-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                      <div>
                        <p className="font-medium text-foreground">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
