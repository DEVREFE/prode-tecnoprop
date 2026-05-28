// ================================================================
// lib/email/sender.ts
// Envío de emails via Resend — resend.com
// ================================================================

const RESEND_API = 'https://api.resend.com/emails'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `Prode Tecnoprop <${process.env.RESEND_FROM_EMAIL ?? 'prode@tecnoprop.ar'}>`,
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }

  return res.json()
}

// ── Base layout del email ──────────────────────────────────────────

function baseLayout(content: string, preheader = '') {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prode Tecnoprop 2026</title>
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
</head>
<body style="margin:0;padding:0;background:#050c18;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050c18;min-height:100vh;">
  <tr><td align="center" style="padding:40px 16px;">

    <!-- Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0d1a2e;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;">

      <!-- Top accent bar -->
      <tr>
        <td style="height:3px;background:linear-gradient(90deg,#36A9E0,#1D70B7);"></td>
      </tr>

      <!-- Header -->
      <tr>
        <td style="padding:32px 32px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:40px;height:40px;background:linear-gradient(135deg,#36A9E0,#1D70B7);border-radius:10px;text-align:center;vertical-align:middle;">
                      <span style="color:white;font-weight:800;font-size:14px;">TP</span>
                    </td>
                    <td style="padding-left:12px;">
                      <div style="color:#ffffff;font-size:15px;font-weight:700;line-height:1.2;">Tecnoprop</div>
                      <div style="color:#36A9E0;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Prode Mundial 2026</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Content -->
      <tr><td style="padding:32px;">${content}</td></tr>

      <!-- Footer -->
      <tr>
        <td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);background:#071121;">
          <p style="margin:0 0 8px;color:rgba(255,255,255,0.25);font-size:12px;text-align:center;">
            Tecnoprop · Pringles 1680 Of. 13/14 · Yerba Buena, Tucumán
          </p>
          <p style="margin:0;color:rgba(255,255,255,0.15);font-size:11px;text-align:center;">
            <a href="https://tecnoprop.ar" style="color:#36A9E0;text-decoration:none;">tecnoprop.ar</a>
            &nbsp;·&nbsp;
            <a href="https://prode.tecnoprop.ar/unsubscribe" style="color:rgba(255,255,255,0.25);text-decoration:none;">Cancelar suscripción</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ─── helpers de estilos inline ────────────────────────────────────

const BTN = `display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#36A9E0,#1D70B7);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:-0.2px;`
const H1  = `margin:0 0 12px;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.8px;line-height:1.1;`
const P   = `margin:0 0 20px;color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;`
const BOX = `background:rgba(54,169,224,0.06);border:1px solid rgba(54,169,224,0.15);border-radius:14px;padding:20px 24px;margin:20px 0;`

// ================================================================
// TEMPLATE 1: Bienvenida (post-verificación de email)
// ================================================================

export function emailBienvenida(opts: {
  nombre: string
  referral_code: string
  siteUrl: string
}) {
  const refLink = `${opts.siteUrl}?ref=${opts.referral_code}`

  const content = `
    <p style="font-size:40px;margin:0 0 16px;">🌍</p>
    <h1 style="${H1}">¡Bienvenido/a al Prode,<br>${opts.nombre}!</h1>
    <p style="${P}">
      Tu cuenta está activa. Ya podés entrar, cargar tus pronósticos y competir
      por los premios del Mundial 2026.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.siteUrl}/partidos" style="${BTN}">
        Ver partidos y pronosticar →
      </a>
    </div>

    <div style="${BOX}">
      <p style="margin:0 0 8px;color:#36A9E0;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
        🎁 Tu link de referidos
      </p>
      <p style="margin:0 0 12px;color:rgba(255,255,255,0.5);font-size:13px;">
        Cada amigo que se registre con tu link te da <strong style="color:#FFB800;">+1 punto bonus</strong>
      </p>
      <p style="margin:0;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;font-family:monospace;font-size:13px;color:#36A9E0;word-break:break-all;">
        ${refLink}
      </p>
    </div>

    <div style="${BOX.replace('celeste', 'gold').replace('#36A9E0','#FFB800').replace('rgba(54,169,224','rgba(255,184,0')}">
      <p style="margin:0 0 8px;color:#FFB800;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
        ⭐ No te olvides: predicciones especiales
      </p>
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:13px;line-height:1.5;">
        Cargá antes del primer partido quién será el <strong style="color:white;">Campeón (+10pts)</strong>,
        Subcampeón (+5pts), Goleador (+5pts) y el marcador exacto de la Final (+5pts).
      </p>
    </div>

    <p style="margin:24px 0 0;color:rgba(255,255,255,0.3);font-size:13px;">
      Acordate de seguir a
      <a href="https://instagram.com/tecnoprop.ok" style="color:#36A9E0;text-decoration:none;font-weight:600;">@tecnoprop.ok</a>
      en Instagram. Es requisito para recibir los premios.
    </p>
  `
  return {
    subject: `¡Bienvenido/a al Prode, ${opts.nombre}! 🌍⚽`,
    html: baseLayout(content, `Tu cuenta está activa. ¡Empezá a pronosticar el Mundial 2026!`),
  }
}

