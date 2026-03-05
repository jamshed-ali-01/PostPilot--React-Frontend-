import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphqlClient";

const AttentionRequired = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["pendingPosts", user?.businessId],
    queryFn: () => graphqlRequest(`
      query GetPendingPosts($businessId: ID!) {
        pendingPosts(businessId: $businessId) {
          id
          content
          targetingRegions
        }
      }
    `, { businessId: user?.businessId }),
    enabled: !!user?.businessId && !user?.isSystemAdmin,
  });

  const pendingPosts = data?.pendingPosts || [];

  const attentionItems = [
    ...(pendingPosts.length > 0 ? [{
      id: "pending-approval",
      type: "approval",
      title: `${pendingPosts.length} post${pendingPosts.length > 1 ? "s" : ""} awaiting approval`,
      description: pendingPosts.map((p: any) => p.targetingRegions?.[0] || "No location").slice(0, 3).join(", "),
      priority: "high",
      action: "Review Now",
      href: "/approvals",
    }] : []),
    {
      id: "schedule-friday",
      type: "schedule",
      title: "No posts scheduled for Friday",
      description: "AI suggests scheduling between 6-8 PM for best engagement",
      priority: "medium",
      action: "Schedule",
      href: "/schedule",
    },
    {
      id: "performance-bromley",
      type: "performance",
      title: "Engagement dropped 15% in Bromley",
      description: "Consider targeting this area with new content",
      priority: "low",
      action: "View Insights",
      href: "/analytics",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Attention Required
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Items that need your action
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground italic font-medium">Scanning for items...</p>
          </div>
        )}

        {/* Attention Items */}
        {!isLoading && (
          <div className="grid gap-4">
            {attentionItems.map((item) => (
              <Card key={item.id} variant="elevated" className="overflow-hidden">
                <Link
                  to={item.href}
                  className="block hover:bg-secondary/30 transition-colors"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${item.priority === "high"
                          ? "bg-accent"
                          : item.priority === "medium"
                            ? "bg-warning"
                            : "bg-muted-foreground"
                          }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-foreground text-lg">{item.title}</p>
                            <p className="text-muted-foreground mt-1">{item.description}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-medium text-primary hidden sm:inline">
                              {item.action}
                            </span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}

            {attentionItems.length === 0 && (
              <Card variant="elevated" className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-success-soft flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-success" />
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                  All caught up!
                </h2>
                <p className="text-muted-foreground">
                  No items need your attention right now.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttentionRequired;
