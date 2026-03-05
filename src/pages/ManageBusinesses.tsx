import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, Building2, Package, Calendar, AlertCircle, ShieldAlert, CheckCircle2, Search, Trash2 } from "lucide-react";

export const ManageBusinesses = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");

    // Fetch businesses
    const { data, isLoading } = useQuery({
        queryKey: ["adminBusinesses"],
        queryFn: () => graphqlRequest(`
            query GetAdminBusinesses {
                businesses {
                    id
                    name
                    isActive
                    isSubscriptionActive
                    trialEndsAt
                    subscriptionPlan {
                        name
                        price
                    }
                    users {
                        id
                        email
                    }
                }
            }
        `),
    });

    const toggleActiveMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
            return graphqlRequest(`
                mutation ToggleActiveStatus($businessId: String!, $isActive: Boolean!) {
                    toggleActiveStatus(businessId: $businessId, isActive: $isActive) {
                        id
                        isActive
                    }
                }
            `, { businessId: id, isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminBusinesses"] });
            toast({ title: "Account Status Updated", description: "The business account status has been updated." });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const toggleSubscriptionMutation = useMutation({
        mutationFn: async ({ id, isSubscriptionActive }: { id: string, isSubscriptionActive: boolean }) => {
            return graphqlRequest(`
                mutation ToggleBusinessSubscription($businessId: String!, $isSubscriptionActive: Boolean!) {
                    toggleBusinessSubscription(businessId: $businessId, isSubscriptionActive: $isSubscriptionActive) {
                        id
                        isSubscriptionActive
                    }
                }
            `, { businessId: id, isSubscriptionActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminBusinesses"] });
            toast({ title: "Subscription Status Updated", description: "The business subscription status has been updated." });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const deleteBusinessMutation = useMutation({
        mutationFn: async (id: string) => {
            return graphqlRequest(`
                mutation DeleteBusiness($businessId: String!) {
                    deleteBusiness(businessId: $businessId)
                }
            `, { businessId: id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminBusinesses"] });
            toast({ title: "Business Deleted", description: "The business and all associated data have been deleted." });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const handleToggleActive = (id: string, currentStatus: boolean, businessName: string) => {
        const action = currentStatus ? "deactivate/ban" : "activate";
        if (confirm(`Are you sure you want to ${action} account for ${businessName}?`)) {
            toggleActiveMutation.mutate({ id, isActive: !currentStatus });
        }
    };

    const handleToggleSubscription = (id: string, currentStatus: boolean, businessName: string) => {
        const action = currentStatus ? "pause/disable" : "enable";
        if (confirm(`Are you sure you want to ${action} subscription for ${businessName}?`)) {
            toggleSubscriptionMutation.mutate({ id, isSubscriptionActive: !currentStatus });
        }
    };

    const handleDeleteBusiness = (id: string, businessName: string) => {
        if (confirm(`WARNING: Are you absolutely sure you want to delete ${businessName}? This action is permanent and will delete all associated users, posts, and data.`)) {
            deleteBusinessMutation.mutate(id);
        }
    };

    const filteredBusinesses = useMemo(() => {
        if (!data?.businesses) return [];
        if (!searchTerm) return data.businesses;
        const lowerTerm = searchTerm.toLowerCase();
        return data.businesses.filter((b: any) =>
            b.name.toLowerCase().includes(lowerTerm) ||
            b.users?.[0]?.email.toLowerCase().includes(lowerTerm)
        );
    }, [data?.businesses, searchTerm]);

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-6 bg-gradient-to-r from-card to-card/50 rounded-2xl border shadow-sm gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Business Directory</h2>
                        <p className="text-muted-foreground mt-2 max-w-xl">Monitor and manage all registered businesses, their subscription packages, and activity status.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full xl:w-auto">
                        <div className="relative w-full xl:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-full bg-background"
                            />
                        </div>
                        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap">
                            <Building2 className="w-5 h-5" />
                            <span>Total Businesses: {filteredBusinesses.length}</span>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center flex-col items-center gap-4 py-24">
                        <Loader2 className="w-12 h-12 animate-spin text-primary/40" />
                        <p className="text-muted-foreground font-medium animate-pulse text-lg">Loading businesses...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                        {filteredBusinesses.map((business: any) => {
                            const isTrialing = business.trialEndsAt && new Date(business.trialEndsAt) > new Date();
                            const trialEnded = business.trialEndsAt && new Date(business.trialEndsAt) <= new Date();
                            const isFullyActive = isTrialing || business.isSubscriptionActive;

                            return (
                                <Card key={business.id} className="relative overflow-hidden flex flex-col hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-card">
                                    <CardHeader className="pb-4 border-b bg-muted/10 relative z-0">
                                        <div className={`absolute top-0 left-0 w-full h-1 transition-colors duration-500 ${isFullyActive ? "bg-emerald-500" : "bg-rose-500"}`} />

                                        <div className="flex justify-between items-start gap-4 pt-2">
                                            <div>
                                                <CardTitle className="text-xl font-bold tracking-tight">{business.name}</CardTitle>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isFullyActive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"}`}>
                                                        {isFullyActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                                        {isFullyActive ? "Active" : "Inactive / Banned"}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDeleteBusiness(business.id, business.name)}
                                                disabled={deleteBusinessMutation.isPending}
                                                title="Delete Business"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-6 flex-grow space-y-6 bg-card relative z-0">
                                        <div className="space-y-4">
                                            {/* Owners */}
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Building2 className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Email</p>
                                                    <p className="font-medium text-sm mt-0.5">{business.users?.[0]?.email || "No users"}</p>
                                                </div>
                                            </div>

                                            {/* Package */}
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Package className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Tier</p>
                                                    <p className="font-medium text-sm mt-0.5">
                                                        {business.subscriptionPlan ? (
                                                            <span className="flex items-center gap-2 text-foreground">
                                                                {business.subscriptionPlan.name}
                                                                <span className="text-xs text-muted-foreground font-normal">(£{business.subscriptionPlan.price}/mo)</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">Free Trial / Setup Phase</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Activity / Trial Dates */}
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Status</p>
                                                    <div className="font-medium text-sm mt-0.5">
                                                        {isTrialing && (
                                                            <span className="text-amber-500 flex items-center gap-1.5 flex-wrap">
                                                                Trial ends on {new Date(business.trialEndsAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                        {trialEnded && !business.subscriptionPlan && (
                                                            <span className="text-destructive flex items-center gap-1.5 flex-wrap">
                                                                <AlertCircle className="w-3.5 h-3.5" />
                                                                Trial expired on {new Date(business.trialEndsAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                        {(business.subscriptionPlan || (!isTrialing && !trialEnded)) && (
                                                            <span className="text-foreground">Regular Account</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>

                                    {/* Admin Controls */}
                                    <div className="p-4 mt-auto border-t bg-muted/20 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-semibold">Subscription Active</Label>
                                                <p className="text-xs text-muted-foreground">Toggle to enable/disable specific limits</p>
                                            </div>
                                            <Switch
                                                checked={business.isSubscriptionActive}
                                                onCheckedChange={() => handleToggleSubscription(business.id, business.isSubscriptionActive, business.name)}
                                                disabled={toggleSubscriptionMutation.isPending}
                                                className="data-[state=checked]:bg-emerald-500"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-semibold">Account Status</Label>
                                                <p className="text-xs text-muted-foreground">Toggle to allow/revoke access</p>
                                            </div>
                                            <Switch
                                                checked={business.isActive}
                                                onCheckedChange={() => handleToggleActive(business.id, business.isActive, business.name)}
                                                disabled={toggleActiveMutation.isPending}
                                                className="data-[state=checked]:bg-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}

                        {filteredBusinesses.length === 0 && (
                            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-3xl bg-muted/30">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-8 ring-primary/5">
                                    <Building2 className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold tracking-tight">No Businesses Found</h3>
                                <p className="text-muted-foreground mt-3 max-w-md text-base">There are currently no businesses registered on the platform.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};