// ================================================================
// TEMPLATE 2: Recordatorio de partido próximo
// ================================================================

export function emailRecordatorioPartido(opts: {
  nombre: string
  teamHome: string
  teamAway: string
  flagHome: string
  flagAway: string
  matchDate: string
  stadium: string
  siteUrl: string
  matchId: string
}) {
  const content = `
    <p style="font-size:36px;margin:0 0 12px;">${opts.flagHome}⚽${opts.flagAway}</p>
    <h1 style="${H1}">¡Acordate de pronosticar!</h1>
    <p style="${P}">
      Hola ${opts.nombre}, el partido de hoy arranca pronto y todavía
      no cargaste tu pronóstico.
    </p>

    <div style="${BOX}">
      <p style="margin:0 0 6px;color:rgba(255,255,255,0.4);font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Partido</p>
      <p style="margin:0 0 4px;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">
        ${opts.teamHome} vs ${opts.teamAway}
      </p>
      <p style="margin:0;color:rgba(255,255,255,0.4);font-size:13px;">
        🕐 ${opts.matchDate} &nbsp;·&nbsp; 📍 ${opts.stadium}
      </p>
    </div>

    <p style="${P.replace('20px','12px')}">
      Una vez que empiece el partido se bloquea la carga de pronósticos.
      ¡Cargalo ahora!
    </p>

    <div style="text-align:center;margin:24px 0;">
      <a href="${opts.siteUrl}/partidos" style="${BTN}">
        Cargar mi pronóstico →
      </a>
    </div>
  `
  return {
    subject: `⏰ Pronosticá ${opts.teamHome} vs ${opts.teamAway} antes que empiece`,
    html: baseLayout(content, `¡Cargá tu pronóstico! El partido empieza pronto.`),
  }
}

// ================================================================
// TEMPLATE 3: Resumen de puntos (post-partido)
// ================================================================

