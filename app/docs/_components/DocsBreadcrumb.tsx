import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb { label: string; href?: string }

const APP_URL = "https://supportcraft.aakasa.dev";

export function DocsBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",          item: `${APP_URL}/`     },
      { "@type": "ListItem", position: 2, name: "Documentation", item: `${APP_URL}/docs` },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: 3 + i,
        name: c.label,
        ...(c.href ? { item: `${APP_URL}${c.href}` } : {}),
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/"     className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight size={11} />
        <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight size={11} />
            {c.href
              ? <Link href={c.href} className="hover:text-foreground transition-colors">{c.label}</Link>
              : <span className="text-foreground font-medium">{c.label}</span>
            }
          </span>
        ))}
      </nav>
    </>
  );
}
