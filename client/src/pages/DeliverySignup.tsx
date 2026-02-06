import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Upload, CheckCircle, AlertCircle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import GooglePlacesAutocomplete, { PlaceResult } from "@/components/GooglePlacesAutocomplete";
import MainLayout from "@/layouts/MainLayout";
import { useDeliveryRadiusMiles } from "@/hooks/useSettings";

export default function DeliverySignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const deliveryRadiusMiles = useDeliveryRadiusMiles();
  const [step, setStep] = useState<"address" | "details" | "photo" | "pending">("address");
  const [loading, setLoading] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);
  
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "TX",
    zipCode: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  
  const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  // Validation functions
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Check if it has exactly 10 digits
    return digitsOnly.length === 10;
  };

  const handlePlaceSelected = (place: PlaceResult) => {
    if (!place.geometry?.location || !place.address_components) {
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    
    let streetNumber = '';
    let route = '';
    let city = '';
    let state = '';
    let zipCode = '';

    place.address_components.forEach((component) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      }
      if (types.includes('route')) {
        route = component.long_name;
      }
      
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('sublocality') && !city) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_2') && !city) {
        city = component.long_name;
      } else if (types.includes('postal_town') && !city) {
        city = component.long_name;
      }
      
      if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      
      if (types.includes('postal_code')) {
        zipCode = component.long_name;
      } else if (types.includes('postal_code_prefix') && !zipCode) {
        zipCode = component.long_name;
      }
    });

    const fullStreetAddress = `${streetNumber} ${route}`.trim();

    // Store all components in formData (needed for database)
    // but address field will show formatted_address from Google
    setFormData({
      ...formData,
      address: place.formatted_address || fullStreetAddress,
      city: city,
      state: state,
      zipCode: zipCode,
    });

    const friscoLat = 33.1507;
    const friscoLng = -96.8236;
    const distance = calculateDistance(lat, lng, friscoLat, friscoLng);
    
    if (distance <= deliveryRadiusMiles) {
      setAddressCoords({ lat, lng });
      setAddressValidated(true);
      toast({
        title: "Address Validated!",
        description: "You're within our delivery zone. Please continue with your details.",
      });
      setStep("details");
    } else {
      toast({
        title: "Outside Delivery Zone",
        description: `Sorry, you're ${distance.toFixed(1)} miles away. We currently only deliver within ${deliveryRadiusMiles} miles of our Frisco location.`,
        variant: "destructive",
      });
    }
  };

  const validateAddress = async () => {
    setLoading(true);
    try {
      // Get the actual value from the DOM input, not React state
      const actualAddress = addressInputRef.current?.value || formData.address;
      console.log('Validating address:', actualAddress);
      
      // Call server-side validation endpoint
      const res = await apiRequest("POST", "/api/delivery/validate-address", {
        address: actualAddress
      });
      
      const response: any = await res.json();
      console.log('Validation response:', response);
      
      if (response.success && response.withinDeliveryZone) {
        // Update formData with extracted components and the actual address
        setFormData({
          ...formData,
          address: actualAddress,
          city: response.city,
          state: response.state,
          zipCode: response.zipCode,
        });
        
        setAddressCoords(response.coordinates);
        setAddressValidated(true);
        
        toast({
          title: "Address Validated!",
          description: "You're within our delivery zone. Please continue with your details.",
        });
        setStep("details");
      } else if (response.success && !response.withinDeliveryZone) {
        toast({
          title: "Outside Delivery Zone",
          description: `Sorry, you're ${response.distance.toFixed(1)} miles away. We currently only deliver within ${deliveryRadiusMiles} miles of our Frisco location.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invalid Address",
          description: response.error || "We couldn't validate your address. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Address validation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to validate address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  const handleAddressInputRef = (element: HTMLInputElement | null) => {
    addressInputRef.current = element;
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Photo ID must be under 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitSignup = async () => {
    if (!photoFile || !addressCoords) {
      toast({
        title: "Missing Information",
        description: "Please complete all steps before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Convert photo to base64 to send to backend
      const photoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(photoFile);
      });
      
      // Validate email and phone format before submitting
      if (!isValidEmail(formData.email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!isValidPhone(formData.phone)) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid 10-digit phone number.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Backend will create disabled Firebase user, upload photo, and send confirmation email
      await apiRequest("POST", "/api/delivery/customers", {
        email: formData.email,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        lat: addressCoords.lat.toString(),
        lng: addressCoords.lng.toString(),
        photoIdBase64: photoBase64,
      });
      
      setStep("pending");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout
      title="Delivery Signup - Vape Cave Smoke & Stuff"
      description={`Sign up for Vape Cave Smoke & Stuff delivery service. Get premium vaping products delivered to your door within ${deliveryRadiusMiles} miles of Frisco, TX.`}
      canonical="/register"
    >
      <div className="min-h-[80vh] bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Delivery Signup</CardTitle>
              <CardDescription>
                Join our delivery service and get your favorite products delivered to your door
              </CardDescription>
              <div className="text-sm text-muted-foreground mt-2">
                Already have an account?{" "}
                <Link href="/signin" className="text-primary hover:underline" data-testid="link-login">
                  Sign in
                </Link>
              </div>
            </CardHeader>
            <CardContent>
            {/* Address Step */}
            {step === "address" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Enter your delivery address to verify you're within our service area ({deliveryRadiusMiles} miles from Frisco).
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Delivery Address</Label>
                    <GooglePlacesAutocomplete
                      value={formData.address}
                      onChange={(value) => setFormData({ ...formData, address: value })}
                      onPlaceSelected={handlePlaceSelected}
                      placeholder="Start typing your address..."
                      data-testid="input-address"
                      inputRef={handleAddressInputRef}
                    />
                  </div>

                  <Button
                    onClick={validateAddress}
                    disabled={loading || !formData.address || addressValidated}
                    className="w-full"
                    data-testid="button-validate-address"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : addressValidated ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Address Validated
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Validate Address
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Details Step */}
            {step === "details" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Alert className="bg-green-500/10 border-green-500/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    Address validated! You're within our delivery zone.
                  </AlertDescription>
                </Alert>

                <p className="text-xs text-orange-600 dark:text-orange-400">
                  First and last name must match your ID, we cannot complete a delivery if it doesn't.
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="John"
                        data-testid="input-firstname"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Doe"
                        data-testid="input-lastname"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(123) 456-7890"
                      data-testid="input-phone"
                      className={formData.phone && !isValidPhone(formData.phone) ? "border-red-500" : ""}
                    />
                    {formData.phone && !isValidPhone(formData.phone) && (
                      <p className="text-xs text-red-500 mt-1">Please enter a valid 10-digit phone number</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      data-testid="input-email"
                      className={formData.email && !isValidEmail(formData.email) ? "border-red-500" : ""}
                    />
                    {formData.email && !isValidEmail(formData.email) && (
                      <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep("address")}
                      data-testid="button-back-to-address"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep("photo")}
                      disabled={
                        !formData.firstName || 
                        !formData.lastName || 
                        !formData.phone || 
                        !formData.email ||
                        !isValidPhone(formData.phone) ||
                        !isValidEmail(formData.email)
                      }
                      className="flex-1"
                      data-testid="button-continue-to-photo"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Photo ID Step */}
            {step === "photo" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Texas law requires age verification for most of our products. Please upload a clear photo of your government-issued ID (driver's license, passport, or state ID). Otherwise your account will not be approved.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    {photoPreview ? (
                      <div className="space-y-4">
                        <img
                          src={photoPreview}
                          alt="Photo ID Preview"
                          className="max-h-64 mx-auto rounded-lg"
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                          }}
                          data-testid="button-remove-photo"
                        >
                          Remove Photo
                        </Button>
                      </div>
                    ) : (
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Click to upload your Photo ID
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Maximum file size: 5MB
                        </p>
                        <Input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                          data-testid="input-photo"
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep("details")}
                      data-testid="button-back-to-details"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={submitSignup}
                      disabled={loading || !photoFile}
                      className="flex-1"
                      data-testid="button-submit-signup"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit for Approval"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pending Approval Step */}
            {step === "pending" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-10 h-10 text-yellow-600" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-2">Application Submitted!</h3>
                  <p className="text-muted-foreground">
                    Your account is pending approval. We are currently building our delivery system and will send you an email notification once we launch with your approval and instructions to set up your password.
                  </p>
                </div>

                <Alert className="bg-blue-500/10 border-blue-500/20">
                  <AlertDescription className="text-blue-700 dark:text-blue-400">
                    You'll receive an email notification once your account is approved. 
                    Our team is reviewing your information and photo ID to verify your age.
                  </AlertDescription>
                </Alert>

                <Button
                  variant="outline"
                  onClick={() => setLocation("/")}
                  data-testid="button-back-home"
                >
                  Return to Home
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </MainLayout>
  );
}
