# Amazon-Style Address Selection System - Setup Guide

## Overview
Your Checkout Page has been upgraded to a premium Amazon-style Address Selection system with the following features:

- ✅ Saved address management (View, Add, Edit, Delete)
- ✅ Default address functionality
- ✅ Premium card-based UI with Amazon-style design
- ✅ Mobile-first responsive layout
- ✅ TypeScript types and error handling
- ✅ Supabase database integration

## Database Setup

### 1. Run the user_addresses table creation
```sql
-- Execute this in your Supabase SQL editor
-- File: database/user_addresses_schema.sql
```

### 2. Update orders table
```sql
-- Execute this in your Supabase SQL editor
-- File: database/update_orders_table.sql
```

## File Structure Created

```
src/
├── types/
│   └── address.ts                    # TypeScript types
├── hooks/
│   └── useUserAddresses.ts          # Custom hook for address management
├── components/checkout/
│   ├── AddressCard.tsx              # Address card component
│   └── AddAddressModal.tsx          # Add/Edit address modal
└── pages/
    └── Checkout.tsx                 # Updated checkout page

database/
├── user_addresses_schema.sql        # Table creation script
└── update_orders_table.sql          # Orders table update
```

## Features Implemented

### Address Management
- **View Addresses**: Grid layout showing all saved addresses
- **Add Address**: Modal form with validation
- **Edit Address**: Pre-filled modal for editing
- **Delete Address**: Confirmation dialog before deletion
- **Default Address**: Star badge and set default functionality
- **Address Types**: Home/Work/Other with color-coded badges

### UI Features
- **Selected State**: Blue border highlight for selected address
- **Default Badge**: Yellow star badge for default addresses
- **Loading States**: Spinner while fetching addresses
- **Empty State**: Prompt to add first address
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Mobile-first with grid layout on desktop

### Form Validation
- Full Name (required)
- Phone Number (10-digit validation)
- Address Line 1 (required)
- City, State, Pincode (required, 6-digit pincode validation)
- Landmark (optional)
- Address Type dropdown
- Set as default checkbox

## Usage Instructions

### For Users
1. Go to Checkout page
2. View saved addresses in card format
3. Click "Deliver Here" to select an address
4. Use "Add New Address" button to add new addresses
5. Edit/Delete addresses using the respective buttons
6. Set any address as default using the star button

### For Developers
1. All components use TypeScript with proper typing
2. Custom hook `useUserAddresses` handles all CRUD operations
3. Supabase RLS policies ensure users can only access their own addresses
4. Error handling with user-friendly messages
5. Loading states for better UX

## Database Schema

### user_addresses table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to users)
- full_name: VARCHAR(255)
- phone_number: VARCHAR(20)
- address_line_1: TEXT
- address_line_2: TEXT (Optional)
- city: VARCHAR(255)
- state: VARCHAR(255)
- pincode: VARCHAR(10)
- landmark: TEXT (Optional)
- address_type: ENUM('home', 'work', 'other')
- is_default: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### orders table (updated)
```sql
- delivery_address_id: UUID (Foreign Key to user_addresses)
```

## Color Scheme
- **Primary Blue**: #00C4CC (accent color)
- **Home Type**: Green badge
- **Work Type**: Blue badge  
- **Other Type**: Gray badge
- **Default Badge**: Yellow background
- **Selected State**: Blue border (#00C4CC)
- **Error State**: Red accents

## Next Steps
1. Execute the SQL scripts in Supabase
2. Test the complete flow by adding/editing/deleting addresses
3. Implement order creation with `delivery_address_id`
4. Add Razorpay payment integration
5. Test on mobile devices for responsiveness

## Production Considerations
- All database queries use RLS policies
- Input validation on both client and server
- Error boundaries for better error handling
- Loading states prevent duplicate submissions
- Responsive design works on all screen sizes
