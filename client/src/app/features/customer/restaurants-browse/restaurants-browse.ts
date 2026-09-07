import {
  Component, ChangeDetectionStrategy, OnInit,
  inject, signal, computed, HostListener,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { retry } from 'rxjs/operators';
import { timer } from 'rxjs';
import { CanonicalService } from '../../../core/services/canonical.service';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { FavouritesService } from '../../../core/services/favourites.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Restaurant } from '../../../core/models';

/** High-quality realistic demo dataset of 12 kitchens across London */
const DEMO_RESTAURANTS: Restaurant[] = [
  {
    id: 2, hashId: 'rest-2', name: 'Bella Napoli', cuisineType: 'Italian',
    description: 'Wood-fired sourdough pizza and fresh handmade pasta crafted live by master pizzaiolos.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&auto=format&fit=crop',
    rating: 4.9, ratingLabel: 'Exceptional', hygieneRating: 5,
    estimatedDeliveryMinutes: 25, deliveryRadiusMiles: 1.8,
    address: '18 Soho Square, London W1D 3QL', basePostcode: 'W1D 3QL',
    isActive: true, isLive: true, liveMessage: 'Stretching sourdough & firing Margherita pizzas live',
    featured: true, supportsCollection: true, dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-free'],
    phone: '+44 20 7946 0192',
  },
  {
    id: 5, hashId: 'rest-5', name: 'Green Bowl', cuisineType: 'Healthy',
    description: 'Vibrant nutrient-dense quinoa bowls, avocado toast, and fresh cold-pressed wellness juices.',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&auto=format&fit=crop',
    rating: 4.8, ratingLabel: 'Excellent', hygieneRating: 5,
    estimatedDeliveryMinutes: 20, deliveryRadiusMiles: 1.5,
    address: '12 Notting Hill Gate, London W11 3HR', basePostcode: 'W11 3HR',
    isActive: true, isLive: true, liveMessage: 'Assembling organic grain bowls & fresh dressings',
    featured: false, supportsCollection: true, dietaryTags: ['Vegan', 'Vegetarian', 'Gluten-free'],
    phone: '+44 20 7946 0843',
  },
  {
    id: 3, hashId: 'rest-3', name: 'Sakura Sushi', cuisineType: 'Japanese',
    description: 'Artisanal sushi rolls, sashimi, and warm ramen bowls prepared with daily market-fresh fish.',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80&auto=format&fit=crop',
    rating: 4.8, ratingLabel: 'Excellent', hygieneRating: 5,
    estimatedDeliveryMinutes: 30, deliveryRadiusMiles: 2.4,
    address: '7 Shoreditch High Street, London E1 6JE', basePostcode: 'E1 6JE',
    isActive: true, isLive: true, liveMessage: 'Precision slicing salmon sashimi & dragon rolls',
    featured: false, supportsCollection: true, dietaryTags: ['Gluten-free', 'Halal'],
    phone: '+44 20 7946 0521',
  },
  {
    id: 1, hashId: 'rest-1', name: 'Spice Garden', cuisineType: 'Indian',
    description: 'Authentic tandoori delicacies, rich tikka masalas, and fragrant basmati biryanis.',
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80&auto=format&fit=crop',
    rating: 4.8, ratingLabel: 'Excellent', hygieneRating: 5,
    estimatedDeliveryMinutes: 28, deliveryRadiusMiles: 2.1,
    address: '42 High Street, Westminster, London SW1A 1AA', basePostcode: 'SW1A 1AA',
    isActive: true, isLive: true, liveMessage: 'Baking garlic naans in 400°C clay tandoor',
    featured: false, supportsCollection: true, dietaryTags: ['Halal', 'Vegetarian', 'Vegan'],
    phone: '+44 20 7946 0110',
  },
  {
    id: 4, hashId: 'rest-4', name: 'The Burger Joint', cuisineType: 'Burgers',
    description: 'Dry-aged smash beef burgers, crispy bacon, house sauces, and double-fried rosemary fries.',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80&auto=format&fit=crop',
    rating: 4.6, ratingLabel: 'Very Good', hygieneRating: 4,
    estimatedDeliveryMinutes: 25, deliveryRadiusMiles: 3.2,
    address: '55 Camden High Street, London NW1 7JH', basePostcode: 'NW1 7JH',
    isActive: true, isLive: false, liveMessage: 'Grilling signature smash beef patties',
    featured: false, supportsCollection: true, dietaryTags: ['Halal'],
    phone: '+44 20 7946 0478',
  },
  {
    id: 6, hashId: 'rest-6', name: 'Dragon Wok', cuisineType: 'Chinese',
    description: 'High-heat wok hei stir-fries, crispy duck pancakes, dim sum, and spicy Szechuan beef.',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80&auto=format&fit=crop',
    rating: 4.7, ratingLabel: 'Very Good', hygieneRating: 5,
    estimatedDeliveryMinutes: 32, deliveryRadiusMiles: 2.6,
    address: '88 Gerrard Street, Chinatown, London W1D 5PT', basePostcode: 'W1D 5PT',
    isActive: true, isLive: true, liveMessage: 'Tossing high-heat Singapore vermicelli noodles',
    featured: false, supportsCollection: true, dietaryTags: ['Halal', 'Vegetarian'],
    phone: '+44 20 7946 0699',
  },
  {
    id: 7, hashId: 'rest-7', name: 'Taco & Cantina', cuisineType: 'Other',
    description: 'Slow-roasted birria tacos, fresh guacamole, churros, and house salsas pressed from heirloom corn.',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80&auto=format&fit=crop',
    rating: 4.8, ratingLabel: 'Excellent', hygieneRating: 5,
    estimatedDeliveryMinutes: 22, deliveryRadiusMiles: 1.9,
    address: '24 Marylebone High Street, London W1U 4PQ', basePostcode: 'W1U 4PQ',
    isActive: true, isLive: true, liveMessage: 'Pressing corn tortillas & searing birria beef',
    featured: false, supportsCollection: true, dietaryTags: ['Gluten-free', 'Vegetarian', 'Halal'],
    phone: '+44 20 7946 0712',
  },
  {
    id: 8, hashId: 'rest-8', name: 'Bombay House', cuisineType: 'Indian',
    description: 'Royal Awadhi dum biryanis slow-cooked in sealed clay pots with fragrant saffron.',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80&auto=format&fit=crop',
    rating: 4.7, ratingLabel: 'Very Good', hygieneRating: 5,
    estimatedDeliveryMinutes: 38, deliveryRadiusMiles: 3.8,
    address: '102 Brick Lane, London E1 6RL', basePostcode: 'E1 6RL',
    isActive: true, isLive: true, liveMessage: 'Unsealing clay pots for dum biryani orders',
    featured: false, supportsCollection: true, dietaryTags: ['Halal', 'Vegetarian'],
    phone: '+44 20 7946 0888',
  },
  {
    id: 9, hashId: 'rest-9', name: 'Ramen Master', cuisineType: 'Japanese',
    description: 'Rich 18-hour broth tonkotsu ramen, hand-pulled noodles, and melt-in-mouth chashu pork.',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80&auto=format&fit=crop',
    rating: 4.8, ratingLabel: 'Excellent', hygieneRating: 5,
    estimatedDeliveryMinutes: 27, deliveryRadiusMiles: 2.2,
    address: '31 Brewer Street, Soho, London W1F 0SS', basePostcode: 'W1F 0SS',
    isActive: true, isLive: false, liveMessage: 'Ladling piping hot tonkotsu broth',
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 0933',
  },
  {
    id: 10, hashId: 'rest-10', name: 'Pure Vegan Kitchen', cuisineType: 'Healthy',
    description: '100% plant-based gourmet kitchen specializing in macro bowls, raw desserts, and wellness shakes.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&auto=format&fit=crop',
    rating: 4.6, ratingLabel: 'Very Good', hygieneRating: 5,
    estimatedDeliveryMinutes: 35, deliveryRadiusMiles: 2.9,
    address: '5 Islington Green, London N1 2XH', basePostcode: 'N1 2XH',
    isActive: true, isLive: false, liveMessage: 'Blending organic smoothie bowls',
    featured: false, supportsCollection: true, dietaryTags: ['Vegan', 'Vegetarian', 'Gluten-free'],
    phone: '+44 20 7946 1044',
  },
  {
    id: 11, hashId: 'rest-11', name: 'Le Petit Artisan', cuisineType: 'Other',
    description: 'French bakery and bistro serving hot croque-monsieurs, buttery quiches, and artisanal sourdough.',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80&auto=format&fit=crop',
    rating: 4.9, ratingLabel: 'Exceptional', hygieneRating: 5,
    estimatedDeliveryMinutes: 24, deliveryRadiusMiles: 1.4,
    address: '14 Covent Garden Market, London WC2E 8RF', basePostcode: 'WC2E 8RF',
    isActive: true, isLive: false, liveMessage: 'Fresh croissants coming out of oven',
    featured: false, supportsCollection: true, dietaryTags: ['Vegetarian'],
    phone: '+44 20 7946 1155',
  },
  {
    id: 12, hashId: 'rest-12', name: 'La Slice Pizzeria', cuisineType: 'Pizza',
    description: 'New York-style giant pizza slices with crispy charred crust and generous mozzarella stretch.',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80&auto=format&fit=crop',
    rating: 4.5, ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: 18, deliveryRadiusMiles: 4.2,
    address: '79 Commercial Street, London E1 6BD', basePostcode: 'E1 6BD',
    isActive: false, isLive: false, liveMessage: 'Closed for prep — opens at 5 PM',
    featured: false, supportsCollection: true, dietaryTags: ['Vegetarian'],
    phone: '+44 20 7946 1266',
  },
  {
    id: 13, hashId: 'rest-13', name: 'McDonald\'s', cuisineType: 'Burgers',
    description: 'Iconic burgers, world-famous fries.',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1000',
  },
  {
    id: 14, hashId: 'rest-14', name: 'Burger King', cuisineType: 'Burgers',
    description: 'Home of the Whopper, flame-grilled burgers.',
    imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1001',
  },
  {
    id: 15, hashId: 'rest-15', name: 'Five Guys', cuisineType: 'Burgers',
    description: 'Handcrafted burgers and fresh-cut fries.',
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1002',
  },
  {
    id: 16, hashId: 'rest-16', name: 'Wendy\'s', cuisineType: 'Burgers',
    description: 'Fresh, never frozen beef burgers.',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1003',
  },
  {
    id: 17, hashId: 'rest-17', name: 'KFC', cuisineType: 'Chicken',
    description: 'Finger Lickin\' Good fried chicken.',
    imageUrl: 'https://images.unsplash.com/photo-1626082895617-2c6e866a7b7a?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1004',
  },
  {
    id: 18, hashId: 'rest-18', name: 'Pepe\'s Piri Piri', cuisineType: 'Chicken',
    description: 'Flame grilled piri piri chicken.',
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1005',
  },
  {
    id: 19, hashId: 'rest-19', name: 'Popeyes', cuisineType: 'Chicken',
    description: 'Louisiana kitchen famous fried chicken.',
    imageUrl: 'https://images.unsplash.com/photo-1569691899455-88464f6d3310?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1006',
  },
  {
    id: 20, hashId: 'rest-20', name: 'Nando\'s', cuisineType: 'Chicken',
    description: 'Legendary flame-grilled PERi-PERi chicken.',
    imageUrl: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1007',
  },
  {
    id: 21, hashId: 'rest-21', name: 'Wingstop', cuisineType: 'Chicken',
    description: 'Flavor cravers\' favorite chicken wings.',
    imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1008',
  },
  {
    id: 22, hashId: 'rest-22', name: 'Slim Chickens', cuisineType: 'Chicken',
    description: 'Fresh, hand-breaded chicken tenders.',
    imageUrl: 'https://images.unsplash.com/photo-1625938146369-adc83368bda7?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1009',
  },
  {
    id: 23, hashId: 'rest-23', name: 'Domino\'s', cuisineType: 'Pizza',
    description: 'Piping hot pizza delivered fresh.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1010',
  },
  {
    id: 24, hashId: 'rest-24', name: 'Papa John\'s', cuisineType: 'Pizza',
    description: 'Better Ingredients. Better Pizza.',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1011',
  },
  {
    id: 25, hashId: 'rest-25', name: 'Pizza Hut', cuisineType: 'Pizza',
    description: 'Pan pizzas, stuffed crusts, and wings.',
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1012',
  },
  {
    id: 26, hashId: 'rest-26', name: 'PizzaExpress', cuisineType: 'Pizza',
    description: 'Artisanal pizzas and dough balls.',
    imageUrl: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1013',
  },
  {
    id: 27, hashId: 'rest-27', name: 'Taco Bell', cuisineType: 'Mexican',
    description: 'Craveable Mexican-inspired favorites.',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1014',
  },
  {
    id: 28, hashId: 'rest-28', name: 'Chipotle', cuisineType: 'Mexican',
    description: 'Burritos, bowls, and tacos with real ingredients.',
    imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1015',
  },
  {
    id: 29, hashId: 'rest-29', name: 'Tortilla', cuisineType: 'Mexican',
    description: 'Real California burritos and tacos.',
    imageUrl: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1016',
  },
  {
    id: 30, hashId: 'rest-30', name: 'Wagamama', cuisineType: 'Asian',
    description: 'Asian-inspired food in a bustling setting.',
    imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1017',
  },
  {
    id: 31, hashId: 'rest-31', name: 'Yo! Sushi', cuisineType: 'Asian',
    description: 'Fresh, flavourful Japanese street food.',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1018',
  },
  {
    id: 32, hashId: 'rest-32', name: 'Wok to Walk', cuisineType: 'Asian',
    description: 'Custom Asian noodle and rice stir-fries.',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1019',
  },
  {
    id: 33, hashId: 'rest-33', name: 'Bubbleology', cuisineType: 'Asian',
    description: 'Deliciously refreshing bubble teas.',
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b37103ef4e55?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1020',
  },
  {
    id: 34, hashId: 'rest-34', name: 'Subway', cuisineType: 'Café',
    description: 'Freshly made subs, wraps, and salads.',
    imageUrl: 'https://images.unsplash.com/photo-1619881589316-56c7f9e6b587?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1021',
  },
  {
    id: 35, hashId: 'rest-35', name: 'Greggs', cuisineType: 'Café',
    description: 'Freshly baked sausage rolls, bakes, and treats.',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1022',
  },
  {
    id: 36, hashId: 'rest-36', name: 'Pret a Manger', cuisineType: 'Café',
    description: 'Handmade natural food and organic coffee.',
    imageUrl: 'https://images.unsplash.com/photo-1550508139-83a54b38d7d9?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1023',
  },
  {
    id: 37, hashId: 'rest-37', name: 'Costa Coffee', cuisineType: 'Coffee',
    description: 'Expertly crafted coffees and sweet treats.',
    imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1024',
  },
  {
    id: 38, hashId: 'rest-38', name: 'Starbucks', cuisineType: 'Coffee',
    description: 'Premium roasts, frappuccinos, and bakery items.',
    imageUrl: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1025',
  },
  {
    id: 39, hashId: 'rest-39', name: 'Caffè Nero', cuisineType: 'Coffee',
    description: 'Italian-style premium espresso blends.',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1026',
  },
  {
    id: 40, hashId: 'rest-40', name: 'Krispy Kreme', cuisineType: 'Desserts',
    description: 'Original glazed and assorted premium doughnuts.',
    imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1027',
  },
  {
    id: 41, hashId: 'rest-41', name: 'Creams Café', cuisineType: 'Desserts',
    description: 'Waffles, crêpes, sundaes, and shakes.',
    imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1028',
  },
  {
    id: 42, hashId: 'rest-42', name: 'Häagen-Dazs', cuisineType: 'Desserts',
    description: 'Luxury ice cream in extraordinary flavors.',
    imageUrl: 'https://images.unsplash.com/photo-1570197781417-0a52375c020d?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1029',
  },
  {
    id: 43, hashId: 'rest-43', name: 'Baskin-Robbins', cuisineType: 'Desserts',
    description: '31 flavors of premium ice cream treats.',
    imageUrl: 'https://images.unsplash.com/photo-1557142046-c704a3adf364?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1030',
  },
  {
    id: 44, hashId: 'rest-44', name: 'Ben & Jerry\'s', cuisineType: 'Desserts',
    description: 'Chunks and swirls in euphoric ice cream.',
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c8a9e9ce?w=800&q=80&auto=format&fit=crop',
    rating: parseFloat((Math.random() * (4.9 - 4.1) + 4.1).toFixed(1)), ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: Math.floor(Math.random() * (45 - 15 + 1) + 15), deliveryRadiusMiles: parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(1)),
    address: 'London', basePostcode: 'W1D',
    isActive: true, isLive: false, liveMessage: null,
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 1031',
  },
];

