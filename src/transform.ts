
export interface Product {
  id: number;
  title: string;
  vendor: string;
  price: number;
  inventory: number;
  description: string;
  tags: string[];
}

export interface ProcessedProduct extends Product {
  seoTitle: string;
  inStock: boolean;
}

export interface Product {
  id: number;
  title: string;
  vendor: string;
  price: number;
  inventory: number;
  description: string;
  tags: string[];
}

export interface ProcessedProduct extends Product {
  seoTitle: string;
  inStock: boolean;
}

export function transformProduct(
  product: Product
): ProcessedProduct {
  return {
    ...product,
    price: Number((product.price * 1.1).toFixed(2)),
    seoTitle: `${product.title} | ${product.vendor} | Shopify`,
    inStock: product.inventory > 0
  };
}
