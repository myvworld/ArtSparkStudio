import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";

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
    priceId: import.meta.env.VITE_STRIPE_BASIC_PRICE_ID,
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
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
  },
};

export default function Subscription() {
  const { user } = useUser();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  // Validate environment variables on component mount
  useEffect(() => {
    console.log('Checking subscription configuration:', {
      basicPriceId: import.meta.env.VITE_STRIPE_BASIC_PRICE_ID,
      proPriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
      basicTierConfig: SUBSCRIPTION_TIERS.basic.priceId,
      proTierConfig: SUBSCRIPTION_TIERS.pro.priceId,
    });

    if (!import.meta.env.VITE_STRIPE_BASIC_PRICE_ID || !import.meta.env.VITE_STRIPE_PRO_PRICE_ID) {
      console.error('Missing Stripe price IDs in environment configuration');
      toast({
        title: "Configuration Error",
        description: "Subscription service is currently unavailable. Please try again later.",
        variant: "destructive",
      });
    }
  }, [toast]);

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

    console.log('Starting subscription process:', {
      tier,
      priceId,
      userId: user?.id
    });

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

      console.log('Subscription API response:', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create checkout session');
      }

      const data = await response.json();
      console.log('Checkout session created:', {
        hasUrl: !!data.url
      });

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

  return (
    <div className="container py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your artistic journey. Upgrade anytime to
          unlock more features and feedback.
        </p>
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