import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Users, Award, Heart, Star, Clock } from 'lucide-react';
import { Header } from '@/components/Header';
import { useRestaurant } from '@/contexts/RestaurantContext';


const About = () => {
  const { currentRestaurant } = useRestaurant();
  const restaurantName = currentRestaurant?.name ?? '';

  return (
    <div className="flex-1 bg-background">
      <Header />
      
      {/* Hero Section */}
      <motion.section 
        className="relative min-h-[60vh] flex items-center justify-center overflow-hidden px-3 sm:px-4 py-16 sm:py-20"
        style={{ paddingTop: 'calc(6rem + 60px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-accent/10 via-background to-primary/5" />
        
        <motion.div 
          className="relative z-10 text-center px-2 sm:px-4 max-w-4xl mx-auto"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.div
            className="mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-accent animate-float" />
          </motion.div>
          
          <motion.h1
            className="display-text text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-primary-foreground"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            About {restaurantName}
          </motion.h1>
          
          <motion.p 
            className="body-text text-lg sm:text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Where tradition meets innovation, and every meal tells a story of passion, 
            craftsmanship, and the authentic flavors of Italy.
          </motion.p>
        </motion.div>
      </motion.section>

      {/* Craft Story Section */}
      <motion.section 
        className="py-20 sm:py-32 px-3 sm:px-4 md:px-6 bg-gradient-to-br from-background to-accent/5"
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto max-w-4xl">
          <motion.div 
            className="grid md:grid-cols-2 gap-12 md:gap-16 items-center"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              <h2 className="display-text text-3xl sm:text-4xl md:text-5xl font-light text-primary-foreground leading-tight">
                The art of
                <span className="block font-bold text-accent"> digital gastronomy.</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p className="text-lg">
                  Each visualization is crafted with meticulous attention to detail. 
                  We don't just display food—we capture its essence, its story, its soul.
                </p>
                <p>
                  Our technology transforms the ancient art of hospitality into a modern experience 
                  that bridges the physical and digital worlds. Every rotation, every zoom, 
                  every interaction is designed to make mouths water and hearts race.
                </p>
                <p className="italic">
                  "Technology in service of tradition, innovation in service of appetite."
                </p>
              </div>
            </div>
            
            <motion.div 
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="aspect-square bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center mb-6">
                    <ChefHat className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary-foreground">Digital Craft</h3>
                  <p className="text-muted-foreground">
                    Where culinary art meets cutting-edge technology
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">100%</div>
                      <div className="text-xs text-muted-foreground">Authentic</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">Interactive</div>
                      <div className="text-xs text-muted-foreground">Interactive</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Our Story Section */}
      <motion.section 
        className="py-20 px-3 sm:px-4 md:px-6"
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h2 className="display-text text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Our Story
            </h2>
            <p className="body-text text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Born from a passion for authentic Italian cuisine and a vision for the future of dining experiences.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <motion.div 
              className="space-y-6"
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-primary-foreground">Tradition & Innovation</h3>
              <p className="text-muted-foreground leading-relaxed">
                {restaurantName} was founded with a simple yet ambitious vision: to honor the rich culinary traditions
                of Italy while embracing the possibilities of modern technology. Our journey began in the heart
                of Rome, where our founder, Chef Alessandro Marino, discovered the perfect harmony between
                time-honored recipes and contemporary presentation.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, we're pioneering a new era of dining where every dish tells its story through immersive 
                Interactive experiences, allowing our guests to explore the artistry behind each creation before 
                their first bite.
              </p>
            </motion.div>
            
            <motion.div 
              className="relative"
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="aspect-video bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Heart className="w-12 h-12 mx-auto text-accent" />
                  <h4 className="text-xl font-bold text-primary-foreground">Crafted with Love</h4>
                  <p className="text-muted-foreground text-sm">
                    Every dish, every experience, every moment
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Values Section */}
      <motion.section 
        className="py-20 px-3 sm:px-4 md:px-6 bg-gradient-to-br from-background to-accent/5"
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h2 className="display-text text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Our Values
            </h2>
            <p className="body-text text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(() => {
              const valueIcons = [ChefHat, Users, Award, Heart, Star, Clock];
              const VALUES = [
                { title: 'Authenticity', description: 'Staying true to our roots.' },
                { title: 'Innovation', description: 'Embracing the future.' },
                { title: 'Quality', description: 'Only the best ingredients.' }
              ];
              return VALUES.map((value, index) => {
                const Icon = valueIcons[index % valueIcons.length];
                return (
                  <motion.div
                    key={value.title}
                    className="text-center p-6 rounded-2xl bg-background/50 backdrop-blur-sm border border-accent/10 hover:border-accent/20 transition-colors"
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-12 h-12 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-primary-foreground mb-3">{value.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section 
        className="py-20 px-3 sm:px-4 md:px-6"
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h2 className="display-text text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Meet Our Team
            </h2>
            <p className="body-text text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              The passionate professionals behind every exceptional experience
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Chef Alessandro Marino', role: 'Executive Chef', description: 'Master of Italian flavors.' },
              { name: 'Sophia Rossi', role: 'Restaurant Manager', description: 'Ensuring perfect dining experiences.' }
            ].map((member, index) => (
              <motion.div
                key={member.name}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/10"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center">
                  <ChefHat className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-primary-foreground mb-2">{member.name}</h3>
                <p className="text-accent font-medium mb-3">{member.role}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default About;
