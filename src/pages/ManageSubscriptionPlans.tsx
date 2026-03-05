import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Trash2, Plus, Edit, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

export const ManageSubscriptionPlans = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

    // Form state for a new/edit plan
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [features, setFeatures] = useState(""); // Comma separated

    // Fetch plans
    const { data, isLoading } = useQuery({
        queryKey: ["subscriptionPlans"],
        queryFn: () => graphqlRequest(`
            query GetSubscriptionPlans {
                subscriptionPlans {
                    id
                    name
                    price
                    description
                    features
                }
            }
        `),
    });

    const resetForm = () => {
        setName(""); setPrice(""); setDescription(""); setFeatures("");
        setEditingPlanId(null);
        setIsDialogOpen(false);
    };

    const handleEditPlanClick = (plan: any) => {
        setName(plan.name);
        setPrice(plan.price.toString());
        setDescription(plan.description || "");
        setFeatures(plan.features?.join(", ") || "");
        setEditingPlanId(plan.id);
        setIsDialogOpen(true);
    };

    const handleCreateClick = () => {
        setName(""); setPrice(""); setDescription(""); setFeatures("");
        setEditingPlanId(null);
        setIsDialogOpen(true);
    };

    // Create plan mutation
    const createMutation = useMutation({
        mutationFn: async (planData: any) => {
            return graphqlRequest(`
                mutation CreatePlan($name: String!, $price: Float!, $description: String, $features: [String!]!) {
                    createSubscriptionPlan(name: $name, price: $price, description: $description, features: $features) {
                        id
                    }
                }
            `, planData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptionPlans"] });
            toast({ title: "Package Created", description: "Successfully added the new subscription package." });
            resetForm();
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    // Update plan mutation
    const updateMutation = useMutation({
        mutationFn: async (planData: any) => {
            return graphqlRequest(`
                mutation UpdatePlan($id: String!, $name: String, $price: Float, $description: String, $features: [String!]) {
                    updateSubscriptionPlan(id: $id, name: $name, price: $price, description: $description, features: $features) {
                        id
                    }
                }
            `, planData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptionPlans"] });
            toast({ title: "Package Updated", description: "Successfully updated the subscription package." });
            resetForm();
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    // Delete plan mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return graphqlRequest(`
                mutation DeletePlan($id: String!) {
                    deleteSubscriptionPlan(id: $id)
                }
            `, { id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptionPlans"] });
            toast({ title: "Package Deleted", description: "Successfully removed the package." });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const featureArray = features.split(",").map(f => f.trim()).filter(f => f.length > 0);

        if (editingPlanId) {
            updateMutation.mutate({
                id: editingPlanId,
                name,
                price: parseFloat(price),
                description,
                features: featureArray
            });
        } else {
            createMutation.mutate({
                name,
                price: parseFloat(price),
                description,
                features: featureArray
            });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-8 animate-fade-in relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-gradient-to-r from-card to-card/50 rounded-2xl border shadow-sm gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Manage Packages</h2>
                    <p className="text-muted-foreground mt-2 max-w-xl">Design and tailor the pricing tiers available to your customers. Create bundles that highlight your best features.</p>
                </div>
                <Button onClick={handleCreateClick} size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Package
                </Button>
            </div>

            {/* Dialog for Creation/Editing */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open && !isPending) resetForm();
            }}>
                <DialogContent className="sm:max-w-[600px] overflow-hidden p-0 border-0 shadow-2xl">
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" />
                    <div className="p-6 pt-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-bold">{editingPlanId ? "Edit Package" : "Create New Package"}</DialogTitle>
                            <DialogDescription className="text-base mt-2">
                                {editingPlanId ? "Update the details for this subscription package. Changes take effect immediately." : "Configure pricing and inclusions for the pricing page. It will be live instantly."}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2.5">
                                    <Label className="font-semibold text-sm">Package Name <span className="text-destructive">*</span></Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pro, Premium" className="h-12 bg-muted/50 focus:bg-background transition-colors" required disabled={isPending} />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="font-semibold text-sm">Monthly Price (£) <span className="text-destructive">*</span></Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
                                        <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="h-12 pl-8 bg-muted/50 focus:bg-background transition-colors" required disabled={isPending} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <Label className="font-semibold text-sm">Tagline / Short Description</Label>
                                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Best for growing businesses with large audiences" className="h-12 bg-muted/50 focus:bg-background transition-colors" disabled={isPending} />
                            </div>
                            <div className="space-y-3 bg-secondary/30 p-5 rounded-xl border border-border/50">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    <Label className="font-semibold text-sm">Features Include <span className="text-destructive">*</span></Label>
                                </div>
                                <Input
                                    value={features}
                                    onChange={(e) => setFeatures(e.target.value)}
                                    placeholder="e.g. AI Posting, Analytics, 5 Social Profiles"
                                    className="h-12 bg-background border-primary/20 focus-visible:ring-primary/40 shadow-sm"
                                    required
                                    disabled={isPending}
                                />
                                <div className="flex items-start gap-2 text-xs text-muted-foreground pl-1">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                    <p>Separate each feature bullet point with a comma ( , )</p>
                                </div>
                            </div>
                            <DialogFooter className="pt-4 border-t gap-3 sm:gap-0 mt-8">
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost" className="h-11 px-6 rounded-xl" disabled={isPending}>
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" className="h-11 px-8 rounded-xl shadow-md min-w-[140px]" disabled={isPending}>
                                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingPlanId ? "Save Changes" : "Publish Package")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* List of existing plans */}
            {isLoading ? (
                <div className="flex justify-center flex-col items-center gap-4 py-24">
                    <Loader2 className="w-12 h-12 animate-spin text-primary/40" />
                    <p className="text-muted-foreground font-medium animate-pulse text-lg">Loading packages...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {data?.subscriptionPlans?.map((plan: any) => (
                        <Card key={plan.id} className="relative overflow-hidden flex flex-col hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-card">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-9 w-9 rounded-full shadow-sm bg-background/80 backdrop-blur-sm hover:bg-background"
                                    onClick={() => handleEditPlanClick(plan)}
                                    title="Edit Package"
                                >
                                    <Edit className="w-4 h-4 text-foreground" />
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-9 w-9 rounded-full shadow-sm opacity-90 hover:opacity-100"
                                    onClick={() => {
                                        if (confirm(`Are you sure you want to delete the "${plan.name}" package? this might affect active subscribers.`)) {
                                            deleteMutation.mutate(plan.id);
                                        }
                                    }}
                                    disabled={deleteMutation.isPending}
                                    title="Delete Package"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <CardHeader className="pb-6 border-b bg-muted/10 relative z-0">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-border to-border group-hover:from-primary group-hover:to-accent transition-colors duration-500" />
                                <div className="pt-2">
                                    <CardTitle className="text-2xl font-bold tracking-tight">{plan.name}</CardTitle>
                                    <div className="flex items-baseline gap-1 mt-4">
                                        <span className="text-4xl font-black tracking-tighter">£{plan.price}</span>
                                        <span className="text-sm text-muted-foreground font-semibold">/mo</span>
                                    </div>
                                    {plan.description && (
                                        <p className="text-sm text-muted-foreground mt-4 leading-relaxed line-clamp-2 h-10">{plan.description}</p>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 flex-grow space-y-5 bg-card relative z-0">
                                <p className="text-xs font-bold uppercase tracking-widest text-primary">Everything in {plan.name} includes:</p>
                                <ul className="space-y-3.5">
                                    {plan.features.map((f: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm font-medium">
                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <span className="text-foreground/90 leading-tight pt-0.5">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <div className="p-6 pt-0 mt-auto bg-card">
                                <Button
                                    className="w-full h-12 rounded-xl border-dashed bg-secondary/50 hover:bg-secondary text-secondary-foreground shadow-none group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 pointer-events-none"
                                >
                                    Current Tier Features
                                </Button>
                            </div>
                        </Card>
                    ))}
                    {data?.subscriptionPlans?.length === 0 && (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-3xl bg-muted/30">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-8 ring-primary/5">
                                <Sparkles className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight">Ready to add your packages?</h3>
                            <p className="text-muted-foreground mt-3 max-w-md text-base">You haven't created any subscription tiers yet. Add your first package to display it on your public pricing page.</p>
                            <Button onClick={handleCreateClick} size="lg" className="mt-8 rounded-xl h-12 px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30">
                                <Plus className="w-5 h-5 mr-2" />
                                Create First Package
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
