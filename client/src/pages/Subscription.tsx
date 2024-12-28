import { useState } from "react";
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
  personal: {
    name: "Personal",
    price: "$9.99/month",
    features: [
      "50 artwork analyses per month",
      "Detailed feedback",
      "Priority response time",
      "Progress tracking",
    ],
    priceId: "price_personal",
  },
  business: {
    name: "Business",
    price: "$29.99/month",
    features: [
      "Unlimited artwork analyses",
      "Advanced feedback with custom focus areas",
      "Instant response time",
      "Team collaboration features",
      "API access",
    ],
    priceId: "price_business",
  },
};

export default function Subscription() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setIsLoading(priceId);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
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
              key === "personal" ? "border-primary shadow-lg" : undefined
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
                variant={key === "personal" ? "default" : "outline"}
                disabled={
                  isLoading !== null ||
                  !tier.priceId ||
                  user?.subscriptionTier === key
                }
                onClick={() => tier.priceId && handleSubscribe(tier.priceId)}
              >
                {isLoading === tier.priceId ? (
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