export function emailResumenPuntos(opts: {
  nombre: string
  teamHome: string
  teamAway: string
  scoreHome: number
  scoreAway: number
  predHome: number
  predAway: number
  pointsEarned: number
  totalPoints: number
  rankPosition: number
  siteUrl: string
}) {
  const resultLabel =
    opts.pointsEarned === 3 ? '🎯 ¡Resultado exacto!' :
    opts.pointsEarned === 1 ? '✅ Ganaste 1 punto'     :
    '😔 Sin puntos esta vez'

  const resultColor =
    opts.pointsEarned === 3 ? '#22c55e' :
    opts.pointsEarned === 1 ? '#36A9E0' :
    'rgba(255,255,255,0.3)'

  const content = `
    <h1 style="${H1}">Resultado del partido</h1>
    <p style="${P.replace('20px','4px')}">
      ${opts.teamHome} vs ${opts.teamAway}
    </p>
    <p style="margin:0 0 24px;color:rgba(255,255,255,0.3);font-size:13px;">${opts.nombre}</p>

    <!-- Score comparison -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="width:50%;text-align:center;padding:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px 0 0 12px;">
          <div style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Resultado real</div>
          <div style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-1px;font-family:monospace;">
            ${opts.scoreHome} — ${opts.scoreAway}
          </div>
        </td>
        <td style="width:50%;text-align:center;padding:20px;background:rgba(54,169,224,0.04);border:1px solid rgba(54,169,224,0.12);border-radius:0 12px 12px 0;">
          <div style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Tu pronóstico</div>
          <div style="color:#36A9E0;font-size:28px;font-weight:800;letter-spacing:-1px;font-family:monospace;">
            ${opts.predHome} — ${opts.predAway}
          </div>
        </td>
      </tr>
    </table>

    <!-- Points earned -->
    <div style="text-align:center;padding:24px;background:${opts.pointsEarned > 0 ? 'rgba(54,169,224,0.06)' : 'rgba(255,255,255,0.02)'};border:1px solid ${opts.pointsEarned > 0 ? 'rgba(54,169,224,0.15)' : 'rgba(255,255,255,0.05)'};border-radius:14px;margin-bottom:24px;">
      <div style="color:${resultColor};font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px;">
        ${resultLabel}
      </div>
      ${opts.pointsEarned > 0 ? `
      <div style="color:${resultColor};font-size:40px;font-weight:800;font-family:monospace;line-height:1;">
        +${opts.pointsEarned}
      </div>
      <div style="color:rgba(255,255,255,0.25);font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">puntos</div>
      ` : ''}
    </div>

    <!-- Total + ranking -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="width:50%;text-align:center;padding:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin-right:6px;">
          <div style="color:rgba(255,255,255,0.3);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">Total puntos</div>
          <div style="color:#36A9E0;font-size:26px;font-weight:800;font-family:monospace;">${opts.totalPoints}</div>
        </td>
        <td style="width:8px;"></td>
        <td style="width:50%;text-align:center;padding:16px;background:rgba(255,184,0,0.04);border:1px solid rgba(255,184,0,0.15);border-radius:12px;">
          <div style="color:rgba(255,255,255,0.3);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">Posición</div>
          <div style="color:#FFB800;font-size:26px;font-weight:800;font-family:monospace;">#${opts.rankPosition}</div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">
      <a href="${opts.siteUrl}/dashboard" style="${BTN}">
        Ver mi dashboard →
      </a>
    </div>
  `
  return {
    subject: `${opts.pointsEarned > 0 ? `+${opts.pointsEarned} puntos` : 'Sin puntos'} · ${opts.teamHome} vs ${opts.teamAway}`,
    html: baseLayout(content),
  }
}

// ================================================================
// TEMPLATE 4: Ranking semanal
// ================================================================

export function emailRankingSemanal(opts: {
  nombre: string
  rankPosition: number
  totalPoints: number
  topUsers: { nombre: string; apellido: string; total_points: number; position: number }[]
  siteUrl: string
}) {
  const topRows = opts.topUsers.slice(0, 5).map(u => {
    const medal = u.position === 1 ? '🥇' : u.position === 2 ? '🥈' : u.position === 3 ? '🥉' : `#${u.position}`
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:32px;text-align:center;font-size:14px;">${medal}</td>
              <td style="color:rgba(255,255,255,0.8);font-size:14px;font-weight:600;padding-left:8px;">
                ${u.nombre} ${u.apellido}
              </td>
              <td style="text-align:right;color:#36A9E0;font-size:14px;font-weight:800;font-family:monospace;">
                ${u.total_points} pts
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
  }).join('')

  const content = `
    <p style="font-size:36px;margin:0 0 16px;">📊</p>
    <h1 style="${H1}">Ranking semanal</h1>
    <p style="${P}">Hola ${opts.nombre}, así está el ranking esta semana:</p>

    <div style="${BOX}">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.3);font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Tu posición</p>
      <p style="margin:0;color:#FFB800;font-size:32px;font-weight:800;font-family:monospace;letter-spacing:-1px;">
        #${opts.rankPosition}
        <span style="color:rgba(255,255,255,0.3);font-size:14px;font-weight:500;font-family:inherit;letter-spacing:0;"> · ${opts.totalPoints} puntos</span>
      </p>
    </div>

    <p style="margin:0 0 12px;color:rgba(255,255,255,0.4);font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">
      Top 5 general
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;padding:0 16px;">
      ${topRows}
    </table>

    <div style="text-align:center;margin-top:28px;">
      <a href="${opts.siteUrl}/ranking" style="${BTN}">
        Ver ranking completo →
      </a>
    </div>
  `
  return {
    subject: `📊 Tu ranking esta semana: #${opts.rankPosition}`,
    html: baseLayout(content),
  }
}
