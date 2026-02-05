import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, HelpCircle } from "lucide-react";

export default function DeliveryHelp() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DeliveryHeader showSearch={false} showBackButton={true} />
      <DeliveryCategoryNav />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <HelpCircle className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Need Help?</h1>
          <p className="text-muted-foreground">
            We're here to help with any questions or order issues
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a 
                href="mailto:vapecavetex@gmail.com" 
                className="text-lg text-primary hover:underline"
              >
                vapecavetex@gmail.com
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                For order issues, questions, or general inquiries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Call Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a 
                href="tel:+14692940061" 
                className="text-lg text-primary hover:underline"
              >
                (469) 294-0061
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                Available during store hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Store Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <address className="not-italic text-lg">
                6958 Main St #200<br />
                Frisco, TX 75033
              </address>
              <a 
                href="https://maps.google.com/?q=6958+Main+St+%23200,+Frisco,+TX+75033"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                Get Directions
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Store Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Every Day</span>
                  <span className="font-medium">10:00 AM - 12:00 AM</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Order Issues?</h3>
              <p className="text-sm text-muted-foreground">
                If you have any problems with your order, please contact us via email or phone with your order number and we'll help resolve it as quickly as possible.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <DeliveryFooter />
    </div>
  );
}
