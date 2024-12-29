
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Sparkles, Brush } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data } = useQuery({
    queryKey: ["featuredArtwork"],
    queryFn: async () => {
      const response = await fetch("/api/featured-artwork");
      if (!response.ok) throw new Error("Failed to fetch featured artwork");
      return response.json();
    },
  });

  useEffect(() => {
    if (!data?.length) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((current) => (current + 1) % data.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [data]);

  return (
    <div className="min-h-screen">
      <section className="relative h-[80vh] flex items-center bg-gradient-to-br from-purple-900 via-violet-800 to-purple-900 px-6 md:px-8 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-8 items-center">
          <div className="text-left">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white bg-clip-text text-transparent bg-gradient-to-br from-purple-100 via-white to-purple-200">
              Unleash Your Creativity with AI
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl leading-relaxed">
              Take your artistic vision to the next level with cutting-edge AI insights and connect with a thriving community of creators
            </p>
            <div className="flex gap-4">
              <Link href="/auth">
                <Button size="lg" className="text-lg px-8 py-6 bg-white text-purple-900 hover:bg-gray-100 hover:scale-105 transition-all">
                  Get Started
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-white/10 hover:scale-105 transition-all">
                  View Gallery
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative group hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
              <p className="text-white text-lg font-medium">Get insights on pieces like this</p>
            </div>
            <div className="relative w-full h-[500px]">
              {data?.map((artwork, index) => (
                <img 
                  key={artwork.id}
                  src={artwork.imageUrl} 
                  alt={artwork.title}
                  className={`absolute inset-0 w-full h-full object-cover rounded-lg shadow-2xl transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
              {data && data[currentImageIndex] && (
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white bg-black/50 px-4 py-2 rounded-full">
                  Artwork by {data[currentImageIndex].username}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
        <h2 className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">Our Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-gray-800/80 border-purple-500/50 backdrop-blur-sm group hover:scale-105 transition-all">
            <CardContent className="pt-6">
              <div className="mb-4 p-3 bg-purple-500/10 rounded-lg w-fit group-hover:bg-purple-500/20 transition-colors">
                <Image className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">AI-Powered Art Insights</h3>
              <p className="text-gray-300">
                Gain in-depth analysis of your artwork's composition, style, and technique to refine your creative process
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/80 border-purple-500/50 backdrop-blur-sm group hover:scale-105 transition-all">
            <CardContent className="pt-6">
              <div className="mb-4 p-3 bg-purple-500/10 rounded-lg w-fit group-hover:bg-purple-500/20 transition-colors">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Connect in the Community Gallery</h3>
              <p className="text-gray-300">
                Showcase your work, gain inspiration, and collaborate with like-minded artists in our vibrant gallery
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/80 border-purple-500/50 backdrop-blur-sm group hover:scale-105 transition-all">
            <CardContent className="pt-6">
              <div className="mb-4 p-3 bg-purple-500/10 rounded-lg w-fit group-hover:bg-purple-500/20 transition-colors">
                <Brush className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Creative Art Tools</h3>
              <p className="text-gray-300">
                Access advanced tools designed to support and enhance every step of your artistic journey
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
