import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Zap,
  Eye,
  ThumbsUp,
  TrendingUp,
  MoreHorizontal,
  Edit3,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/dialog";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const currentWeek = [
  { day: "Mon", date: 16, isToday: true },
  { day: "Tue", date: 17, isToday: false },
  { day: "Wed", date: 18, isToday: false },
  { day: "Thu", date: 19, isToday: false },
  { day: "Fri", date: 20, isToday: false },
  { day: "Sat", date: 21, isToday: false },
  { day: "Sun", date: 22, isToday: false },
];

const timeSlots = ["9 AM", "12 PM", "3 PM", "6 PM", "9 PM"];

const scheduledPosts = [
  {
    id: 1,
    title: "Bathroom remodel showcase",
    platform: "facebook",
    day: 0,
    time: "2 PM",
    slot: 1,
    aiOptimal: true,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop",
  },
  {
    id: 2,
    title: "Before & after: Kitchen sink",
    platform: "instagram",
    day: 0,
    time: "6 PM",
    slot: 3,
    aiOptimal: true,
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100&h=100&fit=crop",
  },
  {
    id: 3,
    title: "Team spotlight: Meet Dave",
    platform: "linkedin",
    day: 1,
    time: "9 AM",
    slot: 0,
    aiOptimal: false,
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=100&h=100&fit=crop",
  },
  {
    id: 4,
    title: "Emergency service promo",
    platform: "facebook",
    day: 2,
    time: "12 PM",
    slot: 1,
    aiOptimal: true,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop",
  },
  {
    id: 5,
    title: "Customer testimonial",
    platform: "instagram",
    day: 4,
    time: "6 PM",
    slot: 3,
    aiOptimal: true,
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100&h=100&fit=crop",
  },
];

const upcomingPosts = [
  { platform: "facebook", time: "Today, 2:00 PM", title: "Bathroom remodel showcase", status: "scheduled" },
  { platform: "instagram", time: "Today, 6:00 PM", title: "Before & after: Kitchen sink", status: "scheduled" },
  { platform: "linkedin", time: "Tomorrow, 9:00 AM", title: "Team spotlight: Meet Dave", status: "pending" },
  { platform: "facebook", time: "Wed, 12:00 PM", title: "Emergency service promo", status: "scheduled" },
  { platform: "instagram", time: "Fri, 6:00 PM", title: "Customer testimonial", status: "draft" },
];

const aiSuggestions = [
  { day: "Tuesday", time: "6-8 PM", reason: "Peak engagement window", boost: "+45%" },
  { day: "Friday", time: "3-5 PM", reason: "End of week activity", boost: "+32%" },
  { day: "Saturday", time: "10 AM", reason: "Weekend browsers", boost: "+28%" },
];

const PlatformIcon = ({ platform, size = "sm" }: { platform: string; size?: "sm" | "lg" }) => {
  const sizeClass = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  switch (platform) {
    case "facebook":
      return <Facebook className={`${sizeClass} text-[#1877F2]`} />;
    case "instagram":
      return <Instagram className={`${sizeClass} text-[#E4405F]`} />;
    case "linkedin":
      return <Linkedin className={`${sizeClass} text-[#0A66C2]`} />;
    default:
      return null;
  }
};

const Schedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const { data, isLoading } = useQuery({
    queryKey: ["businessPosts", user?.businessId],
    queryFn: () => graphqlRequest(`
      query GetPosts($businessId: ID!) {
        businessPosts(businessId: $businessId) {
          id
          content
          mediaUrls
          status
          scheduledAt
          platforms
          reach
          likes
          engagement
        }
      }
    `, { businessId: user?.businessId }),
    enabled: !!user?.businessId,
  });

  const posts = data?.businessPosts || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => graphqlRequest(`
      mutation DeletePost($id: ID!) {
        deletePost(id: $id) {
          id
        }
      }
    `, { id }),
    onSuccess: () => {
      toast({ title: "Post deleted successfully" });
      setSelectedPost(null);
      setIsDeleting(false);
      queryClient.invalidateQueries({ queryKey: ["businessPosts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleEdit = (post: any) => {
    navigate(`/create-post?edit=${post.id}`);
  };

  const handleDelete = () => {
    if (selectedPost) {
      deleteMutation.mutate(selectedPost.id);
    }
  };

  // Dynamic upcoming posts (next 5 posts starting from today)
  const upcomingPosts = posts
    .filter((p: any) => (p.status === 'SCHEDULED' || p.status === 'PENDING_APPROVAL') && p.scheduledAt && new Date(p.scheduledAt) >= new Date())
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5)
    .map((p: any) => ({
      platform: p.platforms?.[0]?.toLowerCase() || 'facebook',
      time: format(new Date(p.scheduledAt), "MMM d, h:mm a"),
      title: p.content.split('\n')[0] || 'Untitled Post',
      status: p.status === 'SCHEDULED' ? 'scheduled' : 'pending'
    }));

  // Dynamic status counts for this week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const thisWeekPosts = posts.filter((p: any) =>
    p.scheduledAt &&
    new Date(p.scheduledAt) >= weekStart &&
    new Date(p.scheduledAt) <= weekEnd
  );

  const platformStats = {
    facebook: thisWeekPosts.filter((p: any) => p.platforms?.includes('FACEBOOK')).length,
    instagram: thisWeekPosts.filter((p: any) => p.platforms?.includes('INSTAGRAM')).length,
    linkedin: thisWeekPosts.filter((p: any) => p.platforms?.includes('LINKEDIN')).length,
  };

  const scheduledPostsVisible = posts.filter((p: any) => p.status === 'SCHEDULED' || p.status === 'PUBLISHED' || p.status === 'PENDING_APPROVAL');

  if (isLoading) return <DashboardLayout userRole="admin"><div className="p-8 text-center text-muted-foreground animate-pulse">Loading schedule...</div></DashboardLayout>;

  return (
    <DashboardLayout userRole="admin">
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Content Schedule
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Plan and manage your social media publishing calendar
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button variant="outline" className="justify-center">
              <Calendar className="w-4 h-4" />
              Month View
            </Button>
            <Link to="/create-post" className="flex-1 sm:flex-none">
              <Button variant="accent" className="w-full justify-center">
                <Plus className="w-4 h-4" />
                Schedule Post
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-8 space-y-4">
            {/* Week Navigation */}
            <Card variant="elevated" className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <Button variant="ghost" size="icon-sm" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="font-display text-sm sm:text-base font-semibold text-foreground">
                  {format(weekDates[0], "MMM d")} - {format(weekDates[6], "MMM d, yyyy")}
                </h2>
                <Button variant="ghost" size="icon-sm" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {weekDates.map((date, index) => (
                  <button
                    key={date.toString()}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center p-1.5 sm:p-3 rounded-lg sm:rounded-xl transition-all ${isSameDay(selectedDate, date)
                      ? "bg-primary text-primary-foreground"
                      : isSameDay(new Date(), date)
                        ? "bg-accent/10 text-accent"
                        : "hover:bg-secondary"
                      }`}
                  >
                    <span className="text-[10px] sm:text-xs mb-0.5 sm:mb-1">{format(date, "EEE")}</span>
                    <span className="font-display font-semibold text-sm sm:text-lg">{format(date, "d")}</span>
                    {scheduledPostsVisible.some((p: any) => p.scheduledAt && isSameDay(new Date(p.scheduledAt), date)) && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Timeline View */}
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  {format(selectedDate, "EEEE, MMMM d")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduledPostsVisible
                    .filter((post: any) => post.scheduledAt && isSameDay(new Date(post.scheduledAt), selectedDate))
                    .sort((a: any, b: any) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
                    .map((post: any) => (
                      <div
                        key={post.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-all group"
                      >
                        <div className="w-16 text-center text-xs text-muted-foreground font-medium">
                          {format(new Date(post.scheduledAt!), "h:mm a")}
                        </div>
                        {post.mediaUrls?.[0] ? (
                          <img src={post.mediaUrls[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                            <Plus className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{post.content.split('\n')[0]}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${post.status === 'PUBLISHED' ? 'bg-success-soft text-success' : post.status === 'PENDING_APPROVAL' ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary'
                              }`}>
                              {post.status.replace(/_/g, ' ').toLowerCase()}
                            </span>
                            <div className="flex gap-1 ml-2">
                              {post.platforms?.map((p: string) => (
                                <PlatformIcon key={p} platform={p.toLowerCase()} />
                              ))}
                            </div>
                            {post.status === 'PUBLISHED' && (
                              <div className="flex items-center gap-3 ml-auto text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3 text-muted-foreground/70" />
                                  {post.reach?.toLocaleString() || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3 text-muted-foreground/70" />
                                  {post.likes?.toLocaleString() || 0}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setSelectedPost(post)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                  {scheduledPostsVisible.filter((post: any) => post.scheduledAt && isSameDay(new Date(post.scheduledAt), selectedDate)).length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                      <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                      <p className="text-sm text-muted-foreground">No posts scheduled for this day.</p>
                      <Link to="/create-post" className="mt-4 inline-block">
                        <Button variant="outline" size="sm">Create New Post</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Upcoming Posts */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  Upcoming Posts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingPosts.length > 0 ? upcomingPosts.map((post: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors"
                  >
                    <PlatformIcon platform={post.platform} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                      <p className="text-xs text-muted-foreground">{post.time}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${post.status === "scheduled"
                        ? "bg-success-soft text-success"
                        : post.status === "pending"
                          ? "bg-warning-soft text-warning"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {post.status}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4 italic">No upcoming posts found.</p>
                )}
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card variant="elevated" className="bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-primary" />
                  AI Posting Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Best times to post based on your audience engagement patterns
                </p>
                {aiSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{suggestion.day}</p>
                      <p className="text-xs text-muted-foreground">{suggestion.time}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-success">{suggestion.boost}</span>
                      <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Platform Distribution */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg">This Week by Platform</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-[#1877F2]" />
                    <span className="text-sm text-foreground">Facebook</span>
                  </div>
                  <span className="font-medium text-foreground">{platformStats.facebook} posts</span>
                </div>
                <div className="flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-[#E4405F]" />
                    <span className="text-sm text-foreground">Instagram</span>
                  </div>
                  <span className="font-medium text-foreground">{platformStats.instagram} posts</span>
                </div>
                <div className="flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                    <span className="text-sm text-foreground">LinkedIn</span>
                  </div>
                  <span className="font-medium text-foreground">{platformStats.linkedin} posts</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* View Post Modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent shadow-none">
          {selectedPost && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Left: Mobile Preview */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-[300px] h-[600px] bg-[#1A1A1A] rounded-[3rem] p-3 border-[6px] border-[#333] shadow-2xl relative overflow-hidden flex flex-col">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#333] rounded-b-2xl z-20" />

                  {/* Phone Screen Content */}
                  <div className="flex-1 bg-background rounded-[2.2rem] overflow-hidden flex flex-col border border-[#444]">
                    {/* Header */}
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-display text-[10px] font-bold text-primary">
                          {user?.businessName?.[0] || 'V'}
                        </div>
                        <span className="text-[12px] font-semibold">{user?.businessName || 'Your Business'}</span>
                      </div>
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </div>

                    {/* Image */}
                    <div className="aspect-square bg-secondary/50 relative">
                      {selectedPost.mediaUrls?.[0] ? (
                        <img src={selectedPost.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                          <Plus className="w-12 h-12" />
                        </div>
                      )}
                    </div>

                    {/* Interactions */}
                    <div className="p-3 flex items-center gap-3">
                      <Zap className="w-5 h-5 text-primary" />
                      <div className="w-5 h-5 rounded-full border border-muted-foreground/30" />
                      <div className="w-4 h-4 border border-muted-foreground/30 rotate-45 ml-auto" />
                    </div>

                    {/* Caption */}
                    <div className="px-3 pb-6 flex-1 overflow-y-auto no-scrollbar">
                      <p className="text-[12px] leading-relaxed">
                        <span className="font-bold mr-1">{user?.businessName || 'Business'}</span>
                        {selectedPost.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Details & Actions */}
              <div className="lg:col-span-7 bg-background rounded-3xl border border-border shadow-xl overflow-hidden self-center">
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-2xl font-bold text-foreground">Post Details</h3>
                      <p className="text-sm text-muted-foreground">Manage and review your content</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)} className="rounded-full">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${selectedPost.status === 'PUBLISHED' ? 'bg-success-soft text-success' :
                        selectedPost.status === 'PENDING_APPROVAL' ? 'bg-warning-soft text-warning' :
                          'bg-primary-soft text-primary'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedPost.status === 'PUBLISHED' ? 'bg-success' :
                          selectedPost.status === 'PENDING_APPROVAL' ? 'bg-warning' :
                            'bg-primary'
                          }`} />
                        {selectedPost.status.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Platforms</p>
                      <div className="flex gap-2">
                        {selectedPost.platforms?.map((p: string) => (
                          <div key={p} className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center">
                            <PlatformIcon platform={p.toLowerCase()} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-background border border-border">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Publish Date</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(selectedPost.scheduledAt), "EEEE, MMMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-background border border-border">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Scheduled Time</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(selectedPost.scheduledAt), "h:mm a")} (AI Optimal)</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                    {selectedPost.status === 'PENDING_APPROVAL' ? (
                      <Link to="/approvals" className="flex-1">
                        <Button variant="accent" className="w-full rounded-xl py-6">Review for Approval</Button>
                      </Link>
                    ) : (
                      <Button variant="accent" className="flex-1 rounded-xl py-6" onClick={() => handleEdit(selectedPost)}>
                        <Edit3 className="w-4 h-4" />
                        Edit Post
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setSelectedPost(null)} className="flex-1 rounded-xl py-6">Close Details</Button>
                    <Button
                      variant="ghost"
                      className="rounded-xl py-6 text-destructive hover:bg-destructive/5"
                      onClick={() => setIsDeleting(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">Are you sure you want to delete this post? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDeleting(false)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete Post"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Schedule;
