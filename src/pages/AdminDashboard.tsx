import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  ArrowRight,
  ImagePlus,
  Eye,
  ThumbsUp,
  AlertCircle,
  MapPin,
  Zap,
  FileCheck,
  Megaphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphqlClient";

const locationStats = [
  { area: "Croydon", posts: 12, reach: "8.2K", growth: "+24%", color: "bg-primary" },
  { area: "Bromley", posts: 8, reach: "5.1K", growth: "-12%", color: "bg-accent" },
  { area: "Lewisham", posts: 6, reach: "4.8K", growth: "+18%", color: "bg-success" },
  { area: "Greenwich", posts: 4, reach: "3.2K", growth: "+8%", color: "bg-warning" },
];

const AdminDashboard = () => {
  const { user } = useAuth();

  const { data: pendingData } = useQuery({
    queryKey: ["pendingPosts", user?.businessId],
    queryFn: () => graphqlRequest(`
      query GetPendingPosts($businessId: ID!) {
        pendingPosts(businessId: $businessId) {
          id
        }
      }
    `, { businessId: user?.businessId }),
    enabled: !!user?.businessId && !user?.isSystemAdmin,
  });

  const { data: postsData } = useQuery({
    queryKey: ["businessPosts", user?.businessId],
    queryFn: () => graphqlRequest(`
      query GetBusinessPosts($businessId: ID!) {
        businessPosts(businessId: $businessId) {
          id
          status
        }
      }
    `, { businessId: user?.businessId }),
    enabled: !!user?.businessId && !user?.isSystemAdmin,
  });

  const pendingCount = pendingData?.pendingPosts?.length || 0;
  const posts = postsData?.businessPosts || [];
  const scheduledCount = posts.filter((p: any) => p.status === "SCHEDULED").length;
  const publishedCount = posts.filter((p: any) => p.status === "PUBLISHED").length;

  const quickStats = [
    { label: "This Week", value: String(publishedCount), sublabel: "Posts Published", icon: CheckCircle, trend: "" },
    { label: "Total Reach", value: "24.5K", sublabel: "Impressions", icon: Eye, trend: "+28%" },
    { label: "Engagement", value: "4.2%", sublabel: "Avg Rate", icon: ThumbsUp, trend: "+0.8%" },
    { label: "Scheduled", value: String(scheduledCount), sublabel: "Upcoming", icon: Clock, trend: "" },
  ];
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-primary">Good afternoon</p>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Welcome back
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md">
            Your social media is performing well. Here's what's happening.
          </p>
        </div>

        {/* Primary Action Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/create-post" className="block">
            <Card
              variant="elevated"
              className="h-full hover:border-primary/50 transition-all cursor-pointer group border-l-4 border-l-primary"
            >
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImagePlus className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
                  Create Post
                </h2>
                <p className="text-muted-foreground">
                  Upload photos and create new content
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/create-ad" className="block">
            <Card
              variant="elevated"
              className="h-full hover:border-accent/50 transition-all cursor-pointer group border-l-4 border-l-accent"
            >
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Megaphone className="w-8 h-8 text-accent-foreground" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
                  Create Ad
                </h2>
                <p className="text-muted-foreground">
                  Launch Facebook & Instagram ads
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Link to="/approvals" className="block">
            <Card
              variant="elevated"
              className="hover:border-accent/50 transition-all cursor-pointer group border-l-4 border-l-accent"
            >
              <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileCheck className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Pending Approval</h3>
                    <p className="text-muted-foreground text-sm">
                      {pendingCount === 0 ? "No posts" : `${pendingCount} post${pendingCount === 1 ? "" : "s"}`} ready for review
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Attention Required - Now a button/link */}
        <Link to="/attention" className="block">
          <Card
            variant="elevated"
            className="hover:border-warning/50 transition-all cursor-pointer group"
          >
            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Attention Required</h3>
                  <p className="text-muted-foreground text-sm">
                    {pendingCount === 0 ? "All caught up" : `${pendingCount} item${pendingCount === 1 ? "" : "s"} need your action`}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {quickStats.map((stat, index) => (
            <div
              key={stat.label}
              className="group relative bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 hover:border-primary/30 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-primary-soft flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                {stat.trend && (
                  <span className="text-[10px] sm:text-xs font-semibold text-success bg-success-soft px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="font-display text-xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.sublabel}</p>
            </div>
          ))}
        </div>

        {/* Main Grid - Simplified */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Location Impact */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Local Impact</CardTitle>
                  <p className="text-sm text-muted-foreground">Performance by service area</p>
                </div>
              </div>
              <Link to="/analytics">
                <Button variant="ghost" size="sm">
                  Details <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {locationStats.map((location) => (
                <div key={location.area} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${location.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{location.area}</span>
                      <span className="text-sm text-muted-foreground">{location.reach} reach</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${location.color} rounded-full transition-all duration-500`}
                          style={{ width: `${(parseInt(location.reach) / 10) * 100}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${location.growth.startsWith("+") ? "text-success" : "text-destructive"
                          }`}
                      >
                        {location.growth}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card variant="elevated" className="bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Insights</CardTitle>
                  <p className="text-sm text-muted-foreground">Smart recommendations</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-sm text-muted-foreground mb-2">Best Performing Content Type</p>
                <p className="font-medium text-foreground">Before & After transformations</p>
                <p className="text-sm text-success mt-1">+45% higher engagement</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-sm text-muted-foreground mb-2">Optimal Posting Window</p>
                <p className="font-medium text-foreground">Tuesday & Friday, 6-8 PM</p>
                <p className="text-sm text-success mt-1">2.3x more reach</p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-sm text-muted-foreground mb-2">Suggested Action</p>
                <p className="font-medium text-foreground">Increase content in Bromley area</p>
                <p className="text-sm text-accent mt-1">Untapped potential detected</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
