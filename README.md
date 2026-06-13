# Electric Inventory Manager

A modern, high-contrast, and fully customizable full-stack web application designed for supervising electrical supplier equipment and component inventories. Developed with **React**, **Vite**, **TypeScript**, and styled with **Tailwind CSS**, it features a robust operational suite with fully responsive structures.

---

## 🚀 Key Features

* **Real-time Overview Analytics**: Seamless counters summarizing total catalog value, unique product quantities, and active threshold notifications.
* **Intelligent Threshold Alerts**: Highlight critical and low-level stocks dynamically when quantities fall below individual product safety thresholds.
* **Integrated Audit logs**: Keep a running log of every quantity shift (additions or reductions) with details on times, quantities, and optional custom notes.
* **Supabase Integration & Local Fallback Sync**: A hybrid storage architecture. Runs entirely on zero-configuration client-side `localStorage` by default, but syncs securely to **Supabase Integration** once database parameters are filled under Settings.
* **Tailwind CSS Styling**: Elegant transitions and responsive layouts leveraging a custom dark/light theme and clean modern fonts.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: [React 19](https://react.dev/), [Vite 6](https://vitejs.dev/)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/) (for type safety and reliable autocomplete)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State & Sync**: Hybrid State Manager (`localStorage`/`Supabase` fallbacks)
- **Icons & Visuals**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/)

---

## 💻 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone or download the repository.
2. In the project directory, install the required dependencies:
   ```bash
   npm install
   ```

### Running Locally

To boot up the local development server:

```bash
npm run dev
```

The application will run on **`http://localhost:3000`** (or another port outputted onto your console if 3000 is occupied).

### Product Compilation

To compile a minified, fully optimized production-ready bundle inside the `dist/` folder:

```bash
npm run build
```

---

## 🌐 Setting Up Supabase Database (Optional)

If you wish to use remote, durable database storage instead of browser-local cache, configure a Supabase table structure:

1. **Create an account** on [Supabase](https://supabase.com) and create a project.
2. Under your Project SQL Editor, run the following queries to build tables for `products` and `inventory_logs`:

```sql
-- Create products table
create table products (
  id text primary key,
  name text not null,
  sku text not null,
  category text not null,
  quantity integer not null,
  minThreshold integer not null,
  image_url text,
  brand text,
  description text,
  isUsed boolean not null default false,
  addedAt text not null,
  usedAt text,
  batches jsonb,
  updated_at text not null
);

-- Create inventory_logs table
create table inventory_logs (
  id text primary key,
  productId text not null,
  productName text not null,
  type text not null, -- 'addition', 'reduction', 'update', or 'deletion'
  quantityChange integer not null,
  timestamp text not null,
  notes text
);

-- Optional: Enable public Read/Write Row Level Security (RLS) configuration or leave disabled depending on security policy
```

3. Navigate to the **Settings** panel inside the Electric Inventory Manager interface and input your Supabase URL and Anon API key to immediately establish cloud synchronization.

---

## 📦 Hosting Guide (e.g., Vercel)

This project is tailored for instant deployment on cloud frameworks (such as [Vercel](https://vercel.com)):

1. Push your code repository to [GitHub](https://github.com), [GitLab](https://gitlab.com), or [Bitbucket](https://bitbucket.org).
2. Connect your account to **Vercel** and click **"Add New Project"**.
3. Select this repository.
4. Keep the default configuration directory settings:
   * **Framework Preset**: `Vite` (or `Other` / auto-detected)
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Click **Deploy**. Vercel will build and distribute your static Single Page Application onto a secure global CDN.
