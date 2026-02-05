import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { loadGoogleMapsScript, isGoogleMapsLoaded } from "@/lib/googleMaps";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export interface PlaceResult {
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_address?: string;
  geometry?: {
    location: {
      lat(): number;
      lng(): number;
    };
  };
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: PlaceResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
  inputRef?: (element: HTMLInputElement | null) => void;
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Enter your address",
  disabled = false,
  className,
  "data-testid": dataTestId,
  inputRef: externalInputRef,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const setInputRef = (element: HTMLInputElement | null) => {
    (inputRef as any).current = element;
    if (externalInputRef) {
      externalInputRef(element);
    }
  };
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const ignoreNextChange = useRef(false);

  // Sync parent value to input element manually
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  useEffect(() => {
    if (isGoogleMapsLoaded()) {
      setIsScriptLoaded(true);
      return;
    }

    loadGoogleMapsScript()
      .then(() => {
        setIsScriptLoaded(true);
        setLoadError(null);
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        setLoadError(error.message || 'Failed to load address autocomplete');
      });
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current || autocompleteRef.current || loadError) {
      return;
    }

    if (!window.google?.maps?.places) {
      return;
    }

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "us" },
        fields: ["address_components", "formatted_address", "geometry", "name"],
      });

      const autocomplete = autocompleteRef.current;
      if (!autocomplete) return;
      
      const listener = autocomplete.addListener("place_changed", () => {
        const googlePlace = autocomplete.getPlace();
        if (!googlePlace?.address_components || !googlePlace?.geometry?.location) {
          return;
        }
        
        const place: PlaceResult = {
          address_components: googlePlace.address_components.map(comp => ({
            long_name: comp.long_name,
            short_name: comp.short_name,
            types: comp.types,
          })),
          formatted_address: googlePlace.formatted_address,
          geometry: {
            location: {
              lat: () => googlePlace.geometry!.location!.lat(),
              lng: () => googlePlace.geometry!.location!.lng(),
            },
          },
        };
        
        // Ignore the next onChange event to prevent React from overriding Google's value
        ignoreNextChange.current = true;
        
        // Update parent state with formatted address
        if (place.formatted_address && inputRef.current) {
          // Manually set the input value
          inputRef.current.value = place.formatted_address;
          onChange(place.formatted_address);
        }
        
        onPlaceSelected(place);
        
        // Reset flag after a short delay
        setTimeout(() => {
          ignoreNextChange.current = false;
        }, 200);
      });

      return () => {
        if (listener && window.google?.maps?.event) {
          window.google.maps.event.removeListener(listener);
        }
      };
    } catch (error) {
      console.error('Failed to initialize Google Places Autocomplete:', error);
      setLoadError('Failed to initialize address autocomplete');
    }
  }, [isScriptLoaded, onPlaceSelected, loadError]);

  if (loadError) {
    return (
      <div className="space-y-2">
        <Input
          ref={setInputRef}
          type="text"
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          data-testid={dataTestId}
          autoComplete="off"
        />
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {loadError}. Please enter your address manually.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Input
      ref={setInputRef}
      type="text"
      defaultValue={value}
      onChange={(e) => {
        if (!ignoreNextChange.current) {
          onChange(e.target.value);
        }
      }}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      data-testid={dataTestId}
      autoComplete="off"
    />
  );
}