// Keyed by restaurant NAME (stable across demo/API merge — IDs change, names don't)
const DEAL_BADGES: Record<string, string> = {
  'Spice Garden':      '15% off £20+',
  'Bella Napoli':      '25% off £20+',
  'Sakura Sushi':      'Free item on £20+',
  'The Burger Joint':  'Buy 1, get 1',
  'Dragon Wok':        '20% off £20+',
  'Taco & Cantina':    '40% off £20+',
  'Bombay House':      'Buy 1, get a free item',
  'Pure Vegan Kitchen':'50% off select items',
  'McDonald\'s': '20% off £15+',
  'Burger King': '20% off £15+',
  'Five Guys': '20% off £15+',
  'Wendy\'s': '20% off £15+',
  'KFC': '20% off £15+',
  'Pepe\'s Piri Piri': '20% off £15+',
  'Popeyes': '20% off £15+',
  'Nando\'s': '20% off £15+',
  'Wingstop': '20% off £15+',
  'Slim Chickens': '20% off £15+',
  'Domino\'s': '20% off £15+',
  'Papa John\'s': '20% off £15+',
  'Pizza Hut': '20% off £15+',
  'PizzaExpress': '20% off £15+',
  'Taco Bell': '20% off £15+',
  'Chipotle': '20% off £15+',
  'Tortilla': '20% off £15+',
  'Wagamama': '20% off £15+',
  'Yo! Sushi': '20% off £15+',
  'Wok to Walk': '20% off £15+',
  'Bubbleology': '20% off £15+',
  'Subway': '20% off £15+',
  'Greggs': '20% off £15+',
  'Pret a Manger': '20% off £15+',
  'Costa Coffee': '20% off £15+',
  'Starbucks': '20% off £15+',
  'Caffè Nero': '20% off £15+',
  'Krispy Kreme': '20% off £15+',
  'Creams Café': '20% off £15+',
  'Häagen-Dazs': '20% off £15+',
  'Baskin-Robbins': '20% off £15+',
  'Ben & Jerry\'s': '20% off £15+',
};

