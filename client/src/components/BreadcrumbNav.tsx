import React from 'react';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';

export interface BreadcrumbItem {
  name: string;
  path: string;
  isLast?: boolean;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items }) => {
  // Create structured data for breadcrumbs (BreadcrumbList schema)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://vapecavetx.com${item.path}`
    }))
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <nav aria-label="Breadcrumb" className="pb-2 mb-2 text-sm">
        <ol className="flex items-center space-x-1">
          {items.map((item, index) => (
            <li key={item.path} className="flex items-center">
              {index > 0 && <span className="mx-1 text-gray-400">/</span>}
              {item.isLast ? (
                <span aria-current="page" className="text-primary-600 font-medium">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path}>
                  <a className="text-gray-500 hover:text-primary-600 hover:underline">
                    {item.name}
                  </a>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default BreadcrumbNav;