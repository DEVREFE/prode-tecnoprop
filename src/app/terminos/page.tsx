import Link from 'next/link'
import { Trophy, ArrowLeft } from 'lucide-react'

export default function TerminosPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-up">
          <Link href="/register" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Trophy size={18} className="text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Términos y Condiciones
          </h1>
          <p className="text-white/50">Reglas del Prode Tecnoprop Mundial 2026</p>
        </div>

        {/* Content Card */}
        <div className="glass-card p-8 top-accent animate-fade-up-1 space-y-6 text-sm text-white/80 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-celeste uppercase tracking-wider">1. Participación Gratuita</h2>
            <p>
              La participación en el Prode Digital del Mundial 2026 es completamente gratuita. Está abierta a todos los entusiastas del fútbol que deseen divertirse y competir de manera amistosa.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-celeste uppercase tracking-wider">2. Requisito de Instagram</h2>
            <p>
              Para ser elegible para reclamar cualquiera de los premios anunciados, es un requisito obligatorio seguir la cuenta oficial de{' '}
              <a
                href="https://instagram.com/tecnoprop.ok"
                target="_blank"
                rel="noopener noreferrer"
                className="text-celeste font-semibold hover:underline"
              >
                @tecnoprop.ok
              </a>{' '}
              en Instagram antes de la finalización del Mundial. Las cuentas que resulten ganadoras serán validadas manualmente.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-celeste uppercase tracking-wider">3. Sistema de Puntuación</h2>
            <p>
              Los puntos se asignan automáticamente de la siguiente manera:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
              <li><strong className="text-white">Resultado exacto:</strong> +3 puntos</li>
              <li><strong className="text-white">Ganador o empate correcto:</strong> +1 punto</li>
              <li><strong className="text-white">Predicción de Campeón correcto:</strong> +10 puntos</li>
              <li><strong className="text-white">Goleador del torneo correcto:</strong> +5 puntos</li>
              <li><strong className="text-white">Finalistas del torneo correctos:</strong> +5 puntos</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-celeste uppercase tracking-wider">4. Cierre de Predicciones</h2>
            <p>
              Los pronósticos para cada partido se bloquearán automáticamente <span className="text-white font-semibold">1 hora antes</span> del inicio programado de cada partido. Sin excepciones. Asegurate de cargar tus predicciones con suficiente antelación.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-celeste uppercase tracking-wider">5. Desempate y Premios</h2>
            <p>
              Los premios de Tecnoprop se asignarán según las posiciones del Ranking General. En caso de igualdad de puntos al finalizar el torneo, el criterio de desempate será el participante que haya registrado primero sus predicciones en la plataforma.
            </p>
          </section>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
            <p className="text-xs text-white/35">Última actualización: Mayo 2026</p>
            <Link href="/register" className="inline-flex items-center gap-1.5 text-celeste hover:underline font-semibold">
              <ArrowLeft size={14} /> Volver al registro
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