const DELIVERY_FEES: Record<string, string> = {
  'Spice Garden':       '£1.29',
  'Bella Napoli':       '£0.29',
  'Sakura Sushi':       '£0.79',
  'The Burger Joint':   '£1.79',
  'Green Bowl':         '£0.00',
  'Dragon Wok':         '£1.29',
  'Taco & Cantina':     '£0.79',
  'Bombay House':       '£1.29',
  'Ramen Master':       '£1.79',
  'Pure Vegan Kitchen': '£0.29',
  'Le Petit Artisan':   '£0.79',
  'La Slice Pizzeria':  '£1.29',
  'McDonald\'s': '£1.49',
  'Burger King': '£1.49',
  'Five Guys': '£1.49',
  'Wendy\'s': '£1.49',
  'KFC': '£1.49',
  'Pepe\'s Piri Piri': '£1.49',
  'Popeyes': '£1.49',
  'Nando\'s': '£1.49',
  'Wingstop': '£1.49',
  'Slim Chickens': '£1.49',
  'Domino\'s': '£1.49',
  'Papa John\'s': '£1.49',
  'Pizza Hut': '£1.49',
  'PizzaExpress': '£1.49',
  'Taco Bell': '£1.49',
  'Chipotle': '£1.49',
  'Tortilla': '£1.49',
  'Wagamama': '£1.49',
  'Yo! Sushi': '£1.49',
  'Wok to Walk': '£1.49',
  'Bubbleology': '£1.49',
  'Subway': '£1.49',
  'Greggs': '£1.49',
  'Pret a Manger': '£1.49',
  'Costa Coffee': '£1.49',
  'Starbucks': '£1.49',
  'Caffè Nero': '£1.49',
  'Krispy Kreme': '£1.49',
  'Creams Café': '£1.49',
  'Häagen-Dazs': '£1.49',
  'Baskin-Robbins': '£1.49',
  'Ben & Jerry\'s': '£1.49',
};

