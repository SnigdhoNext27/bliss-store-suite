import { motion } from 'framer-motion';
import collection1 from '@/assets/collection-1.jpg';
import collection2 from '@/assets/collection-2.jpg';
import collection3 from '@/assets/collection-3.jpg';

const collections = [
  {
    id: 1,
    name: 'Frost Merino Sweater',
    description: 'Premium merino knit that regulates warmth while staying breathable.',
    image: collection1,
    size: 'large',
  },
  {
    id: 2,
    name: 'Sierra Puffer Jacket',
    description: 'A tailored longline wool coat with a clean silhouette, made for modern city winters.',
    image: collection2,
    size: 'small',
  },
  {
    id: 3,
    name: 'Atlas Wool Coat',
    description: 'A tailored longline wool coat with a clean silhouette, made for modern day.',
    image: collection3,
    size: 'small',
  },
];

export function CollectionSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
              Autumn / Winter
            </h2>
            <h3 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              collection 2026
            </h3>
          </div>
          <p className="text-muted-foreground max-w-sm">
            The Almans Autumn & Winter Collection brings together warm textures, durable fabrics, and
            minimalist silhouettes designed for the colder...
          </p>
        </motion.div>

        {/* Collection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Large Feature Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative aspect-[4/3] md:row-span-2 overflow-hidden rounded-3xl group"
          >
            <img
              src={collections[0].image}
              alt={collections[0].name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-almans-chocolate/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-display text-2xl md:text-3xl font-bold text-almans-cream mb-2">
                {collections[0].name}
              </h3>
              <p className="text-almans-cream/80 text-sm">
                {collections[0].description}
              </p>
            </div>
          </motion.div>

          {/* Small Cards */}
          {collections.slice(1).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (index + 1) * 0.1 }}
              className="relative aspect-[4/3] overflow-hidden rounded-3xl group"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-almans-chocolate/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="font-display text-xl md:text-2xl font-bold text-almans-cream mb-2">
                  {item.name}
                </h3>
                <p className="text-almans-cream/80 text-sm line-clamp-2">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
