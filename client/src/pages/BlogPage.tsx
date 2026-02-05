import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BlogPost } from "@/types/blog";
import { motion } from "framer-motion";

export default function BlogPage() {
  // Query for blog posts
  const { data: blogPosts = [], isLoading: isBlogPostsLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog-posts'],
    staleTime: 30000,
  });
  
  return (
    <MainLayout
      title="Blog | Vape Cave TX"
      description="Read our latest articles about vaping products and industry news."
      canonical="/blog"
    >
      <div className="bg-background text-foreground min-h-screen">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-center mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Vape Cave Blog
          </motion.h1>
          <motion.p 
            className="text-lg text-center text-muted-foreground mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Stay up to date with the latest news, reviews, and information about vaping products.
          </motion.p>
          
          <Separator className="my-8 bg-border" />
          
          {isBlogPostsLoading ? (
            // Loading state
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse rounded-lg bg-card border border-border p-4">
                    <div className="h-6 bg-zinc-800 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-zinc-800 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-zinc-800 rounded"></div>
                      <div className="h-3 bg-zinc-800 rounded"></div>
                      <div className="h-3 bg-zinc-800 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : blogPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post: BlogPost) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                Our blog is coming soon. Check back for articles about vaping and more!
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

interface BlogPostCardProps {
  post: BlogPost;
}

function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <motion.div
      className="overflow-hidden rounded-lg p-4 bg-card border-2 border-primary/50"
      animate={{
        boxShadow: [
          '0 0 15px rgba(255, 113, 0, 0.2), 0 0 30px rgba(255, 113, 0, 0.1)',
          '0 0 25px rgba(255, 113, 0, 0.4), 0 0 50px rgba(255, 113, 0, 0.2)',
          '0 0 15px rgba(255, 113, 0, 0.2), 0 0 30px rgba(255, 113, 0, 0.1)',
        ]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold mb-1">{post.title}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
          {post.is_featured && (
            <div className="bg-primary text-black text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Featured</span>
            </div>
          )}
        </div>
      </div>
      <div>
        <p className="text-muted-foreground text-sm line-clamp-3 mb-3">{post.summary}</p>
        <Link
          href={`/blog/${post.slug}`} 
          className="text-primary hover:text-primary/80 text-sm font-semibold inline-block"
        >
          Read More →
        </Link>
      </div>
    </motion.div>
  );
}