const REVIEW_COUNTS: Record<string, string> = {
  'Spice Garden':       '500+',
  'Bella Napoli':       '1,000+',
  'Sakura Sushi':       '600+',
  'The Burger Joint':   '400+',
  'Green Bowl':         '200+',
  'Dragon Wok':         '700+',
  'Taco & Cantina':     '300+',
  'Bombay House':       '800+',
  'Ramen Master':       '500+',
  'Pure Vegan Kitchen': '150+',
  'Le Petit Artisan':   '250+',
  'La Slice Pizzeria':  '600+',
  'McDonald\'s': '1,000+',
  'Burger King': '1,000+',
  'Five Guys': '1,000+',
  'Wendy\'s': '1,000+',
  'KFC': '1,000+',
  'Pepe\'s Piri Piri': '1,000+',
  'Popeyes': '1,000+',
  'Nando\'s': '1,000+',
  'Wingstop': '1,000+',
  'Slim Chickens': '1,000+',
  'Domino\'s': '1,000+',
  'Papa John\'s': '1,000+',
  'Pizza Hut': '1,000+',
  'PizzaExpress': '1,000+',
  'Taco Bell': '1,000+',
  'Chipotle': '1,000+',
  'Tortilla': '1,000+',
  'Wagamama': '1,000+',
  'Yo! Sushi': '1,000+',
  'Wok to Walk': '1,000+',
  'Bubbleology': '1,000+',
  'Subway': '1,000+',
  'Greggs': '1,000+',
  'Pret a Manger': '1,000+',
  'Costa Coffee': '1,000+',
  'Starbucks': '1,000+',
  'Caffè Nero': '1,000+',
  'Krispy Kreme': '1,000+',
  'Creams Café': '1,000+',
  'Häagen-Dazs': '1,000+',
  'Baskin-Robbins': '1,000+',
  'Ben & Jerry\'s': '1,000+',
};

