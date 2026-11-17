# 🎓 JB Institute of Technology ERP - Student Management & Fee Management System

A production-ready, full-stack College ERP web application engineered with **React 18, Vite, Tailwind CSS, Node.js, Express, MongoDB, and Mongoose**. Features role-based access control (`STUDENT` & `ADMIN`), authoritative dynamic fee calculations, automated PDF receipts, online fee payment simulation (with Sandbox & Razorpay-ready architecture), academic attendance tracking, disciplinary fine imposition, and executive analytics.

---

## 🚀 Key Features

### 👨‍🎓 Student Portal
- **Secure Authentication**: Register and login via Mobile, Email, or University Roll Number with JWT & bcrypt password hashing.
- **Dashboard Overview**: Immediate visibility into Total Fees, Paid Amount, Current Outstanding Due, Penalties, Extra Credit, and Attendance %.
- **Authoritative Fee Breakdown**: Transparent breakdown of Tuition, Other Charges, Unpaid Fines, Net Payable, and Complete Payment History.
- **Online Fee Payment**: Pay full due or custom installments using a realistic Sandbox Gateway (simulates UPI, Cards, Net Banking) with instant balance recalculation.
- **Digital PDF Receipts**: Download and print officially formatted PDF receipts with unique receipt numbers, transaction IDs, breakdown, and college seal.
- **Academic Attendance**: Subject-wise percentage gauges, attended vs total classes, and clearance indicators.
- **Fines & Penalties**: Itemized ledger of late fees, library charges, and disciplinary fines with real-time impact on total payable.

### 🛡️ Admin Management Panel
- **Executive Analytics Dashboard**: Real-time revenue metrics, today's collections, total outstanding balance, 6-month collection trend bar chart, and payment status breakdown.
- **Student Enrollment**: Add, view, edit, search (name, mobile, roll no, reg no), filter (course, semester, status), and activate/deactivate students.
- **Dynamic Fee Configuration**: Set each student's Academic Fee and Other Charges with a real-time live preview of resulting dues.
- **Global Transaction Ledger**: Filter all college payments by status (`SUCCESS`, `PENDING`, `FAILED`), date range, or payment method, with one-click receipt downloads.
- **Attendance Administration**: Record, modify, or delete subject attendance with automatic percentage calculation.
- **Fine Imposition**: Impose fines (Late Fee, Library Fine, Attendance Fine, Examination Fine, Other) and mark them as paid or unpaid.
- **Reports & Exporting**: Audit sheets for student dues, transaction histories, and penalty collections with **CSV Export** and **Print/PDF formatting**.

---

## 🧮 Authoritative Financial Calculation Formula

The system **never** manually updates or stores a decoupled "due amount" that can drift out of sync:

$$\text{Total Payable} = \text{Academic Fee} + \text{Other Charges} + \sum(\text{Unpaid Fines})$$
$$\text{Total Paid} = \sum(\text{SUCCESS Payments})$$
$$\text{Remaining Due} = \max(\text{Total Payable} - \text{Total Paid}, 0)$$
$$\text{Extra Payment} = \max(\text{Total Paid} - \text{Total Payable}, 0)$$

> [!NOTE]
> Only **SUCCESS** payments reduce the student's due. Failed, pending, or cancelled transactions never alter the payable balance.

---

## 📂 Project Structure

