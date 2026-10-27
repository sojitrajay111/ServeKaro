import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Users, Award, ThumbsUp, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewModal } from './ReviewModal';

import { useRestaurant } from '@/contexts/RestaurantContext';

export const RestaurantReviewSection: React.FC = () => {
  const { currentRestaurant } = useRestaurant();
  const restaurantName = currentRestaurant?.name || 'our restaurant';
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [googleReviews, setGoogleReviews] = useState<any[]>([]);
  const [isLoadingGoogleReviews, setIsLoadingGoogleReviews] = useState(false);
  const [showGoogleReviews, setShowGoogleReviews] = useState(false);

  const fallbackReviews: any[] = [];
  const REVIEW_STATS = { averageRating: 5.0, totalReviews: 0 };

  // Load Google Reviews on component mount
  useEffect(() => {
    loadGoogleReviews();
  }, []);

  const loadGoogleReviews = async () => {
    setIsLoadingGoogleReviews(true);
    try {
      const { reviewApi } = await import('@/services/apiService');
      // Note: restaurantId should be passed as prop or from context
      // For now, using a placeholder - update this based on your app structure
      const restaurantId = currentRestaurant?.id || 'restaurant-001';
      const reviews = await reviewApi.getGoogleReviews(restaurantId);
      setGoogleReviews(reviews || []);
    } catch (error) {
      console.error('Failed to load Google reviews:', error);
    } finally {
      setIsLoadingGoogleReviews(false);
    }
  };

  // Get current reviews (Google or fallback)
  const getCurrentReviews = () => {
    if (showGoogleReviews && googleReviews.length > 0) {
      return googleReviews.map((review: any) => ({
        id: review.id,
        customerName: review.customerName || review.reviewer?.displayName || 'Anonymous',
        rating: review.rating || 5,
        review: review.comment || review.text || '',
        date: new Date(review.createTime || review.date).toLocaleDateString(),
        verified: review.verified || !review.reviewer?.isAnonymous,
        source: 'google'
      }));
    }
    return fallbackReviews;
  };

  // Get current rating info
  const getCurrentRatingInfo = () => {
    if (showGoogleReviews && googleReviews.length > 0) {
      const avgRating = googleReviews.reduce((sum, review) => sum + (review.rating || 5), 0) / googleReviews.length;
      return {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: googleReviews.length
      };
    }
    return REVIEW_STATS;
  };

  const currentReviews = getCurrentReviews();
  const { averageRating, totalReviews } = getCurrentRatingInfo();
  
  // Calculate rating distribution from current reviews
  const ratingDistribution = {
    5: currentReviews.filter(r => r.rating === 5).length,
    4: currentReviews.filter(r => r.rating === 4).length,
    3: currentReviews.filter(r => r.rating === 3).length,
    2: currentReviews.filter(r => r.rating === 2).length,
    1: currentReviews.filter(r => r.rating === 1).length
  };

  const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="py-16 bg-gradient-to-br from-background via-background/95 to-accent/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="display-text text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            What Our Customers Say
          </h2>
          <p className="body-text text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Real reviews from our valued customers about their dining experience at {restaurantName}
          </p>
          
          {/* Google Reviews Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={!showGoogleReviews ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGoogleReviews(false)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Our Reviews
            </Button>
            <Button
              variant={showGoogleReviews ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGoogleReviews(true)}
              disabled={googleReviews.length === 0}
              className="flex items-center gap-2"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              Google Reviews
              {isLoadingGoogleReviews && <RefreshCw className="w-4 h-4 animate-spin" />}
            </Button>
          </div>
        </motion.div>

        {/* Rating Overview */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-r from-background to-accent/5 border-accent/20">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Overall Rating */}
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                    <div className="text-6xl font-bold text-accent">{averageRating}</div>
                    <div>
                      <StarRating rating={5} size="lg" />
                      <p className="text-muted-foreground mt-2">{totalReviews} reviews</p>
                    </div>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Based on {totalReviews} customer reviews
                  </p>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-8">{rating}</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${totalReviews > 0 ? (ratingDistribution[rating as keyof typeof ratingDistribution] / totalReviews) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">
                        {ratingDistribution[rating as keyof typeof ratingDistribution]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Customer Reviews */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                          {review.source === 'google' ? (
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                          ) : (
                            <Users className="w-5 h-5 text-accent" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-primary-foreground">
                            {review.customerName}
                            {review.verified && (
                              <Award className="w-4 h-4 text-blue-500 inline ml-1" />
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      "{review.review}"
                    </p>
                    {review.source === 'google' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3 h-3" />
                          <span>Posted on Google Reviews</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* Google Reviews Link */}
          {showGoogleReviews && googleReviews.length > 0 && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantName + ' Restaurant')}`, '_blank')}
                className="flex items-center gap-2 mx-auto"
              >
                <ExternalLink className="w-4 h-4" />
                View All Reviews on Google
              </Button>
            </div>
          )}
        </motion.div>

        {/* Write Review CTA */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <MessageSquare className="w-8 h-8 text-accent" />
                <h3 className="text-2xl font-bold text-primary-foreground">
                  Share Your Experience
                </h3>
              </div>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Help others discover the amazing dining experience at {restaurantName} by sharing your review.
              </p>
              <Button
                onClick={() => setIsReviewModalOpen(true)}
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <ThumbsUp className="w-5 h-5 mr-2" />
                Write a Review
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Review Modal */}
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
        />
      </div>
    </div>
  );
};
