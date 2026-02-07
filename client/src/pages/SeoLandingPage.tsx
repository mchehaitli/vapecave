import MainLayout from "@/layouts/MainLayout";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";

interface SeoLandingPageProps {
  title: string;
  headline: string;
  content: string;
}

export default function SeoLandingPage({ title, headline, content }: SeoLandingPageProps) {
  const [location] = useLocation();

  return (
    <MainLayout>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={`${headline} — Visit Vape Cave in Frisco, TX for the best selection and prices.`} />
        <link rel="canonical" href={`https://vapecavetx.com${location}`} />
      </Helmet>

      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <MapPin className="h-4 w-4" />
            <span>Frisco, TX — Main St</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-8 leading-tight">
            {headline}
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {content}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/products">
              <Button size="lg" className="gap-2">
                Browse Products <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" /> Visit Us in Frisco
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
