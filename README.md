# 🛒 Smart-Retail-POS

> Smart Billing. Seamless Inventory. Powerful Retail Management.

Smart-Retail-POS is a modern **Omnichannel Retail POS & Inventory Management System** built with the MERN Stack. It helps businesses manage products, billing, inventory, orders, sales analytics, and multi-role access from a single platform.

For the Render deployment Blueprint, production email setup, and post-deploy
feature checklist, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT Authentication
- Role-Based Access Control (RBAC)
- Admin, Manager & Cashier Roles
- Secure Password Hashing with bcrypt

### 📊 Dashboard
- Total Sales
- Total Orders
- Revenue Analytics
- Top Selling Products
- Recent Transactions
- Low Stock Alerts

### 📦 Product Management
- Add Products
- Edit Products
- Delete Products
- Search Products
- Category Filters
- Product Images
- SKU & Barcode Support

### 🛒 POS Billing System
- Fast Product Search
- Add to Cart
- Quantity Controls
- Discount Support
- GST Calculation
- Cash / Card / UPI Payment
- Invoice Generation
- Printable Receipt

### 📈 Inventory Management
- Real-Time Stock Updates
- Low Stock Alerts
- Inventory Logs
- Multi-store Inventory Support

### 📑 Orders Management
- Order History
- Order Details
- Order Status Tracking

### 📉 Reports & Analytics
- Daily Sales Reports
- Monthly Revenue Reports
- Product Performance
- Export CSV/PDF

---

# 🛠 Tech Stack

## Frontend
- React.js (Vite)
- Tailwind CSS
- React Router DOM
- Axios
- Framer Motion
- Recharts
- React Hot Toast

## Backend
- Node.js
- Express.js
- JWT Authentication
- bcryptjs
- MongoDB + Mongoose persistence

The dashboards and operational pages refresh API data every 30 seconds and when
the browser tab regains focus. All application data comes from the backend API
and MongoDB; demo and offline fallback data are not used.

## Database
- MongoDB Atlas
- Mongoose

## DevOps
- Docker
- GitHub Actions
- AWS / Vercel

---

# 📁 Project Structure

```bash
Smart-Retail-POS/

├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   └── store/
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── utils/
├── index.html
├── package.json
└── vite.config.js
```

---

# 🚀 Installation

## 1. Create a MongoDB Atlas database

1. Create a free MongoDB Atlas cluster.
2. In **Database Access**, create a database username and password. These are
   separate from your MongoDB Atlas website login.
3. In **Network Access**, add your current IP address so your computer can
   connect. Avoid allowing access from every IP address for a real deployment.
4. Open **Connect → Drivers**, choose Node.js, and copy the connection string.
   Replace the password placeholder and add `smart_retail_pos` as the database
   name in the URL path.

The connection string is a secret: put it only in `backend/.env`, never in the
React app, GitHub, or a message.

## 2. Configure and start the backend

From the project root, copy the example settings and open them to edit:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
if (-not (Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
notepad backend\.env
```

In the file, set `MONGO_URI` to your Atlas connection string and `JWT_SECRET`
to a long, private value. If `backend\.env` already exists, keep it and check
that these settings are correct. Keep this file private and do not upload it.

Then, from the project root, start the backend:

```bash
cd backend

npm install

npm run create-admin

npm run dev
```

For a fresh database, the setup command asks for your first Admin name, email,
and password and stores the password securely. If this Atlas database already
has accounts, sign in with an existing account instead of creating another
Admin. The database and collections are created automatically as you add data;
there is no seed command.

The API runs at:

```bash
http://localhost:5000
```

## 3. Start the frontend

Open a second terminal at the project root (the folder containing the root
`package.json`):

```bash
npm install

npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

Sign in with the Admin account created above. Add products and other records in
the application; the dashboards and pages then read the saved data from Atlas.
Self-signup creates cashier accounts.

---

# 🔐 Authentication APIs

| Method | Endpoint |
|--------|-----------|
| POST | /api/auth/register |
| POST | /api/auth/login |
| GET | /api/auth/me |

---

# 📦 Product APIs

| Method | Endpoint |
|--------|-----------|
| POST | /api/products |
| GET | /api/products |
| PUT | /api/products/:id |
| DELETE | /api/products/:id |

---

# 🛒 Order APIs

| Method | Endpoint |
|--------|-----------|
| POST | /api/orders/checkout |
| GET | /api/orders |
| PUT | /api/orders/:id/status |

---

# 📊 Inventory APIs

| Method | Endpoint |
|--------|-----------|
| GET | /api/inventory |
| PUT | /api/inventory/:productId/stock |

---

# 📈 Dashboard / Reports APIs

| Method | Endpoint |
|--------|-----------|
| GET | /api/dashboard/stats |
| GET | /api/dashboard/revenue |
| GET | /api/dashboard/report-highlights |

---

# 🔒 Security

- JWT Authentication
- bcrypt Password Hashing
- Role-Based Authorization
- Environment Variables
- Input Validation
- MongoDB Injection Protection
- CORS Enabled

---

# 📷 Screenshots

Add screenshots here:

- Login Page
- Dashboard
- POS Billing Screen
- Inventory Page
- Orders Page
- Reports Dashboard

---

# 🧠 Future Enhancements

- Barcode Scanner
- Multi-store Support
- AI Sales Prediction
- Cloudinary Image Upload
- Redis Caching
- Docker Deployment
- CI/CD Pipeline

---

# 👨‍💻 Author

**Ayush Singh**

### 🚀 RetailX
**Smart Billing. Seamless Inventory. Powerful Retail Management.**
