# Prode Digital Tecnoprop 2026

Plataforma de pronósticos para el Mundial 2026.

## Stack

- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Estilos**: Tailwind CSS con tema Tecnoprop
- **Backend**: Supabase (Auth + PostgreSQL + Realtime + Edge Functions)
- **Deploy**: Vercel
- **Email**: Resend
- **API partidos**: API-Football

## Configuración inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Completar con tus keys de Supabase, API-Football y Resend.

### 3. Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar `supabase/schema.sql`
3. En **Authentication > Email Templates**, personalizar los emails con el branding Tecnoprop
4. En **Authentication > URL Configuration**:
   - Site URL: `https://prode.tecnoprop.ar`
   - Redirect URLs: `https://prode.tecnoprop.ar/auth/callback`

### 4. Correr en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Estructura del proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── auth-pages/        # Registro e login
│   │   ├── register/
│   │   └── login/
│   ├── dashboard/         # Dashboard del usuario
│   ├── partidos/          # Lista de partidos + pronósticos
│   ├── ranking/           # Ranking general y mini ligas
│   ├── admin/             # Panel administrador
│   └── auth/callback/     # Handler de Supabase Auth
├── components/
│   ├── layout/            # Navbar, Footer
│   ├── prode/             # MatchCard, Countdown, RankingList
│   └── ui/                # Botones, Inputs, etc.
├── lib/
│   ├── supabase/          # Clientes browser/server
│   └── utils.ts           # Helpers
└── types/
    └── index.ts           # TypeScript types + constants
supabase/
└── schema.sql             # Schema completo de la DB
```

## Deploy en Vercel

1. Conectar repo en [vercel.com](https://vercel.com)
2. Agregar variables de entorno en Vercel Dashboard
3. Configurar dominio `prode.tecnoprop.ar`
4. En WordPress, agregar redirect: `tecnoprop.ar/prode` → `prode.tecnoprop.ar`

## Sistema de puntos

| Resultado         | Puntos |
|-------------------|--------|
| Exacto            | +3     |
| Ganador correcto  | +1     |
| Empate correcto   | +1     |
| Campeón (bonus)   | +10    |
| Goleador (bonus)  | +5     |
| Final exacta      | +5     |
| Referido          | +1     |

Los puntos se calculan automáticamente via `score_match()` en PostgreSQL,
llamado desde el panel admin o Edge Function cuando se carga el resultado.

## Próximas features

- [ ] Dashboard completo del usuario
- [ ] Página de partidos con todos los pronósticos
- [ ] Ranking en tiempo real (Supabase Realtime)
- [ ] Mini ligas con invite por código
- [ ] Panel admin completo
- [ ] Edge Function para scoring automático vía API-Football
- [ ] Notificaciones push (recordatorios de partidos)
- [ ] Compartir resultado en WhatsApp/IG

## Contacto

Tecnoprop · Pringles 1680 Of.13/14 · Yerba Buena, Tucumán
[horaciomitre@tecnoprop.ar](mailto:horaciomitre@tecnoprop.ar) · 381 5462052
