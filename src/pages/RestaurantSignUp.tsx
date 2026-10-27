import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle, 
  Upload, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  ChefHat,
  Star,
  Users,
  Clock,
  Shield
} from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { authApi } from '@/services/apiService';

const RestaurantSignUp = () => {
  const navigate = useNavigate();
  const { addRestaurant } = useRestaurant();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    description: '',
    cuisine: '',
    priceRange: '' as 'budget' | 'moderate' | 'expensive' | 'luxury' | '',
    phone: '',
    email: '',
    website: '',
    
    // Address
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    
    // Branding
    logo: '',
    coverImage: '',
    
    // Settings
    allowOnlineOrdering: true,
    requireCustomerInfo: false,
    showNutritionalInfo: false,
    enableReviews: true,
    enableWaitlist: false,
    orderPreparationTime: 20,
    minimumOrderAmount: 10.00,
    deliveryFee: 0,
    serviceFee: 0,
    taxRate: 8.75,
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'en'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Tell us about your restaurant' },
    { number: 2, title: 'Location & Contact', description: 'Where can customers find you?' },
    { number: 3, title: 'Review', description: 'Review and create your account' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Restaurant name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        break;
      case 2:
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
        break;
      case 3:
        // Review step has no manual validation
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsLoading(true);
    
    try {
      // 1. Call the backend POST /api/Auth/signup endpoint
      await authApi.register({
        name: formData.name,
        email: formData.email,
        password: 'password123',
        restaurantName: formData.name
      });

      // 2. Create the restaurant locally in application context
      const restaurant = addRestaurant({
        name: formData.name,
        description: formData.description,
        cuisine: 'International',
        priceRange: 'moderate',
        phone: formData.phone,
        email: formData.email,
        website: '',
        address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`,
        logo: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=100&h=100&fit=crop&crop=center',
        coverImage: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1920&h=1080&fit=crop&crop=center',
        settings: {
          allowOnlineOrdering: true,
          requireCustomerInfo: false,
          showNutritionalInfo: false,
          enableReviews: true,
          enableWaitlist: false,
          orderPreparationTime: 20,
          minimumOrderAmount: 10.00,
          deliveryFee: 0,
          serviceFee: 0,
          taxRate: 8.75,
          currency: 'USD',
          timezone: 'America/New_York',
          language: 'en'
        }
      });
      
      // Redirect to restaurant dashboard
      if (restaurant) {
        navigate(`/admin?restaurant=${restaurant.slug}`);
      }
      
    } catch (error) {
      console.error('Error creating restaurant:', error);
      setErrors(prev => ({ ...prev, submit: (error as any)?.message || 'Failed to sign up. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Bella Vista"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell customers about your restaurant..."
                className={errors.description ? 'border-red-500' : ''}
                rows={3}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="info@yourrestaurant.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main Street"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="New York"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
              
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="NY"
                  className={errors.state ? 'border-red-500' : ''}
                />
                {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
              </div>
              
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="10001"
                  className={errors.zipCode ? 'border-red-500' : ''}
                />
                {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Information</h3>
              <p className="text-gray-600">Please review your restaurant details before creating your account.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Restaurant Name</h4>
                  <p className="text-gray-600">{formData.name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Phone</h4>
                  <p className="text-gray-600">{formData.phone}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Email</h4>
                  <p className="text-gray-600">{formData.email}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Address</h4>
                  <p className="text-gray-600">{formData.address}, {formData.city}, {formData.state} {formData.zipCode}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900">Description</h4>
                <p className="text-gray-600">{formData.description}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Ready to get started?</strong> Click "Create Restaurant" to set up your account and start building your digital menu.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <>
      <SEO
        title="Restaurant Sign Up - Join ServeKaro Platform"
        description="Sign up for ServeKaro and transform your restaurant with digital menus and QR code ordering. Start your free trial today and reduce wait times by 70%."
        keywords="restaurant sign up, digital menu platform, QR code ordering, restaurant registration, free trial, restaurant technology"
        url="https://servekaro.com/signup"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ServeKaro</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 font-semibold text-xs sm:text-sm ${
                    currentStep >= step.number
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 text-gray-500 bg-white'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className={`hidden sm:inline text-xs sm:text-sm font-medium ${
                    currentStep >= step.number ? 'text-gray-900 font-semibold' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-6 sm:w-12 md:w-20 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </CardContent>
        </Card>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-6 text-sm">
            {errors.submit}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Previous
          </Button>
          
          {currentStep < steps.length ? (
            <Button onClick={handleNext} className="w-full sm:w-auto order-1 sm:order-2">
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto order-1 sm:order-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Restaurant...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Restaurant
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default RestaurantSignUp;
