import { motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { products } from '@/lib/products';

export function ProductsSection() {
  return (
    <section id="products" className="py-20 bg-background">
      <div className="container px-4 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-wide">
            NEW ARRIVALS
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Fresh takes on classics: breathable shirts, tailored trousers, and lightweight
            outerwear in season-neutral colors
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
