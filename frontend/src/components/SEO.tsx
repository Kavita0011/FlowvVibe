import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
}

export default function SEO({
  title,
  description = 'Build AI chatbots without coding. Visual flow builder, multi-channel deployment, one-time pricing.',
  keywords = ['AI chatbot', 'no-code chatbot', 'visual builder', 'WhatsApp bot', 'customer support automation'],
  image = '/og-image.png',
  url,
}: SEOProps) {
  const fullTitle = title.includes('FlowvVibe') ? title : `${title} | FlowvVibe`;
  const siteUrl = import.meta.env.VITE_APP_URL || 'https://flowvibe.com';
  const canonicalUrl = url ? `${siteUrl}${url}` : siteUrl;

  useEffect(() => {
    document.title = fullTitle;

    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateMeta('description', description);
    updateMeta('keywords', keywords.join(', '));

    document.querySelector('link[rel="canonical"]')?.remove();
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = canonicalUrl;
    document.head.appendChild(canonical);

    ['og:title', 'og:description', 'og:type', 'og:url'].forEach(prop => {
      const meta = document.querySelector(`meta[property="${prop}"]`);
      meta?.remove();
    });

    const ogMeta = [
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: `${siteUrl}${image}` },
      { property: 'og:site_name', content: 'FlowvVibe' },
    ];

    ogMeta.forEach(({ property, content }) => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', property);
      meta.content = content;
      document.head.appendChild(meta);
    });

    ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'].forEach(name => {
      const meta = document.querySelector(`meta[name="${name}"]`);
      meta?.remove();
    });

    const twitterMeta = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: `${siteUrl}${image}` },
    ];

    twitterMeta.forEach(({ name, content }) => {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    });
  }, [title, description, keywords, image, url, fullTitle, canonicalUrl]);

  return null;
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title.includes('FlowvVibe') ? title : `${title} | FlowvVibe`;
  }, [title]);
}