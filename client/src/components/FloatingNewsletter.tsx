import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'newsletter_popup_dismissed';

export function FloatingNewsletter() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the user has previously dismissed the popup
    const isDismissed = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';
    
    if (!isDismissed) {
      // Show popup after a 5-second delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store the user's preference
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, source: 'popup' }),
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: "You've been subscribed to our newsletter.",
        });
        setIsVisible(false);
        localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <Card className="w-72 sm:w-80 shadow-lg border-primary/20 bg-background/80 backdrop-blur-sm">
        <CardHeader className="pb-1 pt-3 px-4 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-1 right-1 h-5 w-5" 
            onClick={handleDismiss}
            aria-label="Close newsletter popup"
          >
            <X className="h-3 w-3" />
          </Button>
          <CardTitle className="text-sm font-medium">Join Our Newsletter</CardTitle>
          <CardDescription className="text-xs">Get updates on products and exclusive offers.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="px-4 py-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm h-8"
              required
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-0 pb-3 px-4">
            <Button variant="ghost" onClick={handleDismiss} type="button" className="h-7 text-xs px-2">
              No Thanks
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-7 text-xs px-3">
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default FloatingNewsletter;