```
college-erp/
│
├── backend/
│   ├── src/
│   │   ├── config/             # db.js (with auto in-memory fallback), env.js
│   │   ├── controllers/        # auth, student, admin, payment controllers
│   │   ├── middleware/         # JWT auth, role RBAC, errorHandler
│   │   ├── models/             # Student, Admin, Fee, Fine, Attendance, Payment
│   │   ├── routes/             # auth, student, admin, payment routes
│   │   ├── services/           # feeService, receiptPdfService, paymentGatewayService
│   │   ├── utils/              # apiResponse, receiptNumberGenerator
│   │   ├── seed/               # seedData.js (Demo credentials & scenarios)
│   │   ├── app.js              # Express app setup & CORS
│   │   └── server.js           # Server entry point
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # StatCard, StatusBadge, Modal, ReceiptModal, SandboxPaymentModal
│   │   ├── context/            # AuthContext.jsx
│   │   ├── layouts/            # DashboardLayout.jsx
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, ForgotPassword
│   │   │   ├── student/        # StudentDashboard, StudentFees, PayFees, PaymentHistory, Receipts, Attendance, Fines, Profile
│   │   │   └── admin/          # AdminDashboard, AdminStudents, StudentDetails, AdminFees, AdminPayments, AdminAttendance, AdminFines, AdminReports
│   │   ├── services/           # api.js (Axios with Bearer interceptors)
│   │   ├── utils/              # formatters.js
│   │   ├── App.jsx             # Router and ProtectedRoute configuration
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind design tokens
│   ├── .env.example
│   ├── .env
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: (Optional) Local MongoDB server at `mongodb://127.0.0.1:27017/college_erp` or MongoDB Atlas URI. If no local MongoDB is running, the backend includes automatic in-memory MongoDB fallback for instant zero-configuration execution.

---

### 1. Backend Setup

```bash
cd college-erp/backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Review and adjust `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/college_erp
USE_IN_MEMORY_DB=true   # Set to false if you have a running local/Atlas MongoDB
JWT_SECRET=college_erp_jwt_secret_secure_key_998877
JWT_EXPIRES_IN=7d
COLLEGE_NAME=JB Institute of Technology
COLLEGE_CODE=JBIT-101
```

#### Run Database Seed Script
To pre-populate demo admin and students:
```bash
npm run seed
```

#### Start Backend Server
```bash
npm run dev
# Server will run on http://localhost:5000
```

---

### 2. Frontend Setup

```bash
cd college-erp/frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Ensure `frontend/.env` points to your backend:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_COLLEGE_NAME=JB Institute of Technology
VITE_COLLEGE_CODE=JBIT-101
```

#### Start Frontend Dev Server
```bash
npm run dev
# Frontend will run on http://localhost:5173
```

---

## 🔑 Demo Login Credentials

You can use the one-click demo login buttons on the login page or enter these credentials:

| Role | Email / Identifier | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | `Admin@123` | Full access to all student records, fee setup, transactions, and reports. |
| **Student (Rahul)** | `rahul@college.edu` (or `23BCSE0101`) | `Student@123` | B.Tech CSE (Sem 4). Total Fee: ₹70,000, Paid: ₹40,000, Unpaid Fine: ₹1,500. **Current Due: ₹31,500**. |
| **Student (Priya)** | `priya@college.edu` (or `23BCSE0102`) | `Student@123` | B.Tech CSE (Sem 4). Fully cleared dues. **Current Due: ₹0**. High attendance (96%). |
| **Student (Amit)** | `amit@college.edu` (or `24BCA0201`) | `Student@123` | BCA (Sem 2). No payments made. Attendance shortage. **Current Due: ₹49,500**. |
| **Student (Sneha)** | `sneha@college.edu` (or `22BME0301`) | `Student@123` | B.Tech ME (Sem 6). Overpaid account. **Current Due: ₹0, Extra Credit: ₹2,000**. |

---

## 🌐 REST API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/student/register` - Register a new student account
- `POST /api/auth/student/login` - Student login (Email / Mobile / Roll + Password)
- `POST /api/auth/admin/login` - Admin login (Email + Password)
- `GET /api/auth/me` - Retrieve current authenticated profile & role
- `POST /api/auth/forgot-password` - Reset password for student or admin

### Student Portal (`/api/student`) - *Requires Bearer Token & Student Role*
- `GET /api/student/dashboard` - Dashboard metrics, recent payments, attendance snapshot
- `GET /api/student/profile` - Student academic and personal profile
- `PUT /api/student/profile` - Update student contact particulars
- `GET /api/student/fees` - Authoritative fee summary and complete payment ledger
- `GET /api/student/payments` - List of student transactions
- `GET /api/student/attendance` - Subject-wise attendance and percentage
- `GET /api/student/fines` - List of penalties and unpaid fine status

