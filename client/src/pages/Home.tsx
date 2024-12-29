import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Sparkles, Brush } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-screen flex flex-col justify-center bg-gradient-to-r from-purple-900 via-violet-800 to-purple-900 px-4 py-12">
        <div className="max-w-7xl mx-auto w-full">
          <div className="relative">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4">
                  <Image className="w-6 h-6 text-purple-400 mb-2" />
                  <h3 className="font-semibold text-white">AI Analysis</h3>
                  <p className="text-sm text-gray-300">Get detailed insights about composition and style</p>
                </div>
                <div className="p-4">
                  <Sparkles className="w-6 h-6 text-purple-400 mb-2" />
                  <h3 className="font-semibold text-white">Community</h3>
                  <p className="text-sm text-gray-300">Share and connect with fellow artists</p>
                </div>
                <div className="p-4">
                  <Brush className="w-6 h-6 text-purple-400 mb-2" />
                  <h3 className="font-semibold text-white">Pro Tools</h3>
                  <p className="text-sm text-gray-300">Access advanced creative tools</p>
                </div>
                <div className="p-4">
                  <div className="w-6 h-6 text-purple-400 mb-2">✨</div>
                  <h3 className="font-semibold text-white">Analytics</h3>
                  <p className="text-sm text-gray-300">Track your artistic growth</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-12"> {/* Added mt-12 for spacing */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Transform Your Art with AI
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">
              Elevate your artistic journey with powerful AI analysis and a vibrant community
            </p>
            <Link href="/auth">
              <Button size="lg" className="text-lg px-8 mb-16">Get Started</Button>
            </Link>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">Our Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="bg-gray-800/80 border-purple-500 backdrop-blur-sm">
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

              <Card className="bg-gray-800/80 border-purple-500 backdrop-blur-sm">
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

              <Card className="bg-gray-800/80 border-purple-500 backdrop-blur-sm">
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
        </div>
      </section>
    </div>
  );
}