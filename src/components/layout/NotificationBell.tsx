import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCircle, Clock, ImagePlus, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphqlClient";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    type: "pending_approval" | "scheduled" | "published" | "attention";
    title: string;
    message: string;
    href: string;
    time: string;
    read: boolean;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
}

const typeConfig = {
    pending_approval: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    scheduled: { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
    published: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    attention: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
};

export const NotificationBell = () => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const panelRef = useRef<HTMLDivElement>(null);

    // Fetch pending posts
    const { data: pendingData } = useQuery({
        queryKey: ["pendingPosts", user?.businessId],
        queryFn: () => graphqlRequest(`
      query GetPendingPosts($businessId: ID!) {
        pendingPosts(businessId: $businessId) {
          id
          content
          createdAt
        }
      }
    `, { businessId: user?.businessId }),
        enabled: !!user?.businessId && !user?.isSystemAdmin,
        refetchInterval: 30000,
    });

    // Fetch scheduled posts
    const { data: postsData } = useQuery({
        queryKey: ["businessPostsForNotifs", user?.businessId],
        queryFn: () => graphqlRequest(`
      query GetPostsForNotifs($businessId: ID!) {
        businessPosts(businessId: $businessId) {
          id
          content
          status
          scheduledAt
          createdAt
        }
      }
    `, { businessId: user?.businessId }),
        enabled: !!user?.businessId,
        refetchInterval: 60000,
    });

    // Build notifications from real data
    const notifications: Notification[] = [];

    const pendingPosts = pendingData?.pendingPosts || [];
    pendingPosts.forEach((p: any) => {
        notifications.push({
            id: `pending-${p.id}`,
            type: "pending_approval",
            title: "Pending Approval",
            message: p.content?.slice(0, 60)?.replace(/\n/g, " ") + (p.content?.length > 60 ? "…" : ""),
            href: "/approvals",
            time: timeAgo(p.createdAt),
            read: readIds.has(`pending-${p.id}`),
        });
    });

    const allPosts = postsData?.businessPosts || [];
    const scheduledPosts = allPosts.filter((p: any) => p.status === "SCHEDULED" && p.scheduledAt);
    scheduledPosts.slice(0, 3).forEach((p: any) => {
        notifications.push({
            id: `scheduled-${p.id}`,
            type: "scheduled",
            title: "Post Scheduled",
            message: p.content?.slice(0, 60)?.replace(/\n/g, " ") + (p.content?.length > 60 ? "…" : ""),
            href: "/schedule",
            time: timeAgo(p.createdAt),
            read: readIds.has(`scheduled-${p.id}`),
        });
    });

    const publishedRecent = allPosts
        .filter((p: any) => p.status === "PUBLISHED")
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);
    publishedRecent.forEach((p: any) => {
        notifications.push({
            id: `published-${p.id}`,
            type: "published",
            title: "Post Published",
            message: p.content?.slice(0, 60)?.replace(/\n/g, " ") + (p.content?.length > 60 ? "…" : ""),
            href: "/analytics",
            time: timeAgo(p.createdAt),
            read: readIds.has(`published-${p.id}`),
        });
    });

    // Sort: unread first, then by recency
    notifications.sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0));

    const unreadCount = notifications.filter(n => !n.read).length;

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const markAllRead = () => {
        setReadIds(new Set(notifications.map(n => n.id)));
    };

    const markRead = (id: string) => {
        setReadIds(prev => new Set([...prev, id]));
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-200 hover:scale-105"
                aria-label="Notifications"
            >
                <Bell className="w-4 h-4 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[9px] font-bold text-primary-foreground animate-in zoom-in-50 duration-200">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-11 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl z-[999] overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-secondary"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                                    <Bell className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium text-foreground">All caught up!</p>
                                <p className="text-xs text-muted-foreground mt-1">No new notifications</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const cfg = typeConfig[notif.type];
                                return (
                                    <Link
                                        key={notif.id}
                                        to={notif.href}
                                        onClick={() => { markRead(notif.id); setOpen(false); }}
                                        className={cn(
                                            "flex items-start gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors border-b border-border/50 last:border-0 group",
                                            !notif.read && "bg-primary/[0.03]"
                                        )}
                                    >
                                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                                            <cfg.icon className={cn("w-4 h-4", cfg.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={cn("text-xs font-semibold", cfg.color)}>{notif.title}</p>
                                                <span className="text-[10px] text-muted-foreground shrink-0">{notif.time}</span>
                                            </div>
                                            <p className="text-xs text-foreground mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                        </div>
                                        {!notif.read && (
                                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                                        )}
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-border bg-secondary/20">
                            <Link
                                to="/approvals"
                                onClick={() => setOpen(false)}
                                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 justify-center"
                            >
                                View all pending approvals →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
