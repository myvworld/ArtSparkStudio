import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";

interface StripeConfig {
  basicPriceId: string;
  proPriceId: string;
  mode: 'test' | 'live';
}

interface SubscriptionTier {
  name: string;
  price: string;
  yearlyPrice?: string;
  features: string[];
  priceId: string | null | undefined;
}

interface TokenPackage {
  name: string;
  credits: number;
  price: string;
  description: string;
  popular?: boolean;
}

const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
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

const TOKEN_PACKAGES: TokenPackage[] = [
  {
    name: "Basic Pack",
    credits: 100,
    price: "$9.99",
    description: "Perfect for occasional uploads",
  },
  {
    name: "Popular Pack",
    credits: 250,
    price: "$19.99",
    description: "Best value for regular users",
    popular: true,
  },
  {
    name: "Pro Pack",
    credits: 500,
    price: "$39.99",
    description: "Ideal for power users",
  },
];

export default function Subscription() {
  const { user } = useUser();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  // Fetch Stripe configuration from server
  const { data: config } = useQuery<StripeConfig>({
    queryKey: ["/api/subscription/config"],
  });

  // Update price IDs when config is loaded
  if (config) {
    SUBSCRIPTION_TIERS.basic.priceId = config.basicPriceId;
    SUBSCRIPTION_TIERS.pro.priceId = config.proPriceId;
  }

  const handleSubscribe = async (tier: string, priceId: string | null) => {
    // For test version, just show a message
    toast({
      title: "Test Mode",
      description: "This is a test version. Payment integration coming soon!",
    });
  };

  return (
    <div className="container py-12 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Creative Journey</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Unlock the full potential of your artistic journey with our AI-powered feedback and analysis tools.
        </p>
        <div className="mt-4 text-sm text-yellow-600 bg-yellow-50 p-2 rounded inline-block">
          🚧 Preview Version - Payment Integration Coming Soon 🚧
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
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

      {/* Pay-As-You-Go Section */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Pay-As-You-Go</h2>
          <p className="text-muted-foreground">
            Perfect for users who prefer flexibility without a subscription
          </p>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>FlexPass</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-semibold mb-2">$0.50 per upload</div>
                <p className="text-muted-foreground">
                  Access professional-level AI feedback without a subscription
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Professional-tier AI feedback</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>No monthly commitments</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Pay only for what you use</span>
                </li>
              </ul>
              <Button className="w-full mt-4">
                Get Started with FlexPass
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Packages Section */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Token Packages</h2>
          <p className="text-muted-foreground">
            Need more uploads? Purchase additional tokens at discounted rates
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {TOKEN_PACKAGES.map((pack) => (
            <Card
              key={pack.name}
              className={pack.popular ? "border-primary shadow-lg" : undefined}
            >
              <CardHeader>
                <CardTitle className="flex flex-col gap-2">
                  <span>{pack.name}</span>
                  <div className="text-2xl font-normal text-muted-foreground">
                    {pack.price}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{pack.description}</p>
                  <div className="text-lg font-medium">
                    {pack.credits} uploads
                  </div>
                  <Button className="w-full" variant={pack.popular ? "default" : "outline"}>
                    Purchase Tokens
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Portfolio Review Section */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Portfolio Review</h2>
          <p className="text-muted-foreground">
            Get comprehensive AI analysis of your entire portfolio
          </p>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Professional Portfolio Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-semibold mb-2">$49.99 per report</div>
                <p className="text-muted-foreground">
                  Detailed AI-generated professional report with comprehensive improvement suggestions
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>In-depth style analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Technical skill assessment</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Personalized improvement roadmap</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Market positioning insights</span>
                </li>
              </ul>
              <Button className="w-full mt-4">
                Order Portfolio Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}