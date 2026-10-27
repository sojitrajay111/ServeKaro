import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { SEO_CONFIG } from '@/config/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  QrCode, 
  Smartphone, 
  BarChart3, 
  Users, 
  Clock, 
  Shield, 
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  Zap,
  Globe,
  Smartphone as Phone,
  CreditCard,
  Headphones,
  Award,
  ChevronRight,
  Menu as MenuIcon,
  Eye,
  Settings,
  TrendingUp,
  X,
  Utensils
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Clock,
      title: "Reduce Wait Times by 70%",
      description: "Customers order instantly with QR codes - no more waiting for menus or servers",
      color: "text-green-600"
    },
    {
      icon: QrCode,
      title: "Contactless Ordering",
      description: "Safe, touch-free dining experience that customers love and trust",
      color: "text-blue-600"
    },
    {
      icon: TrendingUp,
      title: "Boost Average Order Value",
      description: "Upsell with photos and descriptions - increase revenue by 25% on average",
      color: "text-orange-600"
    },
    {
      icon: BarChart3,
      title: "Real-time Kitchen Orders",
      description: "Orders go straight to kitchen - no lost tickets or miscommunication",
      color: "text-purple-600"
    },
    {
      icon: Users,
      title: "Reduce Staff Pressure",
      description: "Less running around for servers, more time for customer service",
      color: "text-red-600"
    },
    {
      icon: Smartphone,
      title: "Works on Any Phone",
      description: "No app download needed - customers just scan and order",
      color: "text-indigo-600"
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for small cafes and food trucks",
      features: [
        "Up to 50 menu items",
        "QR code generation",
        "Basic analytics",
        "Email support",
        "Mobile responsive"
      ],
      popular: false,
      buttonText: "Start Free Trial"
    },
    {
      name: "Professional",
      price: "$79",
      period: "/month",
      description: "Ideal for restaurants and bars",
      features: [
        "Unlimited menu items",
        "Interactive menu visualization",
        "Advanced analytics",
        "Priority support",
        "Custom branding",
        "Order management",
        "Staff accounts"
      ],
      popular: true,
      buttonText: "Start Free Trial"
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      description: "For restaurant chains and large establishments",
      features: [
        "Everything in Professional",
        "Multi-location support",
        "API integrations",
        "Custom development",
        "Dedicated support",
        "White-label options",
        "Advanced reporting"
      ],
      popular: false,
      buttonText: "Contact Sales"
    }
  ];

  const testimonials = [
    {
      name: "Maria Rodriguez",
      restaurant: "Bella Vista Italian",
      rating: 5,
      text: "We reduced wait times by 60% and increased our average order by $8. Customers love the instant ordering!",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "James Chen",
      restaurant: "Golden Dragon",
      rating: 5,
      text: "Our servers can focus on customer service instead of running around with menus. Revenue is up 35%!",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Sarah Johnson",
      restaurant: "The Garden Cafe",
      rating: 5,
      text: "Setup took 30 minutes. Now we're serving more customers with less staff. Game changer!",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Set Up Your Menu",
      description: "Upload your dishes with photos and prices in 15 minutes",
      icon: MenuIcon
    },
    {
      step: "2", 
      title: "Print QR Codes",
      description: "Generate and print QR codes for each table - takes 5 minutes",
      icon: QrCode
    },
    {
      step: "3",
      title: "Train Your Staff",
      description: "Show staff how to manage orders - they'll love the simplicity",
      icon: Users
    },
    {
      step: "4",
      title: "Watch Revenue Grow",
      description: "Customers order faster, you serve more people, profits increase!",
      icon: TrendingUp
    }
  ];

  return (
    <>
      <SEO
        title="Digital Menu Platform for Restaurants | QR Code Ordering System"
        description="Transform your restaurant with our digital menu platform. Reduce wait times by 70%, boost revenue by 35%, and provide contactless QR code ordering. Trusted by 10,000+ restaurants worldwide."
        keywords="digital menu, QR code ordering, restaurant technology, contactless dining, interactive menu, restaurant POS, mobile ordering, restaurant management, food service technology, restaurant software, reduce wait times, boost revenue"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": SEO_CONFIG.productName,
          "description": "Digital Menu Platform for Restaurants with QR Code Ordering System",
          "url": SEO_CONFIG.baseUrl,
          "applicationCategory": SEO_CONFIG.applicationCategory,
          "operatingSystem": "Web",
          "offers": [
            {
              "@type": "Offer",
              "name": "Starter Plan",
              "price": SEO_CONFIG.pricing.starter.price,
              "priceCurrency": SEO_CONFIG.pricing.starter.currency,
              "priceValidUntil": "2025-12-31"
            },
            {
              "@type": "Offer", 
              "name": "Professional Plan",
              "price": SEO_CONFIG.pricing.professional.price,
              "priceCurrency": SEO_CONFIG.pricing.professional.currency,
              "priceValidUntil": "2025-12-31"
            }
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": SEO_CONFIG.ratings.value,
            "ratingCount": SEO_CONFIG.ratings.count
          },
          "author": {
            "@type": "Organization",
            "name": SEO_CONFIG.companyName
          },
          "featureList": [
            "Reduce wait times by 70%",
            "Boost revenue by 35%", 
            "Contactless QR code ordering",
            "Interactive menu visualization",
            "Real-time kitchen orders",
            "Mobile optimized"
          ]
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ServeKaro</span>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Reviews</a>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/login')}>Login</Button>
              <Button size="sm" onClick={() => navigate('/signup')}>Get Started</Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <MenuIcon className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-3"
            >
              <a 
                href="#features" 
                className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a 
                href="#testimonials" 
                className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Reviews
              </a>
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    navigate('/admin/login');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Login
                </Button>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    navigate('/signup');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-3 sm:px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Text Content */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">
                <Zap className="w-3 h-3 mr-1" />
                Trusted by 10,000+ Restaurants
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Stop Losing Customers to
                <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent block sm:inline"> Long Wait Times</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                Turn every table into a revenue opportunity. Let customers order instantly with QR codes, 
                reduce wait times by 70%, and boost your average order value with our restaurant platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto" onClick={() => navigate('/signup')}>
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 sm:mr-2" />
                  No setup fees
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 sm:mr-2" />
                  14-day free trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 sm:mr-2" />
                  Cancel anytime
                </div>
              </div>
            </motion.div>

            {/* Right Column - Restaurant Images */}
            <motion.div
              className="relative mt-8 lg:mt-0"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="relative">
                {/* Main Restaurant Image */}
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/landing/hero.png"
                    alt="Busy restaurant with customers using QR codes to order"
                    className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-gray-900">Bella Vista Italian</h3>
                          <p className="text-xs sm:text-sm text-gray-600">New York, NY</p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700">
                        "Reduced wait times by 60% and increased revenue by 35%"
                      </p>
                    </div>
                  </div>
                </div>
                
  
                
                {/* Additional Restaurant Images */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="relative rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src="/landing/qr-setup.png"
                      alt="Customer scanning QR code at restaurant table"
                      className="w-full h-24 sm:h-28 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="relative rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
                      alt="Happy restaurant staff serving customers"
                      className="w-full h-24 sm:h-28 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Solve Your Biggest Restaurant Challenges
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              Stop losing customers to long wait times and order mistakes. Our platform helps you 
              serve more customers, increase revenue, and reduce operational headaches.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                  {/* Feature Image */}
                  <div className="relative h-32 sm:h-40 overflow-hidden">
                    <img 
                      src={[
                        "/landing/qr-setup.png", // Reduce Wait Times
                        "/landing/hero.png", // Contactless Ordering
                        "/landing/dashboard.png", // Boost Order Value
                        "/landing/dashboard.png", // Real-time Kitchen Orders
                        "/landing/qr-setup.png", // Reduce Staff Pressure
                        "/landing/hero.png"  // Works on Any Phone
                      ][index]}
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute top-3 right-3">
                      <div className={`w-8 h-8 ${feature.color} bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm`}>
                        <feature.icon className={`w-4 h-4 ${feature.color}`} />
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Started in 4 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              From signup to your first order, we've made it incredibly simple.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                className="text-center"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="relative mb-6">
                  {/* Step Image */}
                  <div className="relative w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
                    <img 
                      src={[
                        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop", // Set Up Your Menu - Chef preparing dishes
                        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=300&fit=crop", // Print QR Codes - Restaurant table with QR code
                        "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=300&fit=crop", // Train Your Staff - Staff training session
                        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=300&fit=crop"  // Watch Revenue Grow - Busy restaurant
                      ][index]}
                      alt={step.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    <div className="absolute top-3 right-3">
                      <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <step.icon className="w-4 h-4 text-gray-700" />
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              Choose the plan that fits your restaurant's needs. No hidden fees, no surprises.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`h-full relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-xl' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-6 sm:pb-8">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                    <div className="mt-3 sm:mt-4">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-sm sm:text-base text-gray-600">{plan.period}</span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                          <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => navigate('/signup')}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Restaurant Owners Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying about their experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                        <p className="text-sm text-gray-600">{testimonial.restaurant}</p>
                      </div>
                    </div>
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-700 italic">"{testimonial.text}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurant Success Stories */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Restaurants, Real Results
            </h2>
            <p className="text-xl text-gray-600">
              See how restaurants like yours are transforming their business
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Success Story 1 */}
            <motion.div
              className="relative"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src="/landing/bella-vista.png"
                  alt="Bella Vista Italian restaurant interior with customers"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-lg font-bold mb-1">Bella Vista Italian</h3>
                  <p className="text-sm text-gray-200 mb-2">New York, NY</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-green-500 px-2 py-1 rounded">+35% Revenue</span>
                    <span className="bg-blue-500 px-2 py-1 rounded">-60% Wait Time</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Success Story 2 */}
            <motion.div
              className="relative"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src="/landing/golden-dragon.png"
                  alt="Golden Dragon restaurant staff serving customers"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-lg font-bold mb-1">Golden Dragon</h3>
                  <p className="text-sm text-gray-200 mb-2">San Francisco, CA</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-green-500 px-2 py-1 rounded">+28% Orders</span>
                    <span className="bg-purple-500 px-2 py-1 rounded">+$12 AOV</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Success Story 3 */}
            <motion.div
              className="relative"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src="/landing/qr-setup.png"
                  alt="The Garden Cafe kitchen and dining area"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-lg font-bold mb-1">The Garden Cafe</h3>
                  <p className="text-sm text-gray-200 mb-2">Austin, TX</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-green-500 px-2 py-1 rounded">+42% Efficiency</span>
                    <span className="bg-orange-500 px-2 py-1 rounded">-50% Errors</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Stop Losing Customers to Wait Times?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join 10,000+ restaurants already serving more customers, increasing revenue, and reducing wait times with our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={() => navigate('/signup')}>
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 !border-white !text-white !bg-transparent hover:!bg-white hover:!text-blue-600">
                <Headphones className="w-5 h-5 mr-2" />
                Contact Sales
              </Button>
            </div>
            <p className="text-blue-100 mt-4 text-sm">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <MenuIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">ServeKaro</span>
              </div>
              <p className="text-gray-400">
                The future of restaurant dining is here. Transform your business with digital menus.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ServeKaro. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default LandingPage;
