// Backend API service - now uses the centralized API service
// This file maintains backward compatibility while using the new API structure

import { reviewApi } from './apiService';

export interface ReviewSubmissionData {
  rating: number;
  comment: string;
  customerName: string;
  customerEmail?: string;
  placeId: string;
}

// Submit review to Google via backend
export const submitReviewToGoogle = async (
  reviewData: ReviewSubmissionData,
  restaurantId: string
): Promise<boolean> => {
  try {
    await reviewApi.submitGoogleReview(restaurantId, reviewData);
    return true;
  } catch (error) {
    console.error('Error submitting review to Google:', error);
    return false;
  }
};
