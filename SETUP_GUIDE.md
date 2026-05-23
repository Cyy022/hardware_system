# BATANG GAPAN MINI HARDWARE - SETUP GUIDE

## Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd batang-gapan-mini-hardware
npm install
```

### Step 2: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create Project"
3. Name it "batang-gapan-hardware"
4. Enable Google Analytics (optional)
5. Click "Create Project"

### Step 3: Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" provider
4. Click "Save"

### Step 4: Create Firestore Database
1. Go to "Firestore Database"
2. Click "Create Database"
3. Choose "Start in production mode"
4. Select your region (asia-southeast1 for Philippines)
5. Click "Enable"

### Step 5: Get Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (</>)
4. Register app name: "batang-gapan-web"
5. Copy the firebaseConfig object

### Step 6: Configure Environment Variables
Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 7: Create Admin User
1. In Firebase Console, go to Authentication > Users
2. Click "Add User"
3. Email: cyruscabanes@gmail.com
4. Password: 551500
5. Click "Add User"

### Step 8: Set Firestore Security Rules
Go to Firestore Database > Rules and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click "Publish".

### Step 9: Run the Application
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Step 10: Access Admin Panel
- Go to http://localhost:3000/admin/login
- Login with:
  - Email: cyruscabanes@gmail.com
  - Password: 551500

---

## Detailed Firebase Setup

### Firestore Collections Setup

The application will automatically create collections, but you can pre-create them:

1. **products** - Store product information
2. **variants** - Store product variants (size, price, stock)
3. **sales** - Store sales transactions
4. **suppliers** - Store supplier information
5. **stockin** - Store stock-in records
6. **users** - Store user information

### Firebase Indexes (Optional)

For better performance, create these composite indexes:

1. Collection: `variants`
   - Fields: `productId` (Ascending), `name` (Ascending)

2. Collection: `sales`
   - Fields: `createdAt` (Descending)

3. Collection: `stockin`
   - Fields: `createdAt` (Descending)

To create indexes:
1. Go to Firestore Database > Indexes
2. Click "Add Index"
3. Select collection and fields
4. Click "Create Index"

---

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init

# Select Hosting, choose your project
# Set public directory to: dist
# Configure as single-page app: Yes

# Deploy
firebase deploy
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Deploy to Netlify
```bash
# Build first
npm run build

# Deploy dist folder to Netlify
```

---

## Troubleshooting

### Issue: "Firebase App already exists"
**Solution**: This is normal in development with hot reload. The app handles this automatically.

### Issue: "Permission denied" in Firestore
**Solution**: Check your security rules. Make sure you're logged in as admin.

### Issue: Charts not displaying
**Solution**: Install chart.js dependencies:
```bash
npm install chart.js react-chartjs-2
```

### Issue: "Module not found"
**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Admin login not working
**Solution**: 
1. Check if the user exists in Firebase Authentication
2. Verify email and password are correct
3. Check browser console for errors
4. Ensure Firebase Auth is enabled

---

## Development Tips

### Adding New Categories
Categories are dynamically created based on product categories. To add a new category:
1. Go to Admin > Inventory
2. Add a product with the new category name
3. The category will automatically appear everywhere

### Managing Stock
- Use **Stock In** page to add inventory
- Use **Stock Out** page to process sales
- Stock levels update automatically in real-time

### Viewing Reports
- Go to Admin > Sales Reports
- Filter by date range
- Click the eye icon to view receipt details

### Accessibility Features
- Press `Alt + H` for high contrast
- Press `Alt + L` for large text
- Press `Alt + S` for text-to-speech
- Press `Alt + V` for voice commands

---

## Support

For issues or questions:
- Email: cyruscabanes@gmail.com
- Check Firebase Console for error logs
- Check browser console for frontend errors

## Updates

To update dependencies:
```bash
npm update
```

To check for outdated packages:
```bash
npm outdated
```
