import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AdminCategoriesBrandsPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation('/admin');
  }, [setLocation]);

  return null;
}
