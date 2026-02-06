# Restaurant Management API Documentation

## Endpoints

Base URL: `http://localhost:5000/api/admin/restaurants`

All endpoints require:
- **Authentication**: Bearer token in Authorization header
- **Role**: Admin

---

### 1. Get All Restaurants
**GET** `/`

**Query Parameters:**
- `status` (optional): Filter by owner status ('Active' | 'Inactive')
- `search` (optional): Search by restaurant name, owner name, or email
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "restaurants": [
    {
      "RestaurantID": 1,
      "restaurantName": "Phở Hà Nội",
      "Logo": "/logos/pho-hanoi.png",
      "Description": "Phở truyền thống",
      "TaxCode": "0123456789",
      "Website": "https://phohanoi.vn",
      "ownerID": 2,
      "ownerName": "Nguyen Van A",
      "ownerEmail": "owner1@example.com",
      "ownerPhone": "0912345678",
      "ownerStatus": "Active",
      "registeredDate": "2026-01-01T00:00:00.000Z",
      "branchCount": 3,
      "currentPackage": "Pro",
      "packageExpiryDate": "2026-01-31T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### 2. Get Restaurant Details
**GET** `/:id`

**Response:**
```json
{
  "restaurant": {
    "RestaurantID": 1,
    "Name": "Phở Hà Nội",
    "Logo": "/logos/pho-hanoi.png",
    "Description": "Phở truyền thống",
    "TaxCode": "0123456789",
    "Website": "https://phohanoi.vn",
    "ownerID": 2,
    "ownerUsername": "owner1",
    "ownerName": "Nguyen Van A",
    "ownerEmail": "owner1@example.com",
    "ownerPhone": "0912345678",
    "ownerStatus": "Active",
    "registeredDate": "2026-01-01T00:00:00.000Z"
  },
  "branches": [
    {
      "BranchID": 1,
      "Name": "Chi nhánh Hoàn Kiếm",
      "Address": "123 Hàng Bạc, Hoàn Kiếm, Hà Nội",
      "Phone": "0241234567",
      "OpeningHours": "8:00 - 22:00",
      "IsActive": true,
      "managerName": "Tran Van B",
      "tableCount": 15
    }
  ],
  "subscriptions": [
    {
      "SubscriptionID": 1,
      "StartDate": "2026-01-01T00:00:00.000Z",
      "EndDate": "2026-01-31T00:00:00.000Z",
      "Status": "Active",
      "AutoRenew": true,
      "PackageName": "Pro",
      "Price": 1000000
    }
  ],
  "tickets": [
    {
      "TicketID": 1,
      "Subject": "Lỗi thanh toán",
      "Description": "Không thể thanh toán qua VNPay",
      "Priority": "High",
      "Status": "Open",
      "CreatedAt": "2026-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Restaurant Statistics
**GET** `/:id/stats`

**Response:**
```json
{
  "totalRevenue": 3500000,
  "subscriptionCount": 4,
  "branchCount": 3,
  "totalTables": 45,
  "activeSubscription": {
    "PackageName": "Pro",
    "EndDate": "2026-01-31T00:00:00.000Z",
    "AutoRenew": true
  }
}
```

---

### 4. Update Restaurant Info
**PATCH** `/:id`

**Request Body:**
```json
{
  "name": "Phở Hà Nội Chính Gốc",
  "description": "Phở truyền thống từ 1950",
  "website": "https://phohanoi-update.vn",
  "logo": "/logos/new-logo.png"
}
```

**Response:**
```json
{
  "message": "Restaurant updated successfully"
}
```

---

### 5. Deactivate Restaurant (Soft Delete)
**POST** `/:id/deactivate`

**Request Body:**
```json
{
  "reason": "Bị khách hàng report nhiều lần"
}
```

**Response:**
```json
{
  "message": "Restaurant deactivated successfully"
}
```

---

### 6. Reactivate Restaurant
**POST** `/:id/reactivate`

**Response:**
```json
{
  "message": "Restaurant reactivated successfully"
}
```

---

### 7. Force Delete Restaurant (Permanent)
**DELETE** `/:id`

**Response:**
```json
{
  "message": "Restaurant permanently deleted"
}
```

**⚠️ Warning:** This action cannot be undone. It will:
- Delete the restaurant record
- Delete all branches (CASCADE)
- Delete all tables (CASCADE)
- Delete all orders (CASCADE)
- Delete the owner user account

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Admin role required."
}
```

### 404 Not Found
```json
{
  "message": "Restaurant not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error message"
}
```

---

## Usage Examples

### Using cURL

```bash
# Get all restaurants
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/admin/restaurants?page=1&limit=10"

# Get restaurant details
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/admin/restaurants/1"

# Deactivate restaurant
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Report từ khách hàng"}' \
  "http://localhost:5000/api/admin/restaurants/1/deactivate"
```

### Using Axios (Frontend)

```javascript
import axios from 'axios';

const token = localStorage.getItem('token');
const api = axios.create({
  baseURL: 'http://localhost:5000/api/admin/restaurants',
  headers: { Authorization: `Bearer ${token}` }
});

// Get all restaurants
const restaurants = await api.get('/', {
  params: { status: 'Active', page: 1, limit: 10 }
});

// Deactivate
await api.post('/1/deactivate', { reason: 'Violation' });
```
