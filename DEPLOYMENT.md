# Deploy Smart Retail POS to Render

The root `render.yaml` Blueprint creates a Render web service for the API and
a Render static site for the React app. It wires the frontend API URL to the
API service automatically. You provide the frontend's public URL as the
backend's allowed CORS origin.

## Before deploying

You need:

- A GitHub repository containing this project and the `render.yaml` file.
- A MongoDB Atlas database.
- A Resend account with a verified sending domain and API key. Password resets
  send a one-time code by email; the sender address must belong to a domain
  verified in Resend.

Never commit `.env` files, a MongoDB URI, a Resend API key, or a JWT secret.
The checked-in `.env.example` files contain placeholders only.

## 1. Prepare MongoDB Atlas

1. Create a database user with a strong password and read/write access to the
   application database.
2. Create or select the `smart_retail_pos` database and copy its **Drivers**
   connection string. URL-encode special characters in the database password.
3. Configure Atlas Network Access so Render can connect. Render's free web
   services do not provide fixed outbound IP addresses; allowing `0.0.0.0/0`
   is the simplest option, but exposes the database endpoint to the internet.
   Use a strong database password and least-privilege database user. For a
   production setup requiring network-level restriction, use a Render plan
   with static outbound IPs and allowlist those IPs in Atlas.
4. Keep this URI private. You will enter it into Render as `MONGO_URI`.

MongoDB Atlas supports the replica-set transactions used by POS checkout and
order cancellation. Do not substitute a standalone MongoDB server.

## 2. Prepare password-reset email

1. In Resend, create an API key and verify the domain you will send from.
2. Choose a sender address on that verified domain, such as
   `Smart Retail POS <reset@example.com>`.
3. Keep the API key private. You will enter it into Render as
   `RESEND_API_KEY`; enter the sender address as `EMAIL_FROM`.

The API intentionally refuses to start in production if these two settings are
missing, so password resets are not silently deployed in a broken state.

## 3. Deploy the Blueprint

1. Push the project to GitHub. Include `render.yaml`, both package lockfiles,
   and the application source. Do not push either `.env` file.
2. In Render, choose **New → Blueprint**, connect the repository, and select
   the branch to deploy.
3. Review the two services in `render.yaml`: `smart-retail-pos-api` and
   `smart-retail-pos`.
4. When prompted, enter:
   - `MONGO_URI`: the Atlas connection string.
   - `RESEND_API_KEY`: the Resend API key.
   - `EMAIL_FROM`: the verified sender address.
   - `CLIENT_ORIGIN`: the frontend URL, such as
     `https://smart-retail-pos.onrender.com` (no trailing slash). If Render
     assigns a different URL, update this variable in the API service after
     deployment and redeploy it.
   - `JWT_SECRET`: generate a long, random secret in Render; do not reuse a
     password or commit it to the repository.
5. Deploy the Blueprint and wait for both services to finish. The API health
   check is `/health`; it returns success only when MongoDB is connected.
   Render supplies the frontend and backend host values to each other.

The included API uses Render's free web-service plan. Free web services can
spin down when idle, so the first request after inactivity may take longer.
For a checkout system that needs consistently fast availability, choose an
always-on paid API plan in Render.

## 4. Create the first Admin

Self-registration creates Cashier accounts only. Create the first Admin once
before managing products, inventory, or staff:

1. Make a backup copy of `backend/.env` if it already exists.
2. Temporarily set `MONGO_URI` in `backend/.env` to the same production Atlas
   database configured in Render. If connecting from your computer, add your
   current IP to Atlas Network Access first.
3. From the `backend` directory, run:

   ```powershell
   npm run create-admin
   ```

4. Enter the Admin name, email, and a strong password. The command creates an
   account; it does not clear or seed the database.
5. Restore your original local `backend/.env` (or remove the temporary
   production URI). Never commit or share it.

If the database already has accounts, do not create another first Admin; sign
in with an existing Admin account instead.

## 5. Verify the live app

Use the URLs shown in the Render dashboard:

1. Open the API URL followed by `/health`; expect JSON containing
   `"status":"ok"` and `"database":"connected"`.
2. Open the static-site URL and refresh `/login`, `/forgot-password`, and
   `/reset-password` directly. They should load the React app rather than a
   Render 404.
3. Sign in as Admin. Add a product and adjust stock; verify both in Products
   and Inventory.
4. Complete a POS checkout with a test product. Verify the order appears in
   Orders and stock decreases. If desired, cancel a pending order and confirm
   stock is restored.
5. Check dashboards and Reports. Download both CSV and PDF exports.
6. Request a password reset for a test account, retrieve the emailed code,
   submit it before its 15-minute expiry, and sign in with the new password.
7. Register a separate test account and verify it receives the Cashier role.
   Confirm that only Admins can access Team Management.

If any check fails, inspect the corresponding service's **Logs** in Render.
Do not post logs containing tokens, email reset codes, database URIs, or API
keys publicly.

## Local development

Copy `.env.example` to `.env` in the project root and
`backend/.env.example` to `backend/.env`. Set the backend MongoDB URI and a
private development JWT secret. Start the API and frontend using the commands
in the root README. In production, set `VITE_API_BASE_URL` to the API host or
full API URL; the Render Blueprint configures this automatically.
