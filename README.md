# FieldPass

SaaS B2B multi-tenant para control de acceso en yacimientos petroleros e instalaciones industriales.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v3 (ClayUI style)
- Supabase (PostgreSQL + Auth + Realtime + Storage + PostGIS)
- TanStack Query v5
- Zustand
- Leaflet + react-leaflet
- react-signature-canvas

## Setup

```bash
# 1. Clonar
git clone https://github.com/welllogproject/WELLLOG.git
cd WELLLOG

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 4. Dev local
npm run dev
```

## Variables de entorno

Ver `.env.example` para la lista completa.

## Migrations SQL

```bash
# Aplicar schema a Supabase
npx supabase db push

# Generar tipos TypeScript desde el schema (requiere Supabase CLI)
npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.types.ts
```

## Deploy

El proyecto está conectado a Vercel. Cada push a `main` hace deploy automático.

## Leer antes de codear

Ver `CLAUDE.md` para arquitectura completa, reglas de negocio y convenciones.
