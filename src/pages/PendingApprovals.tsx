import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Clock,
  Edit3,
  Eye,
  MapPin,
  Calendar,
  ChevronDown,
  Filter,
  Search,
  Facebook,
  Instagram,
  Linkedin,
  Sparkles,
  ArrowRight,
  FileImage,
} from "lucide-react";
import { useState } from "react";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case "facebook":
      return <Facebook className="w-4 h-4 text-[#1877F2]" />;
    case "instagram":
      return <Instagram className="w-4 h-4 text-[#E4405F]" />;
    case "linkedin":
      return <Linkedin className="w-4 h-4 text-[#0A66C2]" />;
    default:
      return null;
  }
};

const PendingApprovals = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["pendingPosts", user?.businessId],
    queryFn: () => graphqlRequest(`
      query GetPending($businessId: ID!) {
        pendingPosts(businessId: $businessId) {
          id
          content
          mediaUrls
          status
          scheduledAt
          author {
            firstName
            lastName
          }
          targetingRegions
          platformIds
          createdAt
        }
      }
    `, { businessId: user?.businessId }),
    enabled: !!user?.businessId,
  });

  const posts = data?.pendingPosts || [];

  const approveMutation = useMutation({
    mutationFn: (variables: { id: string, status: string }) => graphqlRequest(`
      mutation Approve($id: ID!, $status: PostStatus!) {
        approvePost(id: $id, status: $status) {
          id
          status
        }
      }
    `, variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pendingPosts"] });
      toast({
        title: variables.status === 'PUBLISHED' ? "Post approved!" : "Post rejected",
        description: `The post has been ${variables.status.toLowerCase()}.`,
      });
    },
  });

  if (isLoading) return <DashboardLayout userRole="admin"><div className="p-8 text-center text-muted-foreground animate-pulse">Loading pending submissions...</div></DashboardLayout>;

  return (
    <DashboardLayout userRole="admin">
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Pending Approvals
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Review and approve staff submissions before publishing
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search submissions..."
                className="input-premium pl-10 pr-4 py-2 w-full sm:w-64"
              />
            </div>
            <Button variant="outline" size="sm" className="justify-center">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card variant="elevated" className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-secondary flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              </div>
              <div className="text-center sm:text-left">
                <p className="font-display text-lg sm:text-2xl font-bold text-foreground">{posts.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </Card>
          {/* ... other stats could be dynamic too ... */}
        </div>

        {/* Pending Posts */}
        <div className="space-y-4">
          {posts.length === 0 && (
            <div className="text-center p-12 bg-secondary/20 rounded-2xl border-2 border-dashed border-border">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-foreground">All caught up!</p>
              <p className="text-muted-foreground">No posts waiting for approval.</p>
            </div>
          )}
          {posts.map((post: any) => (
            <Card
              key={post.id}
              variant="elevated"
              className={`overflow-hidden transition-all duration-300 ${expandedPost === post.id ? "ring-2 ring-primary/20" : ""
                }`}
            >
              {/* Post Header */}
              <div
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              >
                {post.mediaUrls?.[0] ? (
                  <img
                    src={post.mediaUrls[0]}
                    alt=""
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <FileImage className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground text-sm sm:text-base truncate">{post.content.split('\n')[0]}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.targetingRegions?.[0] || 'All Areas'}
                    </span>
                    <span className="hidden sm:inline">by {post.author.firstName} {post.author.lastName}</span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform flex-shrink-0 ${expandedPost === post.id ? "rotate-180" : ""
                    }`}
                />
              </div>

              {/* Expanded Content */}
              {expandedPost === post.id && (
                <div className="border-t border-border p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
                  <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Images */}
                    <div className="space-y-3 sm:space-y-4">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Job Photos
                      </h4>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {post.mediaUrls.map((img: string, index: number) => (
                          <img
                            key={index}
                            src={img}
                            alt=""
                            className="w-full aspect-video rounded-lg sm:rounded-xl object-cover"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3 sm:space-y-4">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> Post Content
                      </h4>
                      <div className="p-3 sm:p-4 bg-primary/5 rounded-lg sm:rounded-xl border border-primary/20">
                        <p className="text-foreground text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      </div>

                      {/* Schedule */}
                      <div className="p-3 sm:p-4 bg-secondary/50 rounded-lg sm:rounded-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Scheduled For</p>
                              <p className="text-sm sm:text-base font-medium text-foreground">{post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'Immediate'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive justify-center"
                      onClick={() => approveMutation.mutate({ id: post.id, status: 'FAILED' })}
                      disabled={approveMutation.isPending}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                      <Button
                        variant="accent"
                        className="justify-center"
                        onClick={() => approveMutation.mutate({ id: post.id, status: 'PUBLISHED' })}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve & Schedule
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PendingApprovals;
