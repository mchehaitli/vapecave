let isLoading = false;
let isLoaded = false;
const callbacks: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];

export function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isLoaded) {
      resolve();
      return;
    }

    if (isLoading) {
      callbacks.push({ resolve, reject });
      return;
    }

    isLoading = true;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      isLoading = false;
      const error = new Error('Google Maps API key not found');
      reject(error);
      callbacks.forEach(cb => cb.reject(error));
      callbacks.length = 0;
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
      callbacks.forEach(cb => cb.resolve());
      callbacks.length = 0;
    };

    script.onerror = () => {
      isLoading = false;
      const error = new Error('Failed to load Google Maps script');
      reject(error);
      callbacks.forEach(cb => cb.reject(error));
      callbacks.length = 0;
    };

    document.head.appendChild(script);
  });
}

export function isGoogleMapsLoaded(): boolean {
  return typeof window !== 'undefined' && 
         typeof window.google !== 'undefined' && 
         typeof window.google.maps !== 'undefined' &&
         typeof window.google.maps.places !== 'undefined';
}
