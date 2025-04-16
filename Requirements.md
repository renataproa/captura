## 🎯 **Captura Simplified Requirements Doc**

### 🌟 **Purpose**
Captura connects photo **requesters** (e.g., marketers, journalists) with everyday **contributors** who upload recent, high-quality, location-matched photos in exchange for rewards (e.g., coupons or crypto).

This prototype focuses on testing the **core mobile flows** before investing in full development.

---

## 🧭 **Core Navigation (Bottom Tab Bar)**  
1. **Home** – Browse all open photo requests (marketplace)  
2. **My Requests** – Manage photo requests I created  
3. **My Uploads** – Track my photo submissions  
4. **Profile** – Manage account, photo access, and earnings

---

## 🧵 **User Flows**

### 1️⃣ Contributor Flow (Submitting Photos to a Request)
**Path: Home ➝ View Details ➝ Auto-Matched Photos ➝ Submit ➝ AI Filter ➝ Approval**

#### Steps:
1. Open **Home** tab → Browse open requests
2. Tap **View Details** on a request card
3. Captura shows **Auto-Matched Photos** based on EXIF metadata (location + date)
4. User selects which photos to submit and taps **Submit**
5. Captura runs an **AI Check**:
   - Location + timestamp validation
   - Visual match (e.g., CLIP model)
   - Quality check (blurry, low light, etc.)
6. Status changes to **Pending Approval**
7. If approved by buyer → user is notified + receives reward 🎉

---

### 2️⃣ Buyer Flow (Creating and Managing a Request)
**Path: My Requests ➝ Create New ➝ View Submissions ➝ Accept Photos**

#### Steps:
1. Open **My Requests** tab
2. Tap **Create Request**:
   - Title, description
   - Location
   - Expiration time
   - Reward range
   - Max # of photos
3. After submission, request appears as “Active”
4. Tap a request → **View Submissions** (AI-filtered)
5. Select and accept the photos you want
6. Contributors are notified and rewarded
7. You receive downloadable, authentic content 📸

---

### 3️⃣ My Uploads
**Track the status of your submitted photos**
- See which bids you’ve submitted to
- Status options:  
  - Pending AI Check  
  - Pending Buyer Approval  
  - Accepted  
  - Rejected

---

### 4️⃣ Profile
- Grant access to photo library
- View total scanned photos & potential rewards
- Upload photos manually (useful for web users)
- View reports and recent activity

---

## 💡 **Key Features**
- **Auto-Match Photos**: Uses metadata (location + time) to suggest submissions
- **AI Filter**:
  - Step 1: Metadata match
  - Step 2: Visual relevance (text → image using CLIP or similar)
  - Step 3: Quality check (exposure, blur, etc.)
  - Step 4: Final manual approval by buyer
- **Privacy-first**: No photos are auto-uploaded. Everything is permission-based.

---

## 🛠️ **Tech Stack (Prototype)**
- **Frontend**: React Native + Expo + Tailwind
- **Backend**: Firebase / Supabase / Node.js
- **Photo Metadata**: `expo-media-library`, `expo-location`, `expo-image-manipulator`
- **AI Filtering**: Basic models for content & quality scoring
- **Storage**: AsyncStorage (for demo)

---

## ✅ **Goals for the Prototype**
- Allow buyers to issue a photo request in under 2 minutes  
- Enable contributors to submit matched photos in a few taps  
- Validate the Auto-Match and AI filter concepts  
- Provide clean, fast, mobile-first UI

---

