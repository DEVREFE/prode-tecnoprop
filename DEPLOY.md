# Guía de Deploy — Prode Tecnoprop 2026

## Paso 1 — Supabase

### 1.1 Crear proyecto
1. Ir a [supabase.com](https://supabase.com) → New project
2. Nombre: `prode-tecnoprop-2026`
3. Contraseña de DB: guardarla en un lugar seguro
4. Región: **South America (São Paulo)**

### 1.2 Ejecutar el schema
1. Dashboard → **SQL Editor**
2. Pegar y ejecutar `supabase/schema.sql`
3. Pegar y ejecutar `supabase/schema-fase3.sql`

### 1.3 Configurar Auth
1. **Authentication → Email Templates**
   - Confirm signup: personalizar con el logo de Tecnoprop
   - Cambiar el asunto a: "Activá tu cuenta del Prode Tecnoprop 2026"

2. **Authentication → URL Configuration**
   - Site URL: `https://prode.tecnoprop.ar`
   - Redirect URLs (agregar):
     ```
     https://prode.tecnoprop.ar/auth/callback
     http://localhost:3000/auth/callback
     ```

3. **Authentication → Providers**
   - Email: habilitado (ya viene por defecto)

### 1.4 Configurar Webhook (para email de bienvenida)
1. **Database → Webhooks → Create webhook**
   - Name: `on_email_confirmed`
   - Table: `auth.users`
   - Events: `UPDATE`
   - URL: `https://prode.tecnoprop.ar/api/webhooks/auth`
   - Headers: `x-webhook-secret: TU_WEBHOOK_SECRET`

### 1.5 Obtener las keys
- **Settings → API**:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

## Paso 2 — Resend (emails)

1. Crear cuenta en [resend.com](https://resend.com) (gratis: 3.000 emails/mes)
2. **Domains → Add domain**: agregar `tecnoprop.ar`
3. Seguir los pasos de verificación DNS (agregan registros TXT y MX)
4. Una vez verificado: **API Keys → Create API Key**
5. Copiar a `.env.local` como `RESEND_API_KEY`

---

## Paso 3 — API-Football (fixture y resultados)

1. Crear cuenta en [apifootball.com](https://rapidapi.com/api-sports/api/api-football)
2. Plan Free: 100 requests/día (suficiente para el cron cada 5min durante partidos)
3. Copiar API Key a `API_FOOTBALL_KEY`

> **Nota**: el Mundial 2026 es `league=1&season=2026` en su API.
> Verificar el ID exacto cuando esté disponible (mayo 2026).

---

## Paso 4 — Vercel

### 4.1 Deploy
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde el directorio del proyecto
vercel

# O conectar desde vercel.com con el repo de GitHub
```

### 4.2 Variables de entorno en Vercel
Dashboard → Project → **Settings → Environment Variables**

Agregar todas las variables del `.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_WEBHOOK_SECRET
API_FOOTBALL_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_SITE_URL
CRON_SECRET
```

### 4.3 Dominio personalizado
1. Dashboard → Project → **Settings → Domains**
2. Agregar: `prode.tecnoprop.ar`
3. Vercel te muestra el CNAME a configurar en tu DNS

### 4.4 Configurar DNS en tu proveedor (ej: GoDaddy, Namecheap, Cloudflare)
```
Tipo:  CNAME
Host:  prode
Valor: cname.vercel-dns.com
TTL:   3600
```

---

## Paso 5 — WordPress (integración)

### Opción A — Plugin (recomendado)
1. Copiar `wordpress/prode-tecnoprop.php` a `/wp-content/plugins/prode-tecnoprop/`
2. Activar desde **Plugins** en el dashboard de WordPress
3. El plugin crea automáticamente la página `/prode` con redirect 301

### Opción B — .htaccess (más simple)
1. Abrir `/public_html/.htaccess` via FTP o cPanel
2. Pegar el contenido de `wordpress/htaccess-redirect.txt` ANTES de las reglas `# BEGIN WordPress`

### Usar el shortcode en WordPress
En cualquier página de WordPress podés incrustar la app:
```
[prode_embed]
[prode_embed height="800px"]
[prode_embed page="registro"]
```

---

## Paso 6 — Primer admin

Una vez deployado, el primer usuario que se registre va a ser `role: user`.
Para convertirlo en admin:

```sql
-- Ejecutar en Supabase SQL Editor
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'horaciomitre@tecnoprop.ar';
```

Después de esto, ese usuario puede acceder a `prode.tecnoprop.ar/admin`.

---

## Checklist final pre-lanzamiento

- [ ] Schema ejecutado en Supabase (schema.sql + schema-fase3.sql)
- [ ] Auth URL Configuration configurada
- [ ] Webhook de email configurado
- [ ] Dominio `prode.tecnoprop.ar` resolviendo
- [ ] Variables de entorno en Vercel
- [ ] Redirect `/prode` funcionando en WordPress
- [ ] Registro de prueba → email de verificación llega
- [ ] Clic en link → cuenta activa → email de bienvenida llega
- [ ] Pronosticar partido → se guarda
- [ ] Admin puede cargar resultado → puntos se calculan
- [ ] Ranking se actualiza

---

## Comandos útiles

```bash
# Dev local
npm run dev

# Triggerear cron manualmente (para probar)
curl -H "x-cron-secret: TU_SECRET" https://prode.tecnoprop.ar/api/cron

# Sincronizar fixture desde API-Football
curl -X POST -H "Authorization: Bearer TU_SERVICE_ROLE_KEY" \
  https://prode.tecnoprop.ar/api/sync-matches

# Calcular puntos de un partido específico (desde SQL Editor)
SELECT score_match('UUID_DEL_PARTIDO');

# Calcular puntos especiales (al final del torneo)
SELECT score_special_predictions('Argentina', 'Francia', 'Mbappé', 1, 0);
```

---

## Contacto

**Tecnoprop** · Pringles 1680 Of. 13/14 · Yerba Buena, Tucumán  
📧 horaciomitre@tecnoprop.ar · 📱 381 5462052