const GREAT_VALUE_NAMES = new Set(['The Burger Joint', 'Taco & Cantina', 'Ramen Master', 'La Slice Pizzeria', 'McDonald\'s', 'Burger King', 'Subway', 'Greggs']);

@Component({
  selector: 'app-restaurants-browse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, NgTemplateOutlet,
    MatRippleModule, MatTooltipModule, MatButtonModule,
  ],
  templateUrl: './restaurants-browse.html',
  styleUrl: './restaurants-browse.scss',
})
export class RestaurantsBrowse implements OnInit {
  private readonly restaurantService = inject(RestaurantService);
  readonly favourites = inject(FavouritesService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly restaurants    = signal<Restaurant[]>(DEMO_RESTAURANTS);
  readonly loading        = signal(false);
  readonly searchQuery    = signal('');
  readonly searchFocused  = signal(false);
  readonly togglingFavId  = signal<number | null>(null);
  readonly showOffersOnly = signal(false);
  readonly activeCategoryLabel = signal('');

  readonly CUISINE_OPTIONS  = ['All', 'Indian', 'Italian', 'Japanese', 'Burgers', 'Chinese', 'Healthy', 'Pizza', 'Chicken', 'Mexican', 'Asian', 'Café', 'Coffee', 'Desserts', 'Other'];
  readonly DIETARY_OPTIONS  = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free'];
  readonly RATING_OPTIONS   = [
    { label: 'Any rating', value: 0 },
    { label: '4.0+ Stars', value: 4.0 },
    { label: '4.5+ Stars', value: 4.5 },
  ];
  readonly DELIVERY_OPTIONS = [
    { label: 'Any time', value: null },
    { label: 'Under 30 min', value: 30 },
    { label: 'Under 45 min', value: 45 },
  ];
  readonly DISTANCE_OPTIONS = [
    { label: 'Any distance', value: null },
    { label: 'Under 2 miles', value: 2 },
    { label: 'Under 5 miles', value: 5 },
  ];
  readonly POPULAR_SEARCHES = ['Pizza', 'Sushi', 'Burgers', 'Healthy', 'Indian', 'Biryani', 'Chicken', 'Mexican', 'Coffee', 'Desserts'];

  readonly CATEGORY_ICONS = [
    { imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80&auto=format&fit=crop', label: 'Chinese',  filter: 'Chinese'  },
    { imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80&auto=format&fit=crop', label: 'Pizza',    filter: 'Pizza'    },
    { imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80&auto=format&fit=crop', label: 'Indian',   filter: 'Indian'   },
    { imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&q=80&auto=format&fit=crop', label: 'Desserts', filter: 'Other'    },
    { imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&q=80&auto=format&fit=crop', label: 'Sushi',    filter: 'Japanese' },
    { imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&q=80&auto=format&fit=crop', label: 'Halal',    filter: 'All'      },
    { imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80&auto=format&fit=crop', label: 'Healthy',  filter: 'Healthy'  },
    { imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80&auto=format&fit=crop', label: 'Burgers',  filter: 'Burgers'  },
    { imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&q=80&auto=format&fit=crop', label: 'Noodles',  filter: 'Japanese' },
    { imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=80&auto=format&fit=crop', label: 'Mexican',  filter: 'Other'    },
    { imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80&auto=format&fit=crop', label: 'Bakery',   filter: 'Other'    },
    { imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80&auto=format&fit=crop', label: 'Vegan',    filter: 'Healthy'  },
    { imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&q=80&auto=format&fit=crop', label: 'Japanese', filter: 'Japanese' },
  ];

  readonly PROMO_BANNERS = [
    {
      id: 1,
      title: 'Try SeeThePrep Plus free for 4 weeks',
      desc: 'Enjoy £0 delivery fees, exclusive member discounts, and live kitchen access.',
      cta: 'Join now',
      bg: '#fef6e8', textColor: '#1a1410', btnBg: '#1a1410', btnColor: '#ffffff',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80&auto=format&fit=crop',
      link: '/plus',
      queryParams: {},
    },
    {
      id: 2,
      title: 'Pickup – same prices, no waiting',
      desc: 'Enjoy your favourites at in-store prices when you pick up.',
      cta: 'Order now',
      bg: '#ff6b1a', textColor: '#ffffff', btnBg: '#ffffff', btnColor: '#ff6b1a',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80&auto=format&fit=crop',
      link: '/restaurants',
      queryParams: {},
    },
    {
      id: 3,
      title: 'Weekend deals: Up to 40% off select restaurants',
      desc: 'Enjoy more savings this weekend with our exclusive offers.',
      cta: 'Shop now',
      bg: '#10b981', textColor: '#ffffff', btnBg: '#ffffff', btnColor: '#10b981',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80&auto=format&fit=crop',
      link: '/restaurants',
      queryParams: { offers: 'true' },
    },
    {
      id: 4,
      title: 'Free delivery on your first 3 orders',
      desc: 'Taste the best local kitchens with £0 delivery applied automatically.',
      cta: 'Claim offer',
      bg: '#4f46e5', textColor: '#ffffff', btnBg: '#ffffff', btnColor: '#4f46e5',
      imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80&auto=format&fit=crop',
      link: '/restaurants',
      queryParams: { offers: 'true' },
    },
    {
      id: 5,
      title: 'Watch chefs prep your order live in 4K',
      desc: '100% kitchen transparency with high-definition live streaming cams.',
      cta: 'Watch live',
      bg: '#18181b', textColor: '#ffffff', btnBg: '#ff6b1a', btnColor: '#ffffff',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80&auto=format&fit=crop',
      link: '/restaurants',
      queryParams: {},
    },
    {
      id: 6,
      title: 'Late night cravings? Open past midnight',
      desc: 'From hot smash burgers to warm churros delivered fresh to your door.',
      cta: 'Order late',
      bg: '#db2777', textColor: '#ffffff', btnBg: '#ffffff', btnColor: '#db2777',
      imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=80&auto=format&fit=crop',
      link: '/restaurants',
      queryParams: {},
    },
  ];

  readonly cuisineFilter   = signal('All');
  readonly sortOption      = signal<'rating' | 'time' | 'distance' | 'popular'>('rating');
  readonly activeDietary   = signal<string[]>([]);
  readonly ratingFilter    = signal<number>(0);
  readonly maxDeliveryTime = signal<number | null>(null);
  readonly maxDistance     = signal<number | null>(null);
  readonly filterSheetOpen = signal(false);


  /* ── Section computed signals ── */
  readonly featuredCards  = computed(() => this.restaurants().slice(0, 12));
  readonly popularCards   = computed(() =>
    [...this.restaurants()].sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5)).slice(0, 12));
  readonly qualityCards   = computed(() =>
    this.restaurants().filter(r => (r.rating || 4.5) >= 4.7).slice(0, 12));
  readonly offersCards    = computed(() =>
    this.restaurants().filter(r => !!DEAL_BADGES[r.name]).slice(0, 12));
  readonly legendCards    = computed(() =>
    this.restaurants().filter(r => r.isLive).slice(0, 12));
  readonly budgetCards    = computed(() =>
    [...this.restaurants()].sort((a, b) => a.deliveryRadiusMiles - b.deliveryRadiusMiles).slice(0, 12));
  readonly nationalCards  = computed(() => this.restaurants().slice(3, 12));
  readonly lovedDealsCards = computed(() =>
    this.restaurants().filter(r => !!DEAL_BADGES[r.name]).slice(0, 12));

  readonly activeFilterCount = computed(() => {
    let c = 0;
    if (this.cuisineFilter() !== 'All')     c++;
    if (this.activeDietary().length > 0)    c += this.activeDietary().length;
    if (this.ratingFilter() > 0)            c++;
    if (this.maxDeliveryTime() !== null)    c++;
    if (this.maxDistance() !== null)        c++;
    if (this.showOffersOnly())              c++;
    return c;
  });

  readonly favouriteRestaurants = computed(() =>
    this.restaurants().filter(r => this.favourites.isFavourite(r.id)));

  readonly searchSuggestions = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return [];
    return this.restaurants().filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.cuisineType.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.address && r.address.toLowerCase().includes(q))
    ).slice(0, 4);
  });

  readonly filteredRestaurants = computed(() => {
    const q         = this.searchQuery().trim().toLowerCase();
    const cuisine   = this.cuisineFilter();
    const dietary   = this.activeDietary();
    const minRating = this.ratingFilter();
    const maxTime   = this.maxDeliveryTime();
    const maxDist   = this.maxDistance();
    const sort      = this.sortOption();
    const offersOnly = this.showOffersOnly();

    let result = this.restaurants().filter(r => {
      if (cuisine !== 'All' && r.cuisineType !== cuisine) return false;
      if (dietary.length > 0) {
        const tags = r.dietaryTags || [];
        const ok = dietary.every(d =>
          tags.includes(d) ||
          (d === 'Vegan'       && r.cuisineType === 'Healthy') ||
          (d === 'Vegetarian'  && ['Healthy', 'Italian', 'Indian'].includes(r.cuisineType)) ||
          (d === 'Halal'       && ['Indian', 'Chinese', 'Burgers'].includes(r.cuisineType))
        );
        if (!ok) return false;
      }
      const rRating = r.rating || (r.hygieneRating >= 5 ? 4.8 : 4.2);
      if (minRating > 0 && rRating < minRating) return false;
      if (maxTime !== null && r.estimatedDeliveryMinutes > maxTime) return false;
      if (maxDist !== null && r.deliveryRadiusMiles > maxDist) return false;
      if (offersOnly && !DEAL_BADGES[r.name]) return false;
      if (q) {
        const hit = r.name.toLowerCase().includes(q) ||
          r.cuisineType.toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.address || '').toLowerCase().includes(q) ||
          (r.liveMessage || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });

    if (sort === 'rating')   result = [...result].sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    if (sort === 'time')     result = [...result].sort((a, b) => a.estimatedDeliveryMinutes - b.estimatedDeliveryMinutes);
    if (sort === 'distance') result = [...result].sort((a, b) => a.deliveryRadiusMiles - b.deliveryRadiusMiles);
    if (sort === 'popular')  result = [...result].sort((a, b) => (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0));
    return result;
  });

  readonly allKitchensCards = computed(() => this.restaurants());

  /* ── Helper methods — use restaurant.name as stable key (survives API ID merge) ── */
  getDeal(r: Restaurant): string | null  { return DEAL_BADGES[r.name]    || null; }
  getDeliveryFee(r: Restaurant): string  { return DELIVERY_FEES[r.name]  || '£1.29'; }
  getReviewCount(r: Restaurant): string  { return REVIEW_COUNTS[r.name]  || '500+'; }
  isGreatValue(r: Restaurant): boolean   { return GREAT_VALUE_NAMES.has(r.name); }

  scrollSection(containerId: string, direction: number): void {
    const el = document.getElementById(containerId);
    if (!el) return;
    const distance = containerId === 'carousel-promo'
      ? Math.max(340, Math.floor(el.clientWidth * 0.85))
      : 264;
    el.scrollBy({ left: direction * distance, behavior: 'smooth' });
  }

  setCategoryFilter(cat: { imageUrl?: string; emoji?: string; label: string; filter: string }): void {
    this.cuisineFilter.set(cat.filter);
    this.activeCategoryLabel.set(cat.label);
  }

  constructor() {
    inject(Title).setTitle("Discover What's Cooking Near You | SeeThePrep");
    inject(CanonicalService).set('https://seetheprep.com/restaurants');
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Discover real verified kitchens cooking live right now. Watch chefs prepare your food with 100% transparency before ordering.' });
    meta.updateTag({ property: 'og:title', content: "Discover What's Cooking Near You | SeeThePrep" });
    meta.updateTag({ property: 'og:url', content: 'https://seetheprep.com/restaurants' });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['q'])       this.searchQuery.set(params['q']);
      if (params['cuisine']) this.cuisineFilter.set(params['cuisine']);
      if (params['offers'])  this.showOffersOnly.set(true);
    });

    this.restaurantService.list()
      .pipe(retry({ count: 2, delay: () => timer(1500) }))
      .subscribe({
        next: (apiData) => {
          if (apiData && apiData.length > 0) {
            // Step 1: merge real API data into demo restaurants (preserves UI metadata)
            const matchedApiIds = new Set<number>();
            const merged = DEMO_RESTAURANTS.map(demo => {
              const match = apiData.find(a =>
                a.id === demo.id || a.name.toLowerCase() === demo.name.toLowerCase()
              );
              if (match) {
                matchedApiIds.add(match.id);
                return {
                  ...demo,
                  id:               match.id,
                  hashId:           match.hashId || demo.hashId,
                  imageUrl:         match.imageUrl || demo.imageUrl,
                  angelcamCameraId: match.angelcamCameraId || (demo.isLive ? 'demo-cam' : null),
                };
              }
              return demo;
            });

            // Step 2: append any real backend restaurants not found in demo list
            const extra: Restaurant[] = apiData
              .filter(a => !matchedApiIds.has(a.id))
              .map(a => ({
                ...a,
                isLive:      a.isLive      ?? false,
                liveMessage: a.liveMessage ?? null,
                description: a.description ?? null,
                featured:    a.featured    ?? false,
                dietaryTags: a.dietaryTags ?? [],
                rating:      a.rating      ?? (a.hygieneRating >= 5 ? 4.8 : 4.2),
                ratingLabel: a.ratingLabel ?? 'Good',
              }));

            this.restaurants.set([...merged, ...extra]);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    if (this.auth.isCustomer()) this.favourites.loadFavourites().subscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-box-container')) this.searchFocused.set(false);
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  selectPopularSearch(query: string): void {
    this.searchQuery.set(query);
    this.searchFocused.set(false);
  }

  onSortChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as 'rating' | 'time' | 'distance' | 'popular';
    this.sortOption.set(val);
  }

  toggleDietary(tag: string): void {
    const cur = this.activeDietary();
    this.activeDietary.set(cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag]);
  }

  openFilterSheet():  void { this.filterSheetOpen.set(true); }
  closeFilterSheet(): void { this.filterSheetOpen.set(false); }

  clearFilters(): void {
    this.cuisineFilter.set('All');
    this.activeDietary.set([]);
    this.ratingFilter.set(0);
    this.maxDeliveryTime.set(null);
    this.maxDistance.set(null);
    this.searchQuery.set('');
    this.showOffersOnly.set(false);
    this.activeCategoryLabel.set('');
  }

  toggleFavourite(event: Event, restaurant: Restaurant): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.auth.isCustomer() || this.togglingFavId() !== null) return;
    this.togglingFavId.set(restaurant.id);
    this.favourites.toggle(restaurant.hashId, restaurant.id).subscribe({
      next:  () => this.togglingFavId.set(null),
      error: () => this.togglingFavId.set(null),
    });
  }
}