import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { BlogPost } from "@/types/blog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BlogPostPage() {
  // Extract slug from URL
  const [match, params] = useRoute<{ slug: string }>("/blog/:slug");
  const slug = params?.slug;
  
  // Query for the blog post
  const { data: post, isLoading: isPostLoading, error: postError } = useQuery<BlogPost>({
    queryKey: [`/api/blog-posts/slug/${slug}`],
    staleTime: 30000,
    enabled: !!slug,
  });
  
  // Handle 404 if post not found
  if (!isPostLoading && (!post || postError)) {
    return (
      <MainLayout
        title="Post Not Found | Vape Cave Smoke & Stuff Blog"
        description="The blog post you're looking for could not be found."
        canonical={`/blog/${slug}`}
      >
        <div className="bg-gradient-to-b from-black to-zinc-900 text-white min-h-screen">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
            <p className="text-zinc-400 mb-8">The blog post you're looking for could not be found.</p>
            <Button asChild>
              <Link href="/blog">Back to Blog</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (isPostLoading || !post) {
    return (
      <MainLayout
        title="Loading... | Vape Cave Smoke & Stuff Blog"
        description="Loading blog post content..."
      >
        <div className="bg-gradient-to-b from-black to-zinc-900 text-white min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6 max-w-3xl mx-auto">
              <div className="h-8 bg-zinc-700 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-zinc-700 rounded w-1/2 mx-auto"></div>
              <div className="space-y-3">
                <div className="h-3 bg-zinc-700 rounded"></div>
                <div className="h-3 bg-zinc-700 rounded"></div>
                <div className="h-3 bg-zinc-700 rounded"></div>
                <div className="h-3 bg-zinc-700 rounded"></div>
                <div className="h-3 bg-zinc-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  const structuredData = post.jsonld_schema ? JSON.parse(post.jsonld_schema) : null;
  
  return (
    <MainLayout
      title={`${post.meta_title || post.title} | Vape Cave Smoke & Stuff Blog`}
      description={post.meta_description || post.summary}
      canonical={`/blog/${post.slug}`}
      ogImage={post.featured_image}
      structuredData={structuredData}
    >
      <div className="bg-gradient-to-b from-black to-zinc-900 text-white min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Button asChild variant="ghost" className="mb-4 text-zinc-300 hover:text-white">
              <Link href="/blog" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">{post.title}</h1>
            
            <div className="flex items-center text-sm text-zinc-400 mb-4">
              <span>{new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
              {post.updated_at && post.updated_at !== post.created_at && (
                <>
                  <span className="mx-2">•</span>
                  <span>Updated: {new Date(post.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </>
              )}
            </div>
          </div>
          
          <Separator className="my-6 bg-zinc-700" />
          
          <Card className="border-zinc-700 bg-zinc-800 mb-8">
            <CardContent className="p-6">
              <div className="prose prose-lg prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-white">Related Posts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* This would be populated with related posts if we had them */}
              <div className="text-center py-4">
                <p className="text-zinc-400">Check back soon for more related content!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}