# Smart Retail POS — Backend

Node.js + Express + MongoDB (Mongoose) + JWT backend built to match the Smart Retail POS React frontend exactly — same data shapes, same roles, same pricing logic (18% GST, 5% discount over ₹5000).

## Tech stack
- Express (ESModules)
- MongoDB + Mongoose
- JWT auth (Bearer token) with role-based access (Admin, Manager, Cashier)
- bcryptjs for password hashing

## MongoDB Atlas setup

1. Create a free cluster in MongoDB Atlas.
2. In **Database Access**, create a database username and password. These are
   separate from your MongoDB Atlas website login.
3. In **Network Access**, add your current IP address so your computer can
   connect.
4. Choose **Connect → Drivers → Node.js** and copy the connection string.
   Replace the password placeholder and add `/smart_retail_pos` before the `?`
   query string. If the password contains special characters, URL-encode them.
5. In PowerShell, from this `backend` folder, copy `.env.example` to `.env`:

   ```powershell
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   notepad .env
   ```

   Put the Atlas connection string in `MONGO_URI`, and replace `JWT_SECRET`
   with a long, private value. If `.env` already exists, keep it and check the
   values rather than overwriting it. Never commit or share `.env`.

For example, the URI should look like this (with your real values substituted):

```text
mongodb+srv://<database-user>:<encoded-password>@<your-cluster>.mongodb.net/smart_retail_pos?retryWrites=true&w=majority&appName=smart-retail-pos
```

Atlas supports the transactions used by checkout and order cancellation. The app
creates its database collections automatically when records are first saved.

## Run the backend and create the first Admin

```bash
npm install
npm run create-admin
npm run dev
```

Run these commands from this `backend` folder after configuring `.env`.
For a fresh database, `npm run create-admin` asks for the first Admin name,
email, and password and stores the password securely. Do not run it if this
database already has accounts; sign in with an existing account instead. The
command does not erase or seed any data. Then start the frontend from the
project root with `npm install` and `npm run dev`. Registering through the app
creates a Cashier account; an Admin can create Manager and additional Admin
accounts from User Management.

The API runs at `http://localhost:5000`.

## API Reference

### Auth — `/api/auth`
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/register` | Public | `{ name, email, password, role, store }` |
| POST | `/login` | Public | `{ email, password }` → `{ user, token }` |
| GET | `/me` | Private | Returns current user from token |
| POST | `/forgot-password` | Public | `{ email }` — sends a 15-minute reset code by email in production |
| POST | `/reset-password` | Public | `{ email, token, password }` — requires a valid, unexpired reset token |

### Products — `/api/products` (all routes require auth)
| Method | Route | Access |
|---|---|---|
| GET | `/?search=&category=` | Any logged-in user |
| GET | `/top?limit=5` | Any |
| GET | `/barcode/:barcode` | Any |
| GET | `/:id` | Any |
| POST | `/` | Admin, Manager — optional `imageUrl` (public HTTP/HTTPS image URL) |
| PUT | `/:id` | Admin, Manager — may update `imageUrl` |
| DELETE | `/:id` | Admin, Manager |

### Orders — `/api/orders` (all routes require auth)
| Method | Route | Notes |
|---|---|---|
| GET | `/?status=` | List orders, optional status filter |
| GET | `/recent?limit=5` | Most recent orders |
| POST | `/checkout` | Body: `{ items: [{ productId, quantity }], customer, payment }`. Atomically decrements stock, logs inventory movement, creates the order. |
| GET | `/:id` | Single order |
| PUT | `/:id/status` | Admin, Manager — `{ status }` — Pending / Processing / Completed / Cancelled. Completed and cancelled orders are final; cancelling a pending/processing order restores stock and records inventory movement. |

### Inventory — `/api/inventory` (all routes require auth)
| Method | Route | Access |
|---|---|---|
| GET | `/` | Any — shaped for InventoryPage table |
| GET | `/summary` | Any — active warehouses, low-stock count, channel count |
| GET | `/:productId/logs` | Any — stock movement history |
| PUT | `/:productId/stock` | Admin, Manager — body: `{ delta, reason }` (+ve = stock in, -ve = stock out) |

### Dashboard / Reports — `/api/dashboard` (all routes require auth)
| Method | Route | Notes |
|---|---|---|
| GET | `/stats` | Today's sales, total orders, revenue, low stock alerts |
| GET | `/revenue?months=8` | Monthly revenue trend for the area chart |
| GET | `/sales-channel` | Payment-method split for the donut chart |
| GET | `/report-highlights` | Daily / weekly / monthly revenue + inventory value |

## Notes
- All protected routes expect `Authorization: Bearer <token>`.
- Checkout and cancellation use MongoDB transactions to keep order, stock, and inventory-log changes atomic.
- Product edits cannot change stock directly; use the inventory adjustment endpoint so all stock movements are logged.
- Password reset sends a one-time code using Resend. Configure `RESEND_API_KEY`
  and `EMAIL_FROM` in the backend environment; the sender must belong to a
  verified Resend domain. Production startup fails if either setting is absent.
- For the Render Blueprint, Atlas network setup, initial production Admin, and
  end-to-end deployment checks, see [../DEPLOYMENT.md](../DEPLOYMENT.md).
