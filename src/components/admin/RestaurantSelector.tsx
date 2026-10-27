import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Building2 } from 'lucide-react';

interface RestaurantSelectorProps {
  className?: string;
}

export const RestaurantSelector: React.FC<RestaurantSelectorProps> = ({ className }) => {
  const { currentRestaurant, restaurants, loadRestaurantBySlug } = useRestaurant();

  const handleRestaurantChange = (restaurantSlug: string) => {
    loadRestaurantBySlug(restaurantSlug);
  };

  if (restaurants.length <= 1) {
    return null; // Don't show selector if only one restaurant
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <Select value={currentRestaurant?.slug || ''} onValueChange={handleRestaurantChange}>
        <SelectTrigger className="w-full min-w-0">
          <SelectValue placeholder="Select restaurant" />
        </SelectTrigger>
        <SelectContent>
          {restaurants.map((restaurant) => (
            <SelectItem key={restaurant.id} value={restaurant.slug}>
              <div className="flex items-center gap-2 w-full">
                <div className="w-6 h-6 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="truncate">{restaurant.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
