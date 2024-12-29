
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Sparkles, Brush } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center bg-gradient-to-r from-purple-900 via-violet-800 to-purple-900">
        <div className="text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
            Transform Your Art with AI
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">
            Elevate your artistic journey with powerful AI analysis and a vibrant community
          </p>
          <Link href="/auth">
            <Button size="lg" className="text-lg px-8">Get Started</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-white">Our Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-800 border-purple-500">
              <CardContent className="pt-6">
                <div className="mb-4 p-3 bg-purple-500/10 rounded-lg w-fit">
                  <Image className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">AI Art Analysis</h3>
                <p className="text-gray-300">
                  Get detailed insights about your artwork's composition and style
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-purple-500">
              <CardContent className="pt-6">
                <div className="mb-4 p-3 bg-purple-500/10 rounded-lg w-fit">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Community Gallery</h3>
                <p className="text-gray-300">
                  Share your work and connect with fellow artists
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-purple-500">
              <CardContent className="pt-6">
                <div className="mb-4 p-3 bg-purple-500/10 rounded-lg w-fit">
                  <Brush className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Art Tools</h3>
                <p className="text-gray-300">
                  Access powerful tools to enhance your creative process
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