### Admin Management (`/api/admin`) - *Requires Bearer Token & Admin Role*
- `GET /api/admin/dashboard` - Executive stats, collection trends, payment distribution
- `GET /api/admin/students` - Paginated student directory with search and filters
- `POST /api/admin/students` - Enroll a new student and create fee record
- `GET /api/admin/students/:id` - 360° student details (Profile, Fees, Payments, Attendance, Fines)
- `PUT /api/admin/students/:id` - Update student details
- `DELETE /api/admin/students/:id` - Delete student and cascade associated records
- `GET /api/admin/fees/:studentId` - Get student fee structure
- `PUT /api/admin/fees/:studentId` - Update Academic Fee & Other Charges (recalculates immediately)
- `GET /api/admin/payments` - Global transaction ledger with multi-criteria filters
- `GET /api/admin/attendance/:studentId` - Get student attendance
- `POST /api/admin/attendance` - Add attendance record for subject
- `PUT /api/admin/attendance/:id` - Update attendance record
- `DELETE /api/admin/attendance/:id` - Delete attendance record
- `GET /api/admin/fines/:studentId` - Get fines for student
- `POST /api/admin/fines` - Impose new fine on student
- `PUT /api/admin/fines/:id` - Update fine or mark paid/unpaid
- `DELETE /api/admin/fines/:id` - Delete fine
- `GET /api/admin/reports/fees` - Student-wise dues and fee configuration report
- `GET /api/admin/reports/payments` - Financial collections report
- `GET /api/admin/reports/fines` - Penalty collection report

### Payments & Receipts (`/api/payments`) - *Requires Bearer Token*
- `POST /api/payments/create` - Initiate pending payment order
- `POST /api/payments/verify` - Verify and reconcile payment status
- `GET /api/payments/:id` - Get payment transaction details
- `GET /api/payments/:id/receipt` - Stream official vector PDF receipt

---

## 💳 Payment Gateway Integration (Razorpay / Production)

The payment architecture is decoupled inside `backend/src/services/paymentGatewayService.js`.

To connect a live gateway like **Razorpay**:
1. Install the SDK in backend:
   ```bash
   npm install razorpay
   ```
2. Add your credentials to `backend/.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
   RAZORPAY_KEY_SECRET=yyyyyyyyyyyyyyyy
   ```
3. In `backend/src/services/paymentGatewayService.js`, replace `createPaymentOrder` with Razorpay orders instance:
   ```javascript
   import Razorpay from 'razorpay';
   const razorpay = new Razorpay({
     key_id: process.env.RAZORPAY_KEY_ID,
     key_secret: process.env.RAZORPAY_KEY_SECRET,
   });
   
   const rzpOrder = await razorpay.orders.create({
     amount: amount * 100, // paise
     currency: 'INR',
     receipt: receiptNumber,
   });
   ```
4. Verify the cryptographic HMAC SHA256 signature in `verifyAndProcessPayment`:
   ```javascript
   const crypto = require('crypto');
   const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
   hmac.update(`${orderId}|${paymentId}`);
   const digest = hmac.digest('hex');
   if (digest !== razorpaySignature) throw new Error('Invalid signature');
   ```

---

## 🚢 Production Deployment Instructions

### 1. Build Frontend
```bash
cd college-erp/frontend
npm run build
```
This produces an optimized production bundle in `college-erp/frontend/dist`.

### 2. Host Backend & Static Assets
You can serve the Vite frontend build directly through Express in production by serving `dist`:
```javascript
// In backend/src/app.js
import path from 'path';
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend/dist', 'index.html'));
  });
}
```

### 3. Deploy to Cloud (Render / Railway / AWS / DigitalOcean)
1. Provision a MongoDB Atlas cluster and set `MONGODB_URI` in environment variables.
2. Set `NODE_ENV=production` and `USE_IN_MEMORY_DB=false`.
3. Set a strong, randomly generated `JWT_SECRET`.
4. Deploy using PM2 or Docker container:
   ```bash
   pm2 start src/server.js --name "college-erp"
   ```

---

## 📜 License & Compliance
This software is developed for institutional academic governance and adheres to standard college ERP workflows, data privacy, and role-based data isolation standards.
