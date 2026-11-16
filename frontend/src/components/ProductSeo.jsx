import { useEffect } from 'react';

const DEFAULT_TITLE = 'MILASTY — Where Millets Meet Great Taste | Organic Millet Bakery';
const DEFAULT_DESC = 'Tasty snacks that happen to be healthy. Millet-based cookies slow-baked in pure Desi Ghee & sweetened with unrefined Jaggery. Zero maida, palm oil, or preservatives.';

const setMetaTag = (attrName, attrValue, content) => {
  if (!content) return;
  let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const setLinkTag = (rel, href) => {
  if (!href) return;
  let tag = document.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
};

export default function ProductSeo({ product }) {
  useEffect(() => {
    if (!product) return;

    // 1. Resolve Title
    const customTitle = (product.meta_title || product.metaTitle || '').trim();
    const finalTitle = customTitle || (product.title ? `${product.title} | MILASTY` : DEFAULT_TITLE);
    document.title = finalTitle;

    // 2. Resolve Description
    const customDesc = (product.meta_description || product.metaDescription || '').trim();
    const fallbackDesc = product.subtitle || product.description || DEFAULT_DESC;
    const cleanDesc = (customDesc || fallbackDesc).replace(/<[^>]*>?/gm, '').trim();
    setMetaTag('name', 'description', cleanDesc);

    // 3. Resolve Canonical URL
    const slug = product.seo_slug || product.seoSlug || product.slug || product.id || '';
    const canonicalUrl = `${window.location.origin}/product/${slug}`;
    setLinkTag('canonical', canonicalUrl);

    // 4. Open Graph Metadata
    const productImg = product.image || product.image_url || '';
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', cleanDesc);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', 'product');
    setMetaTag('property', 'og:site_name', 'MILASTY');
    if (productImg) {
      setMetaTag('property', 'og:image', productImg);
    }

    // 5. Twitter Card Metadata
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', cleanDesc);
    if (productImg) {
      setMetaTag('name', 'twitter:image', productImg);
    }

    // 6. JSON-LD Structured Data
    const priceVal = Number(product.price || product.startingPrice || (product.variants?.[0]?.price) || 0);
    const hasStock = product.stock > 0 || (Array.isArray(product.variants) && product.variants.some((v) => Number(v.stock || 0) > 0 || v.inStock));

    const schemaData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.title || finalTitle,
      image: productImg ? [productImg] : [],
      description: cleanDesc,
      sku: product.sku || `MLS-${slug}`,
      brand: {
        '@type': 'Brand',
        name: 'MILASTY',
      },
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'INR',
        price: priceVal,
        availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    };

    const ratingVal = Number(product.rating || 0);
    const reviewCountVal = Number(product.reviewCount || product.review_count || 0);
    if (ratingVal > 0) {
      schemaData.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: ratingVal,
        reviewCount: Math.max(1, reviewCountVal),
      };
    }

    let scriptTag = document.getElementById('product-schema-jsonld');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'product-schema-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schemaData);

    // Cleanup when unmounting or switching product
    return () => {
      document.title = DEFAULT_TITLE;
      setMetaTag('name', 'description', DEFAULT_DESC);
      const script = document.getElementById('product-schema-jsonld');
      if (script) script.remove();
    };
  }, [product]);

  return null;
}

