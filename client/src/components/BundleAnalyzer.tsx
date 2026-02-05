import { useEffect, useState } from 'react';

interface BundleInfo {
  totalSize: number;
  loadTime: number;
  components: number;
  chunks: string[];
}

// Development-only bundle analyzer component
const BundleAnalyzer = () => {
  const [bundleInfo, setBundleInfo] = useState<BundleInfo | null>(null);
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const analyzeBundleSize = () => {
      const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
      const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
      
      const totalScripts = scripts.length;
      const totalStylesheets = stylesheets.length;
      
      // Estimate bundle size based on network requests
      const performanceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsEntries = performanceEntries.filter(entry => entry.name.includes('.js'));
      const cssEntries = performanceEntries.filter(entry => entry.name.includes('.css'));
      
      const totalSize = jsEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) + 
                       cssEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
      
      const loadTime = Math.max(...performanceEntries.map(entry => entry.responseEnd - entry.startTime));

      setBundleInfo({
        totalSize,
        loadTime,
        components: totalScripts + totalStylesheets,
        chunks: jsEntries.map(entry => entry.name.split('/').pop() || 'unknown')
      });
    };

    // Run analysis after page load
    setTimeout(analyzeBundleSize, 2000);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !bundleInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setShowAnalyzer(!showAnalyzer)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Bundle: {(bundleInfo.totalSize / 1024).toFixed(1)}KB
      </button>
      
      {showAnalyzer && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Bundle Analysis</h3>
            <button 
              onClick={() => setShowAnalyzer(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Size:</span>
              <span className="font-medium">{(bundleInfo.totalSize / 1024).toFixed(1)}KB</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Load Time:</span>
              <span className="font-medium">{bundleInfo.loadTime.toFixed(0)}ms</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Components:</span>
              <span className="font-medium">{bundleInfo.components}</span>
            </div>
            
            <div>
              <div className="text-gray-600 mb-2">Chunks:</div>
              <div className="max-h-32 overflow-y-auto text-xs bg-gray-50 p-2 rounded">
                {bundleInfo.chunks.slice(0, 10).map((chunk, index) => (
                  <div key={index} className="truncate">{chunk}</div>
                ))}
                {bundleInfo.chunks.length > 10 && (
                  <div className="text-gray-500">... and {bundleInfo.chunks.length - 10} more</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BundleAnalyzer;