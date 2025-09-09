# Inventra – Warehouse Management System

**Inventra** is a modern web-based warehouse management application designed to overcome the limitations of outdated inventory systems like Zeron, Microinvest, and Gensoft.
The goal is to provide a **simple, intuitive, and mobile-friendly** interface for managing products, stock, and orders, with built-in support for generating invoices and warranty cards.

---

## 🚀 Tech Stack
- **Next.js 15.5** (React 19, TypeScript 5)
- **Tailwind CSS 4 + shadcn/ui (Radix UI components)**
- **MySQL 8.0+** as the database
- **Drizzle ORM 0.44** for type-safe queries and migrations
- **pdfkit 0.17** for PDF invoice and warranty card generation

---

## 📦 Features
- **Dashboard** with KPIs (profits, clients, payments, low/out of stock products)
- **Product Management** (CRUD with attributes, brands, categories)
- **Order Management** with status, payment type, and document generation
- **Automatic PDF Invoices & Warranty Cards** (stored in `/uploads/invoices`)
- **User Management** with roles (`admin`, `user`, `client`)
- **Responsive Design** – works on desktop and mobile devices
- **Secure Authentication** – hashed passwords and 4-hour session tokens

---

## ⚙️ Requirements
- **CPU:** min. 2 vCPU (Intel i3-8100 / AMD Ryzen 3 1200 or equivalent)
- **RAM:** 2 GB
- **Disk:** 5 GB free (code + database + uploads)
- **Node.js:** LTS 20.x
- **MySQL:** 8.0+
- Works on **Windows 11** or **Linux (Ubuntu/Debian)**

---

## 🔧 Setup
```bash
# Clone repository
git clone https://github.com/your-org/inventra.git
cd inventra

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add DB credentials and ENCRYPT_SECRET

# Run database migrations and seeds
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
