import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { X, Star, Send } from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentRestaurant } = useRestaurant();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitToGoogle, setSubmitToGoogle] = useState(false);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, onClose]);

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit to our internal system
      const reviewData = {
        type: 'restaurant',
        rating,
        review: reviewText,
        customerName,
        customerEmail,
        timestamp: new Date().toISOString(),
        submittedToGoogle: submitToGoogle
      };

      console.log('Submitting review:', reviewData);
      
      // Simulate API call to our backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If user wants to submit to Google, call backend API
      if (submitToGoogle) {
        try {
          const { reviewApi } = await import('@/services/apiService');
          const placeId = import.meta.env.VITE_GOOGLE_PLACE_ID || '';
          // Note: restaurantId should be passed as prop or from context
          // For now, using a placeholder - update this based on your app structure
          const restaurantId = currentRestaurant?.id || '';
          await reviewApi.submitGoogleReview(restaurantId, {
            rating,
            comment: reviewText,
            customerName,
            customerEmail,
            placeId
          });
        } catch (error) {
          console.error('Error submitting to Google:', error);
        }
      }
      
      toast.success('Thank you for your feedback! Your review has been submitted.' +
        (submitToGoogle ? ' It will also be posted to Google Reviews.' : ''));
      
      // Reset form
      setRating(0);
      setReviewText('');
      setCustomerName('');
      setCustomerEmail('');
      setSubmitToGoogle(false);
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
      setIsSubmitting(false);
    }
  };


  const StarRating = () => (
    <div className="flex gap-2 sm:gap-3">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded-full p-1"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`h-7 w-7 sm:h-9 sm:w-9 transition-all duration-200 ${
              star <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400 scale-110'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-lg my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-white shadow-2xl border border-gray-200/50 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Share Your Feedback
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-1">{currentRestaurant?.name || 'Restaurant'}</p>
          </CardHeader>

          <CardContent className="bg-white p-5 sm:p-6 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* Rating */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  Rating <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <StarRating />
                  {rating > 0 && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full inline-block"
                    >
                      {rating === 1 && '😞 Poor'}
                      {rating === 2 && '😐 Fair'}
                      {rating === 3 && '🙂 Good'}
                      {rating === 4 && '😊 Very Good'}
                      {rating === 5 && '😍 Excellent'}
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <Label htmlFor="review" className="text-base font-semibold text-gray-900">
                  Your Review
                </Label>
                <Textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setReviewText(e.target.value);
                    }
                  }}
                  placeholder={`Tell us about your experience at ${currentRestaurant?.name || 'our restaurant'}... What did you like? What could be improved?`}
                  rows={5}
                  className="resize-none text-base focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
                  required
                  maxLength={500}
                />
                <p className={`text-xs ${reviewText.length > 450 ? 'text-orange-500' : 'text-gray-500'}`}>
                  {reviewText.length} / 500 characters
                </p>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    Your Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="text-base focus:ring-2 focus:ring-yellow-400 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-semibold text-gray-900">
                    Email <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="text-base focus:ring-2 focus:ring-yellow-400 transition-all"
                  />
                </div>
              </div>

              {/* Google Reviews Integration */}
              <div className="space-y-3 p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <img 
                      src="https://www.google.com/favicon.ico" 
                      alt="Google" 
                      className="w-5 h-5"
                    />
                  </div>
                  <span className="font-semibold text-blue-900 text-base">Google Reviews Integration</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="google-reviews"
                      checked={submitToGoogle}
                      onCheckedChange={(checked) => setSubmitToGoogle(checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="google-reviews" className="text-sm font-medium text-gray-700 cursor-pointer leading-relaxed">
                      Also post this review to Google Reviews
                    </Label>
                  </div>
                  
                  <p className="text-xs text-gray-600 pl-8 leading-relaxed">
                    When enabled, your review will be submitted to both our website and Google Reviews.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-11 text-base font-medium border-2 hover:bg-gray-50 transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 text-base font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                  disabled={rating === 0 || !reviewText.trim() || !customerName.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="h-4 w-4" />
                      Submit Review
                    </span>
                  )}
                </Button>
              </div>
            </form>

            {/* Review Guidelines */}
            <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200/50">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600">📝</span>
                Review Guidelines
              </h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Be honest and constructive in your feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Focus on your personal experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Respect others and avoid offensive language</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Reviews are public and help other customers make decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Google Reviews will be posted publicly on Google</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};