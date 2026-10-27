import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Clock, Instagram, Facebook, Twitter } from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';


export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { currentRestaurant } = useRestaurant();
  const restaurantName = currentRestaurant?.name ?? '';
  const restaurantDescription = currentRestaurant?.description ?? 'Authentic Italian cuisine with modern culinary innovation. Experience passion, tradition, and exceptional ingredients.';

  return (
    <motion.footer 
      className="bg-gradient-to-br from-primary/95 to-secondary/95 backdrop-blur-sm border-t border-accent/20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-12">
            {/* Restaurant Info */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-accent-foreground" />
                </div>
                <h3 className="display-text text-xl font-bold text-primary-foreground">
                  {restaurantName}
                </h3>
              </div>
              <p className="body-text text-sm text-muted-foreground leading-relaxed">
                {restaurantDescription}
              </p>
              {/* Social Media */}
              <div className="flex gap-3 pt-2">
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-full border border-accent/30 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors duration-200"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-full border border-accent/30 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors duration-200"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-full border border-accent/30 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors duration-200"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </motion.div>

            {/* Opening Hours */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h4 className="display-text text-base font-semibold text-primary-foreground mb-4">
                Opening Hours
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="space-y-1.5">
                    {[
                      { days: 'Monday - Thursday', hours: '11:00 AM - 10:00 PM' },
                      { days: 'Friday - Saturday', hours: '11:00 AM - 11:00 PM' },
                      { days: 'Sunday', hours: '12:00 PM - 9:00 PM' }
                    ].map((slot) => (
                      <p key={slot.days} className="body-text text-sm text-muted-foreground">
                        <span className="font-medium text-primary-foreground">{slot.days}:</span> {slot.hours}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <motion.div 
            className="border-t border-accent/20 pt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="body-text text-sm text-muted-foreground text-center sm:text-left">
                © {currentYear} {restaurantName}. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a 
                  href="/privacy" 
                  className="body-text text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  Privacy Policy
                </a>
                <a 
                  href="/terms" 
                  className="body-text text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
};
