import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StripeConfig {
  basicPriceId: string;
  proPriceId: string;
  mode: 'test' | 'live';
}

const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: "$0/month",
    features: [
      "5 artwork analyses per month",
      "Basic feedback",
      "Standard response time",
    ],
    priceId: null,
  },
  basic: {
    name: "Basic",
    price: "$9.99/month",
    features: [
      "50 artwork analyses per month",
      "Detailed feedback",
      "Priority response time",
      "Progress tracking",
    ],
    priceId: undefined, // Will be set from server config
  },
  pro: {
    name: "Pro",
    price: "$29.99/month",
    features: [
      "Unlimited artwork analyses",
      "Advanced feedback with custom focus areas",
      "Instant response time",
      "Team collaboration features",
      "API access",
    ],
    priceId: undefined, // Will be set from server config
  },
};

export default function Subscription() {
  const { user } = useUser();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  // Fetch Stripe configuration from server
  const { data: config, isLoading: isLoadingConfig } = useQuery<StripeConfig>({
    queryKey: ["/api/subscription/config"],
    onSuccess: (data) => {
      SUBSCRIPTION_TIERS.basic.priceId = data.basicPriceId;
      SUBSCRIPTION_TIERS.pro.priceId = data.proPriceId;

      console.log('Loaded subscription configuration:', {
        mode: data.mode,
        basic: data.basicPriceId,
        pro: data.proPriceId
      });
    },
    onError: (error) => {
      console.error('Failed to load subscription configuration:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription configuration",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = async (tier: string, priceId: string | null) => {
    if (!priceId) {
      console.error('Missing price ID for tier:', tier);
      toast({
        title: "Error",
        description: "This subscription plan is currently unavailable",
        variant: "destructive",
      });
      return;
    }

    setLoadingTier(tier);
    try {
      const response = await fetch("/api/subscription/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error("No checkout URL received");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Subscription error:', {
        error: error instanceof Error ? error.message : error,
        tier,
        priceId
      });

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start subscription process",
        variant: "destructive",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your artistic journey. Upgrade anytime to
          unlock more features and feedback.
        </p>
        {config?.mode === 'test' && (
          <div className="mt-4 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            Test Mode Active - Use test card numbers for payments
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
          <Card
            key={key}
            className={
              key === "basic" ? "border-primary shadow-lg" : undefined
            }
          >
            <CardHeader>
              <CardTitle>
                <div className="flex justify-between items-baseline">
                  <span>{tier.name}</span>
                  <span className="text-xl font-normal text-muted-foreground">
                    {tier.price}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={key === "basic" ? "default" : "outline"}
                disabled={
                  loadingTier !== null ||
                  !tier.priceId ||
                  user?.subscriptionTier === key
                }
                onClick={() => handleSubscribe(key, tier.priceId)}
              >
                {loadingTier === key ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : user?.subscriptionTier === key ? (
                  "Current Plan"
                ) : (
                  "Subscribe"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}