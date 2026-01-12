// Curated luxury product images from Unsplash
// Japanese minimal aesthetic - clean, elevated, intentional

export const SAMPLE_PRODUCT_IMAGES = {
  // Men's Clothing
  shirts: [
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80", // White shirt
    "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80", // Oxford shirt
    "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80", // Linen shirt
    "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=800&q=80", // Striped shirt
  ],
  pants: [
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80", // Chinos
    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80", // Trousers
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80", // Jeans
  ],
  blazers: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", // Navy blazer
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80", // Linen blazer
  ],
  // Women's Clothing
  dresses: [
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80", // Summer dress
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80", // Elegant dress
    "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80", // Minimal dress
  ],
  tops: [
    "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&q=80", // Blouse
    "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80", // Knit top
  ],
  // Accessories
  bags: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80", // Leather bag
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80", // Tote bag
  ],
  watches: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80", // Minimal watch
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80", // Classic watch
  ],
  // Footwear
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80", // Sneakers
    "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=800&q=80", // Loafers
    "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80", // Boots
  ],
} as const

// Hero carousel slides - lifestyle imagery
export const HERO_SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
    title: "Curated for the",
    subtitle: "Modern Lifestyle",
    description: "Discover our collection of premium essentials. Timeless design meets exceptional quality.",
    cta: { text: "Shop Collection", href: "/products" },
    align: "center" as const,
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    title: "New Season",
    subtitle: "Arrivals",
    description: "Explore the latest additions to our carefully curated selection of luxury essentials.",
    cta: { text: "Explore New", href: "/products?sort=newest" },
    align: "left" as const,
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80",
    title: "Timeless",
    subtitle: "Elegance",
    description: "Pieces designed to transcend seasons. Investment pieces for the discerning wardrobe.",
    cta: { text: "Shop Women", href: "/categories/womens-clothing" },
    align: "right" as const,
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1600&q=80",
    title: "Refined",
    subtitle: "Menswear",
    description: "Sophisticated essentials crafted with precision. Elevate your everyday.",
    cta: { text: "Shop Men", href: "/categories/mens-clothing" },
    align: "left" as const,
  },
]

// Category images
export const CATEGORY_IMAGES = {
  "mens-clothing": "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
  "womens-clothing": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
  "accessories": "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&q=80",
  "footwear": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80",
  "new-arrivals": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
} as const

// Simple hash function for deterministic selection
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Get a sample image based on product name/category (deterministic)
export function getSampleProductImage(name: string, categorySlug?: string): string {
  const nameLower = name.toLowerCase()
  const hash = hashString(name)

  if (nameLower.includes("shirt") || nameLower.includes("oxford")) {
    return SAMPLE_PRODUCT_IMAGES.shirts[hash % SAMPLE_PRODUCT_IMAGES.shirts.length]
  }
  if (nameLower.includes("chino") || nameLower.includes("pant") || nameLower.includes("trouser")) {
    return SAMPLE_PRODUCT_IMAGES.pants[hash % SAMPLE_PRODUCT_IMAGES.pants.length]
  }
  if (nameLower.includes("blazer") || nameLower.includes("jacket") || nameLower.includes("coat")) {
    return SAMPLE_PRODUCT_IMAGES.blazers[hash % SAMPLE_PRODUCT_IMAGES.blazers.length]
  }
  if (nameLower.includes("dress")) {
    return SAMPLE_PRODUCT_IMAGES.dresses[hash % SAMPLE_PRODUCT_IMAGES.dresses.length]
  }
  if (nameLower.includes("bag") || nameLower.includes("tote") || nameLower.includes("crossbody")) {
    return SAMPLE_PRODUCT_IMAGES.bags[hash % SAMPLE_PRODUCT_IMAGES.bags.length]
  }
  if (nameLower.includes("watch")) {
    return SAMPLE_PRODUCT_IMAGES.watches[hash % SAMPLE_PRODUCT_IMAGES.watches.length]
  }
  if (nameLower.includes("shoe") || nameLower.includes("sneaker") || nameLower.includes("loafer") || nameLower.includes("boot")) {
    return SAMPLE_PRODUCT_IMAGES.shoes[hash % SAMPLE_PRODUCT_IMAGES.shoes.length]
  }
  if (nameLower.includes("scarf") || nameLower.includes("silk")) {
    return SAMPLE_PRODUCT_IMAGES.bags[0] // Use accessory image
  }
  if (nameLower.includes("top") || nameLower.includes("blouse")) {
    return SAMPLE_PRODUCT_IMAGES.tops[hash % SAMPLE_PRODUCT_IMAGES.tops.length]
  }

  // Fallback based on category
  if (categorySlug?.includes("women")) {
    return SAMPLE_PRODUCT_IMAGES.dresses[hash % SAMPLE_PRODUCT_IMAGES.dresses.length]
  }
  if (categorySlug?.includes("men")) {
    return SAMPLE_PRODUCT_IMAGES.shirts[hash % SAMPLE_PRODUCT_IMAGES.shirts.length]
  }
  if (categorySlug?.includes("accessor")) {
    return SAMPLE_PRODUCT_IMAGES.bags[hash % SAMPLE_PRODUCT_IMAGES.bags.length]
  }
  if (categorySlug?.includes("foot")) {
    return SAMPLE_PRODUCT_IMAGES.shoes[hash % SAMPLE_PRODUCT_IMAGES.shoes.length]
  }

  // Ultimate fallback - use hash to pick any image
  const allImages = [
    ...SAMPLE_PRODUCT_IMAGES.shirts,
    ...SAMPLE_PRODUCT_IMAGES.dresses,
    ...SAMPLE_PRODUCT_IMAGES.bags,
  ]
  return allImages[hash % allImages.length]
}
