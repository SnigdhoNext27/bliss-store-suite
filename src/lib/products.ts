import product1 from '@/assets/product-1.jpg';
import product2 from '@/assets/product-2.jpg';
import product3 from '@/assets/product-3.jpg';
import product4 from '@/assets/product-4.jpg';
import product5 from '@/assets/product-5.jpg';
import product6 from '@/assets/product-6.jpg';
import { Product } from './store';

export const products: Product[] = [
  {
    id: '1',
    name: 'The Meridian Shirt',
    price: 78.00,
    category: 'T-SHIRT',
    description: 'Premium cotton blend with modern fit',
    images: [product1],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 24,
    badge: 'new',
  },
  {
    id: '2',
    name: 'Almans Slim Chino',
    price: 95.00,
    category: 'T-SHIRT',
    description: 'Soft breathable fabric for everyday comfort',
    images: [product2],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 18,
  },
  {
    id: '3',
    name: 'Almans Studio Sweater',
    price: 85.00,
    category: 'Seasonal',
    description: 'Cozy hoodie perfect for layering',
    images: [product3],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 12,
    badge: 'new',
  },
  {
    id: '4',
    name: 'Ember Knit Sweater',
    price: 95.00,
    category: 'Seasonal',
    description: 'Warm knit sweater with ribbed texture',
    images: [product4],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 8,
    badge: 'limited',
  },
  {
    id: '5',
    name: 'Almans Everyday Shirt',
    price: 65.00,
    category: 'T-SHIRT',
    description: 'Classic polo with contrast collar',
    images: [product5],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 30,
  },
  {
    id: '6',
    name: 'Almans Daily Crewneck',
    price: 104.00,
    category: 'T-SHIRT',
    description: 'Long sleeve essential for cooler days',
    images: [product6],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 15,
    badge: 'new',
  },
];
