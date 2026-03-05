import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  MapPin,
  Calendar,
  Download,
  ChevronDown,
  Facebook,
  Instagram,
  Linkedin,
  ArrowUpRight,
  Users,
  FileText,
  Clock,
  CheckCircle,
  RefreshCw,
  Zap,
} from "lucide-react";


// overviewStats will be dynamic now


// weeklyData, locationData, platformStats will be dynamic now


// topPosts will be dynamic now


// platformStats will be dynamic now


import { useState } from "react";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case "facebook":
      return <Facebook className="w-5 h-5 text-[#1877F2]" />;
    case "instagram":
      return <Instagram className="w-5 h-5 text-[#E4405F]" />;
    case "linkedin":
      return <Linkedin className="w-5 h-5 text-[#0A66C2]" />;
    default:
      return null;
  }
};

const Analytics = () => {
  const { user } = useAuth();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["businessAnalytics", user?.businessId],
    queryFn: () => graphqlRequest(`
      query GetAnalytics($businessId: ID!) {
        businessAnalytics(businessId: $businessId) {
          totalReach
          impressions
          likes
          engagement
          comments
          shares
          publishedPosts
          totalPosts
          scheduledPosts
          pendingPosts
        }
      }
    `, { businessId: user?.businessId }),
    enabled: !!user?.businessId,
  });

  const { data: postsData } = useQuery({
    queryKey: ["businessPosts", user?.businessId],
    queryFn: () => graphqlRequest(`
      query GetPosts($businessId: ID!) {
        businessPosts(businessId: $businessId) {
          id
          content
          mediaUrls
          reach
          impressions
          engagement
          likes
          comments
          shares
          platforms
          targetingRegions
          createdAt
        }
      }
    `, { businessId: user?.businessId }),
    enabled: !!user?.businessId,
  });

  const syncMutation = useMutation({
    mutationFn: (bid: string) => graphqlRequest(`
      mutation SyncAnalytics($businessId: ID!) {
        syncBusinessAnalytics(businessId: $businessId) {
          totalReach
        }
      }
    `, { businessId: bid }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessAnalytics"] });
      queryClient.invalidateQueries({ queryKey: ["businessPosts"] });
      toast({ title: "Analytics Synced!" });
    },
  });

  const seedMutation = useMutation({
    mutationFn: (bid: string) => graphqlRequest(`
      mutation SeedDemo($businessId: ID!) {
        seedDemoData(businessId: $businessId) {
          totalReach
        }
      }
    `, { businessId: bid }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessAnalytics"] });
      queryClient.invalidateQueries({ queryKey: ["businessPosts"] });
      toast({ title: "Demo Data Seeded!" });
    },
  });

  const stats = data?.businessAnalytics;
  const posts = postsData?.businessPosts || [];

  // --- Time Helpers ---
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const thisWeekPosts = posts.filter((p: any) => new Date(p.createdAt) >= startOfThisWeek);
  const lastWeekPosts = posts.filter((p: any) => {
    const d = new Date(p.createdAt);
    return d >= startOfLastWeek && d < startOfThisWeek;
  });

  // --- Derived Weekly Chart Data (per day-of-week, this vs last week) ---
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyData = days.map((day, dayIndex) => {
    const dayPostsThis = thisWeekPosts.filter((p: any) => new Date(p.createdAt).getDay() === dayIndex);
    const dayPostsLast = lastWeekPosts.filter((p: any) => new Date(p.createdAt).getDay() === dayIndex);
    return {
      day,
      reach: dayPostsThis.reduce((acc: number, p: any) => acc + (p.reach || 0), 0),
      engagement: dayPostsThis.reduce((acc: number, p: any) => acc + (p.likes || 0), 0),
      previous: dayPostsLast.reduce((acc: number, p: any) => acc + (p.reach || 0), 0),
    };
  });

  // --- Derived Location Data with Week-over-Week Growth ---
  const locationMapThis: Record<string, number> = {};
  const locationMapLast: Record<string, number> = {};
  const locationMapFull: Record<string, any> = {};

  posts.forEach((p: any) => {
    const isThis = new Date(p.createdAt) >= startOfThisWeek;
    const isLast = new Date(p.createdAt) >= startOfLastWeek && new Date(p.createdAt) < startOfThisWeek;
    p.targetingRegions?.forEach((area: string) => {
      if (!locationMapFull[area]) locationMapFull[area] = { area, reach: 0, engagement: 0, posts: 0 };
      locationMapFull[area].reach += p.reach || 0;
      locationMapFull[area].engagement += (p.likes || 0) + (p.comments || 0);
      locationMapFull[area].posts += 1;
      if (isThis) locationMapThis[area] = (locationMapThis[area] || 0) + (p.reach || 0);
      if (isLast) locationMapLast[area] = (locationMapLast[area] || 0) + (p.reach || 0);
    });
  });

  const locationData = Object.values(locationMapFull)
    .sort((a: any, b: any) => b.reach - a.reach)
    .map((l: any) => {
      const thisW = locationMapThis[l.area] || 0;
      const lastW = locationMapLast[l.area] || 0;
      const growthNum = lastW > 0 ? Math.round(((thisW - lastW) / lastW) * 100) : (thisW > 0 ? 100 : 0);
      const growth = growthNum >= 0 ? `+${growthNum}%` : `${growthNum}%`;
      return {
        ...l,
        reach: l.reach > 1000 ? `${(l.reach / 1000).toFixed(1)}K` : String(l.reach),
        engagement: l.engagement > 1000 ? `${(l.engagement / 1000).toFixed(1)}K` : String(l.engagement),
        growth,
        growthPositive: growthNum >= 0,
      };
    });

  // --- Derived Platform Stats (real data from posts) ---
  const platformConfig: Record<string, { color: string }> = {
    Facebook: { color: "#1877F2" },
    Instagram: { color: "#E4405F" },
    LinkedIn: { color: "#0A66C2" },
  };
  const platformMap: Record<string, any> = {};
  posts.forEach((p: any) => {
    p.platforms?.forEach((plat: string) => {
      const key = plat.charAt(0).toUpperCase() + plat.slice(1).toLowerCase();
      if (!platformMap[key]) {
        platformMap[key] = { platform: key, posts: 0, reach: 0, likes: 0, comments: 0, shares: 0, color: platformConfig[key]?.color || "#6b7280" };
      }
      platformMap[key].posts += 1;
      platformMap[key].reach += p.reach || 0;
      platformMap[key].likes += p.likes || 0;
      platformMap[key].comments += p.comments || 0;
      platformMap[key].shares += p.shares || 0;
    });
  });

  // Week-over-week growth per platform
  const thisWeekReachByPlatform: Record<string, number> = {};
  const lastWeekReachByPlatform: Record<string, number> = {};
  thisWeekPosts.forEach((p: any) => p.platforms?.forEach((plat: string) => {
    const key = plat.charAt(0).toUpperCase() + plat.slice(1).toLowerCase();
    thisWeekReachByPlatform[key] = (thisWeekReachByPlatform[key] || 0) + (p.reach || 0);
  }));
  lastWeekPosts.forEach((p: any) => p.platforms?.forEach((plat: string) => {
    const key = plat.charAt(0).toUpperCase() + plat.slice(1).toLowerCase();
    lastWeekReachByPlatform[key] = (lastWeekReachByPlatform[key] || 0) + (p.reach || 0);
  }));

  const platformStats = Object.values(platformMap).map((p: any) => {
    const thisW = thisWeekReachByPlatform[p.platform] || 0;
    const lastW = lastWeekReachByPlatform[p.platform] || 0;
    const growthNum = lastW > 0 ? Math.round(((thisW - lastW) / lastW) * 100) : (thisW > 0 ? 100 : 0);
    const growth = growthNum >= 0 ? `+${growthNum}%` : `${growthNum}%`;
    return {
      ...p,
      growthPositive: growthNum >= 0,
      growth,
      reach: p.reach > 1000 ? `${(p.reach / 1000).toFixed(1)}K` : String(p.reach),
    };
  });

  const topPosts = [...posts]
    .sort((a: any, b: any) => (b.reach || 0) - (a.reach || 0))
    .slice(0, 5);

  const maxReach = Math.max(...weeklyData.map((d) => d.reach), ...weeklyData.map((d) => d.previous), 1000);


  if (isLoading) return <DashboardLayout userRole="admin"><div className="p-8 text-center text-muted-foreground animate-pulse">Loading analytics...</div></DashboardLayout>;

  return (
    <DashboardLayout userRole="admin">
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Analytics
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Track your social media performance and engagement
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button variant="outline" className="justify-center">
              <Calendar className="w-4 h-4 mr-2" />
              Last 30 Days
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              className="justify-center border-dashed"
              onClick={() => user?.businessId && seedMutation.mutate(user.businessId)}
              disabled={seedMutation.isPending}
            >
              <Zap className={`w-4 h-4 mr-2 ${seedMutation.isPending ? "animate-pulse" : ""}`} />
              Seed Demo
            </Button>
            <Button
              variant="default"
              className="justify-center bg-primary"
              onClick={() => user?.businessId && syncMutation.mutate(user.businessId)}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "Syncing..." : "Sync Data"}
            </Button>
            <Button variant="outline" className="justify-center hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        {(() => {
          // Week-over-week reach/impressions/interactions changes
          const thisWReach = thisWeekPosts.reduce((a: number, p: any) => a + (p.reach || 0), 0);
          const lastWReach = lastWeekPosts.reduce((a: number, p: any) => a + (p.reach || 0), 0);
          const reachChange = lastWReach > 0 ? Math.round(((thisWReach - lastWReach) / lastWReach) * 100) : (thisWReach > 0 ? 100 : 0);

          const thisWImp = thisWeekPosts.reduce((a: number, p: any) => a + (p.impressions || 0), 0);
          const lastWImp = lastWeekPosts.reduce((a: number, p: any) => a + (p.impressions || 0), 0);
          const impChange = lastWImp > 0 ? Math.round(((thisWImp - lastWImp) / lastWImp) * 100) : (thisWImp > 0 ? 100 : 0);

          const thisWInteract = thisWeekPosts.reduce((a: number, p: any) => a + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0);
          const lastWInteract = lastWeekPosts.reduce((a: number, p: any) => a + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0);
          const interactChange = lastWInteract > 0 ? Math.round(((thisWInteract - lastWInteract) / lastWInteract) * 100) : (thisWInteract > 0 ? 100 : 0);

          const thisWEng = thisWeekPosts.reduce((a: number, p: any) => a + (p.engagement || 0), 0);
          const lastWEng = lastWeekPosts.reduce((a: number, p: any) => a + (p.engagement || 0), 0);
          const engChange = lastWEng > 0 ? Math.round(((thisWEng - lastWEng) / lastWEng) * 100) : (thisWEng > 0 ? 100 : 0);

          const overviewStats = [
            { label: "Total Reach", value: stats?.totalReach?.toLocaleString() ?? "0", change: reachChange, icon: Eye },
            { label: "Impressions", value: stats?.impressions?.toLocaleString() ?? "0", change: impChange, icon: ThumbsUp },
            { label: "Avg Engagement", value: `${stats?.engagement ?? 0}%`, change: engChange, icon: TrendingUp },
            { label: "Interactions", value: ((stats?.likes || 0) + (stats?.comments || 0) + (stats?.shares || 0)).toLocaleString(), change: interactChange, icon: Users },
          ];
          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              {overviewStats.map((stat) => (
                <Card key={stat.label} variant="elevated" className="p-3 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2 sm:gap-0 mb-2 sm:mb-4">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-primary-soft flex items-center justify-center">
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <span className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${stat.change >= 0 ? "text-success" : "text-destructive"}`}>
                      {stat.change >= 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                      {stat.change >= 0 ? "+" : ""}{stat.change}%
                    </span>
                  </div>
                  <p className="font-display text-xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
                </Card>
              ))}
            </div>
          );
        })()}

        {/* Post Status Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: "Total Posts", value: stats?.totalPosts ?? 0, icon: FileText, color: "text-primary", bg: "bg-primary-soft" },
            { label: "Published", value: stats?.publishedPosts ?? 0, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
            { label: "Scheduled", value: stats?.scheduledPosts ?? 0, icon: Clock, color: "text-accent", bg: "bg-accent-soft" },
            { label: "Pending Approval", value: stats?.pendingPosts ?? 0, icon: MessageCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((s) => (
            <Card key={s.label} variant="elevated" className="p-3 sm:p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="font-bold text-lg text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Reach Chart */}
          <Card variant="elevated" className="lg:col-span-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Reach & Engagement Trends</CardTitle>
                <p className="text-sm text-muted-foreground">Weekly performance comparison</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  This Week
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                  Last Week
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-4 h-64">
                {weeklyData.map((day, index) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex gap-1 h-48 items-end">
                      {/* Previous week bar */}
                      <div
                        className="flex-1 bg-muted-foreground/20 rounded-t-lg transition-all"
                        style={{ height: `${(day.previous / maxReach) * 100}%` }}
                      />
                      {/* Current week bar */}
                      <div
                        className="flex-1 bg-primary rounded-t-lg transition-all group relative cursor-pointer hover:bg-primary-hover"
                        style={{ height: `${(day.reach / maxReach) * 100}%` }}
                      >
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {(day.reach / 1000).toFixed(1)}K
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{day.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Breakdown */}
          <Card variant="elevated" className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-lg">Platform Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {platformStats.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">
                  No platform data yet. Connect social accounts and sync.
                </div>
              ) : platformStats.map((platform) => (
                <div key={platform.platform} className="p-4 rounded-xl bg-secondary/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={platform.platform} />
                      <span className="font-medium text-foreground">{platform.platform}</span>
                    </div>
                    <span className={`text-sm font-medium ${platform.growthPositive ? "text-success" : "text-destructive"}`}>
                      {platform.growth}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{platform.posts}</p>
                      <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{platform.reach}</p>
                      <p className="text-xs text-muted-foreground">Reach</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{platform.likes}</p>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Location Performance */}
          <Card variant="elevated" className="lg:col-span-7">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Location Performance</CardTitle>
                  <p className="text-sm text-muted-foreground">Engagement by service area</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Area</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Reach</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Engagement</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Posts</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationData.map((location, index) => (
                      <tr key={location.area} className="border-b border-border last:border-0 hover:bg-secondary/30">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${index === 0
                                ? "bg-primary"
                                : index === 1
                                  ? "bg-accent"
                                  : index === 2
                                    ? "bg-success"
                                    : "bg-muted-foreground"
                                }`}
                            />
                            <span className="font-medium text-foreground">{location.area}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2 text-foreground">{location.reach}</td>
                        <td className="text-right py-3 px-2 text-foreground">{location.engagement}</td>
                        <td className="text-right py-3 px-2 text-foreground">{location.posts}</td>
                        <td className="text-right py-3 px-2">
                          <span
                            className={`text-sm font-medium ${location.growthPositive ? "text-success" : "text-destructive"}`}
                          >
                            {location.growth}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Posts */}
          <Card variant="elevated" className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-success" />
                Top Performing Posts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topPosts.length > 0 ? topPosts.map((post: any, index: number) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors cursor-pointer group"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <img src={post.mediaUrls?.[0] || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop"} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.platforms?.map((p: string) => <PlatformIcon key={p} platform={p} />)}
                      <p className="text-sm font-medium text-foreground truncate">{post.content.split('\n')[0]}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.reach?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {post.likes?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {post.engagement || 0}%
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )) : (
                <div className="p-8 text-center text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">
                  No published posts yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
