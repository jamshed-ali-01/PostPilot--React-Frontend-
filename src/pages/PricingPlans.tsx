import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphqlClient";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";

export const PricingPlans = () => {
    const navigate = useNavigate();

    const { data, isLoading, error } = useQuery({
        queryKey: ["subscriptionPlans"],
        queryFn: () => graphqlRequest(`
            query GetSubscriptionPlans {
                subscriptionPlans {
                    id
                    name
                    price
                    description
                    features
                    isPopular
                }
            }
        `),
    });

    const planOptions = data?.subscriptionPlans || [];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <LandingNavbar />

            <div className="flex-grow pt-32 pb-16 px-4 relative overflow-hidden">
                {/* Background Blobs for Premium Feel */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10 animate-pulse" />

                <div className="max-w-7xl mx-auto space-y-12 relative z-10">

                    {/* Header */}
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
                            Simple, transparent pricing
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Unlock the full power of PostPilot and automate your local marketing. Choose the plan that fits your growth stage.
                        </p>
                    </div>

                    {isLoading && (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    )}

                    {!isLoading && planOptions.length === 0 && (
                        <div className="text-center text-muted-foreground py-12">
                            No subscription plans found. Please contact support.
                        </div>
                    )}

                    {/* Pricing Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {planOptions.map((plan: any) => (
                            <Card
                                key={plan.id}
                                className={`relative flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-border/50 bg-card/50 backdrop-blur-sm ${plan.isPopular ? 'border-primary ring-2 ring-primary/20 scale-105 z-10 shadow-xl' : ''}`}
                            >
                                {plan.isPopular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <CardHeader className="text-center pb-2">
                                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                    {plan.description && (
                                        <CardDescription className="pt-1.5">{plan.description}</CardDescription>
                                    )}
                                </CardHeader>

                                <CardContent className="flex-1 pb-6">
                                    <div className="text-center mb-6">
                                        <span className="text-4xl font-black text-foreground">£{plan.price}</span>
                                        <span className="text-muted-foreground font-medium">/month</span>
                                    </div>

                                    <ul className="space-y-3">
                                        {plan.features.map((feature: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className="mt-0.5 rounded-full bg-primary/10 p-1 flex-shrink-0">
                                                    <Check className="h-3 w-3 text-primary" />
                                                </div>
                                                <span className="text-sm text-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter>
                                    <Button
                                        className="w-full h-12 text-md transition-all group"
                                        variant={plan.isPopular ? "default" : "outline"}
                                        onClick={() => navigate(`/register?plan=${plan.id}`)}
                                    >
                                        Choose Plan
                                        {plan.isPopular && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <LandingFooter />
        </div>
    );
};
