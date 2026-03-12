const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Vape+Cave+Smoke+and+Stuff+Frisco&query_place_id=ChIJZ2EXpXw9TIYRjUEpqkkI6Lg";

export default function MobileStickyBar() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/95 backdrop-blur-sm border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
      <div className="flex">
        <a
          href={GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-primary/90 hover:bg-primary active:bg-primary/80 transition-colors"
          onClick={() => (window as any).gtag?.('event', 'get_directions', { event_category: 'lead', event_label: 'mobile_sticky_bar' })}
        >
          📍 Get Directions
        </a>
        <div className="w-px bg-black/20" />
        <a
          href="tel:+14692940061"
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-primary/90 hover:bg-primary active:bg-primary/80 transition-colors"
          onClick={() => (window as any).gtag?.('event', 'click_phone', { event_category: 'lead', event_label: 'mobile_sticky_bar' })}
        >
          📞 Call Store
        </a>
      </div>
    </div>
  );
}
