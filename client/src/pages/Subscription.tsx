import { useState } from "react";
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
    name: "Spark Starter",
    price: "Free",
    features: [
      "Upload up to 5 images/month",
      "Basic AI feedback",
      "General composition improvements",
      "Basic color and style analysis",
      "Save and view feedback history",
    ],
    priceId: null,
  },
  basic: {
    name: "Creative Canvas",
    price: "$30/month",
    yearlyPrice: "$300/year (Save $60)",
    features: [
      "Upload up to 500 images/month",
      "Detailed AI feedback & suggestions",
      "In-depth composition analysis",
      "Color and style recommendations",
      "Behavioral insights tracking",
      "Organized feedback library",
      "Basic community features",
      "Peer review access",
    ],
    priceId: undefined, // Will be set from server config
  },
  pro: {
    name: "Visionary",
    price: "$60/month",
    yearlyPrice: "$600/year (Save $120)",
    features: [
      "Upload up to 1,500 images/month",
      "Advanced AI feedback system",
      "Marketability analysis",
      "Portfolio optimization insights",
      "Priority image processing",
      "Private feedback groups",
      "Professional networking tools",
      "Advanced community features",
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
    // For test version, just show a message
    toast({
      title: "Test Mode",
      description: "This is a test version. Payment integration coming soon!",
    });
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
        <h1 className="text-4xl font-bold mb-4">Choose Your Creative Journey</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Unlock the full potential of your artistic journey with our AI-powered feedback and analysis tools.
        </p>
        <div className="mt-4 text-sm text-yellow-600 bg-yellow-50 p-2 rounded inline-block">
          🚧 Preview Version - Payment Integration Coming Soon 🚧
        </div>
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
                <div className="flex flex-col gap-2">
                  <span className="text-xl">{tier.name}</span>
                  <div className="space-y-1">
                    <div className="text-xl font-normal text-muted-foreground">
                      {tier.price}
                    </div>
                    {tier.yearlyPrice && (
                      <div className="text-sm text-green-600">
                        {tier.yearlyPrice}
                      </div>
                    )}
                  </div>
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
                disabled={user?.subscriptionTier === key}
                onClick={() => handleSubscribe(key, tier.priceId)}
              >
                {user?.subscriptionTier === key ? (
                  "Current Plan"
                ) : (
                  "Preview Plan"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}