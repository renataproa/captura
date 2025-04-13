Captura 

Purpose
Captura enables buyers (e.g., marketers, journalists) to issue time-sensitive photo requests and receive authentic, high-quality, location-relevant images from everyday users. Contributors are rewarded via coupons, crypto, or other incentives. This prototype aims to validate the core user flows on a mobile app before investing in a full-scale platform.

Goals
Enable a buyer to issue a photo request in under 2 minutes
Allow users to view requests, upload images, and get rewarded
Ensure mobile-first experience with a clean, fast UI
Apply AI filtering with an emphasis on metadata analysis
Explore automatic photo matching with active requests via the Auto-Match feature


A. Buyer Features
Create Request
Title, description
Location (map or city name)
Expiration (e.g., “within 3 hours”)
Max # of photos needed
Reward per accepted photo (non-monetary in v0.1, e.g., coupon code)
Browse Submissions
AI-filtered gallery 
Accept/reject photo
Download accepted photo (optional in v0.1)

B. Contributor Features
Browse Active Requests
List view + map view
Filter by proximity, category, reward
Submit Photo
Upload or take live photo
Auto-tag location (GPS metadata)
Optional caption
See submission status
Rewards System (Stubbed)
Confirmation screen for accepted photos
Simulate reward (e.g., “you earned a $5 voucher!”)
Auto-Match Feature (Optional, Opt-In)
Users can opt in to allow the app to scan recent photos periodically and automatically match them against open requests using metadata.
Flow:
User is prompted to enable Auto-Match on first login
App runs periodic metadata scans (Android: background; iOS: on app open)
If match is found, user receives in-app notification:
“You have 2 recent photos that match a live request. Want to submit them?”
User reviews the suggested matches and manually confirms upload
Privacy & Security Safeguards:
No photos are uploaded automatically
Clear permission flow and ability to opt out at any time
Compliant with platform-specific access (e.g., iOS Limited Photo Access)

AI Filter (Layered Approach)
Step 1: Metadata Filter
Check timestamp, GPS location, device info from EXIF metadata
Only photos taken within a defined time window and geofence are retained
Step 2: Description Match
Use lightweight ML models (e.g., CLIP or similar) to compare image content to the buyer’s text description
Score for thematic alignment (e.g., if buyer asked for "sunset over a city skyline")
Step 3: Quality Scoring
Filter for blurriness, exposure, framing, and subject clarity
Optionally use open-source computer vision libraries or third-party APIs
Step 4: Manual Review by Buyer
Buyer sees filtered, ranked submissions and can accept/reject manually
Helps build trust and ensures relevance


Demo React Native (Expo) Technical Specification
Tech Stack

Frontend: React Native with Expo, Tailwind
Backend: Firebase or Supabase or Node.js  
Development Environment: Cursor AI code editor
State Management: React Context API or Redux (simple implementation)
Navigation: React Navigation
UI Components: React Native Paper or NativeBase
Icons: React Native Vector Icons
Local Storage: AsyncStorage for persisting demo data

Key Screens & Components
1. Onboarding Flow

Splash screen with Captura logo
Brief tutorial/walkthrough (3 screens max)
Demo mode selection (Seller or Buyer)

2. Seller Flow Screens
Home/Dashboard

Summary stats panel (scanned photos, potential value)
Quick action buttons (Scan Photos, View Report, Upload Photos)
Recent activity feed (simulated)

Photo Scanner

Permission request for photo library access
Scanning animation with progress indicator
Results summary screen

Value Report

Earnings potential card with price range
Category breakdown with small charts
"Top picks" horizontal scroll of high-value photos
"View all valuable photos" button

Photo Selection Grid

Thumbnail grid with value badge on each photo
Multi-select functionality
Bottom action bar (Upload Selected, Cancel)
Filter/sort options (by value, date, category)

Upload Confirmation

Selected photos summary
Payment details
Terms acceptance checkbox
Upload button with loading state

3. Buyer Flow Screens
Discover Feed

Search bar with location and category filters
Grid/list toggle view
Photo cards with location, price and category tags

Photo Request Form

Step-by-step form with:

Location selector (map integration)
Category dropdown
Price input with suggested ranges
Description text area
Expiration date picker
Submit button



Request Management

Active requests list
Request detail view
Edit/cancel request functionality

Implementation Notes for Expo/React Native
Photo Library Integration

Use expo-media-library for accessing device photos
Extract metadata using expo-image-manipulator and expo-location
All photo processing should happen locally (privacy)

UI Performance Considerations

Use FlatList with optimizations for photo grids
Implement lazy loading for images
Consider react-native-fast-image for better image performance

Data Flow

Mock API responses in JSON format
Simulate network requests with timeouts
Store demo data in AsyncStorage for persistence

Location Services

Implement with expo-location
Include predefined location sets for demo
Simulated geofencing for photo requests

Development Plan
Phase 1: Setup & Navigation

Initialize Expo project
Configure navigation structure
Create placeholder screens
Implement basic styling

Phase 2: Core Seller Flow

Implement photo library scanning simulation
Create value report screen with mock data
Build photo selection grid and upload confirmation

Phase 3: Core Buyer Flow

Develop discover feed with search functionality
Build photo request form
Create request management screens

Phase 4: Polish & Demo Preparation

Add animations and transitions
Implement demo data reset functionality
Optimize performance
Create demo script with sample scenarios

Demo Data Requirements

Predefined set of 50-100 sample photos with metadata
10-15 buyer request templates
Sample value calculations for different photo types
Simulated user profile data

