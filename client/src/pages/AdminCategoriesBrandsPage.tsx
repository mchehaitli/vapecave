import { useEffect } from "react";
import { useLocation } from "wouter";
import { CategoryBrandManagement } from "@/components/CategoryBrandManagement";

export default function AdminCategoriesBrandsPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check', { credentials: 'include' });
        if (!res.ok) {
          setLocation('/admin/login');
        }
      } catch {
        setLocation('/admin/login');
      }
    };
    checkAuth();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Categories & Brands Management</h1>
          <a 
            href="/admin" 
            className="text-orange-500 hover:text-orange-400 transition-colors"
          >
            ← Back to Admin Dashboard
          </a>
        </div>
        <CategoryBrandManagement />
      </div>
    </div>
  );
}
