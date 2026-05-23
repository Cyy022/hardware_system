# Batang Gapan Mini Hardware

A complete full-stack web application for Batang Gapan Mini Hardware store, built with React, Vite, TailwindCSS, and Firebase.

## Features

### Admin Panel
- **Dashboard**: Real-time analytics with charts and statistics
- **Inventory Management**: Add, edit, delete products and variants
- **Stock In**: Record incoming inventory with supplier tracking
- **Stock Out / POS**: Process sales with automatic stock deduction
- **Sales Reports**: View transaction history with filtering and receipt viewing
- **Suppliers**: Manage supplier directory with ratings

### E-Commerce
- **Home Page**: Featured products, categories, and promotional banners
- **Categories**: Browse products by category
- **Products**: Search and filter products with real-time availability
- **About**: Store information and contact details

### Accessibility
- Speech Recognition (Voice Commands)
- Text-to-Speech
- High Contrast Mode
- Large Text Mode
- Keyboard Navigation
- ARIA Labels
- Screen Reader Support

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS
- **Backend**: Firebase
  - Authentication
  - Firestore Database
  - Real-time updates
- **Charts**: Chart.js + React-ChartJS-2
- **Icons**: Lucide React

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd batang-gapan-mini-hardware
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore Database
   - Get your Firebase configuration credentials

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

5. **Set up Firebase Firestore Collections**
   Create the following collections in Firestore:
   - `products`
   - `variants`
   - `sales`
   - `suppliers`
   - `stockin`
   - `users`

6. **Set up Firebase Security Rules**
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

7. **Create Admin Account**
   - Go to Firebase Authentication
   - Add a new user with email: `cyruscabanes@gmail.com`
   - Set password: `551500`

8. **Run the development server**
   ```bash
   npm run dev
   ```

9. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin-specific components
│   ├── ecommerce/      # E-commerce components
│   ├── common/         # Shared components
│   └── ProtectedRoute.jsx
├── pages/
│   ├── admin/          # Admin pages
│   │   ├── AdminLogin.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Inventory.jsx
│   │   ├── StockIn.jsx
│   │   ├── StockOut.jsx
│   │   ├── SalesReports.jsx
│   │   └── Suppliers.jsx
│   └── ecommerce/      # E-commerce pages
│       ├── Home.jsx
│       ├── Categories.jsx
│       ├── Products.jsx
│       └── About.jsx
├── layouts/
│   ├── AdminLayout.jsx
│   └── EcommerceLayout.jsx
├── firebase/
│   ├── config.js
│   └── services.js
├── hooks/
│   ├── useProducts.js
│   ├── useSales.js
│   └── useSuppliers.js
├── context/
│   ├── AuthContext.jsx
│   └── AccessibilityContext.jsx
├── utils/
├── services/
├── assets/
├── App.jsx
├── main.jsx
└── index.css
```

## Admin Credentials

- **Email**: cyruscabanes@gmail.com
- **Password**: 551500

## Accessibility Shortcuts

- `Alt + H`: Toggle High Contrast
- `Alt + L`: Toggle Large Text
- `Alt + S`: Toggle Text-to-Speech
- `Alt + V`: Toggle Voice Commands

## Firebase Collections Structure

### products
```json
{
  "name": "string",
  "category": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### variants
```json
{
  "productId": "string",
  "name": "string",
  "sku": "string",
  "size": "string",
  "unit": "string",
  "price": "number",
  "quantity": "number",
  "reorderLevel": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### sales
```json
{
  "customerName": "string",
  "paymentMethod": "string",
  "items": [{
    "productId": "string",
    "variantId": "string",
    "productName": "string",
    "variantName": "string",
    "sku": "string",
    "quantity": "number",
    "unitPrice": "number",
    "subtotal": "number"
  }],
  "subtotal": "number",
  "discount": "number",
  "discountAmount": "number",
  "grandTotal": "number",
  "totalItems": "number",
  "cashier": "string",
  "status": "string",
  "createdAt": "timestamp"
}
```

### suppliers
```json
{
  "companyName": "string",
  "category": "string",
  "contactPerson": "string",
  "email": "string",
  "phone": "string",
  "status": "string",
  "rating": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### stockin
```json
{
  "email": "string",
  "supplierId": "string",
  "supplierName": "string",
  "productId": "string",
  "variantId": "string",
  "productName": "string",
  "variantName": "string",
  "sku": "string",
  "size": "string",
  "unit": "string",
  "quantity": "number",
  "createdAt": "timestamp"
}
```

## License

This project is proprietary software for Batang Gapan Mini Hardware.

## Support

For support, contact: cyruscabanes@gmail.com
