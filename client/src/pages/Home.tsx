import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { ArrowRight, Brush, Image, Sparkles } from "lucide-react";

export default function Home() {
  const { user } = useUser();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Elevate Your Art with AI Insights
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get personalized feedback on your artwork using advanced AI technology.
            Perfect your technique and grow as an artist with ArtSpark.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={user ? "/dashboard" : "/login"}>
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <Image className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload Your Art</h3>
                <p className="text-muted-foreground">
                  Share your artwork in any common format. Works with digital art,
                  photographs of traditional media, and more.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes your art's composition, technique, and style,
                  providing detailed insights.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <Brush className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Improve & Grow</h3>
                <p className="text-muted-foreground">
                  Get actionable feedback and suggestions to enhance your artistic
                  skills and technique.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Inspiring Art Gallery</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <img
              src="https://images.unsplash.com/photo-1635151227785-429f420c6b9d"
              alt="Digital Art Gallery"
              className="rounded-lg shadow-lg aspect-video object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1471666875520-c75081f42081"
              alt="Art Exhibition"
              className="rounded-lg shadow-lg aspect-video object-cover"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Art Journey?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join ArtSpark today and get instant feedback on your artwork.
          </p>
          <Link href={user ? "/dashboard" : "/login"}>
            <Button
              size="lg"
              variant="secondary"
              className="gap-2"
            >
              Start Creating <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
