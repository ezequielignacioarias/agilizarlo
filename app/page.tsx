import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-white">
              Agilizarlo<span className="text-indigo-500">.</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-medium">
            <a href="#funciones" className="hover:text-white transition-colors">Funciones</a>
            <a href="#cotizador-demo" className="hover:text-white transition-colors">Cotizador Rápido</a>
            <a href="#testimonios" className="hover:text-white transition-colors">Opiniones</a>
            <a href="#precios" className="hover:text-white transition-colors">Planes</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link 
              href="/dashboard" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0,transparent_70%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 tracking-wide uppercase">
            <span>⚡ Cero burocracia, 100% ventas</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Gestiona tus clientes y cotiza <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">en segundos.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            El micro-CRM ultraliviano para freelancers y comercios que odian los sistemas complejos. Arma presupuestos y envialos directo a WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto bg-white text-slate-950 font-bold px-8 py-4 rounded-xl hover:bg-slate-200 transition-all text-base shadow-xl shadow-white/5 active:scale-95 text-center"
            >
              Pruébalo gratis ahora →
            </Link>
            <a 
              href="#cotizador-demo" 
              className="w-full sm:w-auto bg-slate-900 border border-slate-800 text-slate-300 font-medium px-8 py-4 rounded-xl hover:bg-slate-800 hover:text-white transition-all text-base text-center"
            >
              Ver Cotizador en acción
            </a>
          </div>
        </div>
      </section>

      {/* DEMO VISUAL DEL COTIZADOR RÁPIDO */}
      <section id="cotizador-demo" className="py-16 border-t border-slate-900 bg-slate-950">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-emerald-400 text-xs font-semibold tracking-wider uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Función Estrella</span>
            <h2 className="text-3xl font-bold text-white mt-3 mb-3">⚡ El Cotizador Relámpago</h2>
            <p className="text-slate-400 text-sm">Olvídate de abrir Word, armar PDFs pesados o tardar 10 minutos. Carga los datos y el sistema redacta el mensaje perfecto para WhatsApp.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-600/20 text-indigo-400 text-xs px-3 py-1 rounded-bl-xl font-medium border-l border-b border-indigo-500/30">
              Vista previa real
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cliente</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200">Carlos Mecánico</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Concepto</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200">Repuestos y mano de obra frenos</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200">$ 45.000</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-5 shadow-inner">
                <p className="text-xs text-emerald-400 font-semibold mb-2 flex items-center gap-1.5">
                  <span>💬</span> Mensaje generado automáticamente:
                </p>
                <div className="bg-slate-900/90 rounded-lg p-3.5 text-xs text-slate-300 font-mono space-y-1.5 border border-slate-800">
                  <p className="text-white font-bold">Hola *Carlos Mecánico* 👋</p>
                  <p>Aquí tienes el detalle de tu presupuesto:</p>
                  <p className="text-emerald-300">📝 *Concepto:* Repuestos y mano de obra frenos</p>
                  <p className="text-emerald-300">💰 *Total:* $45.000</p>
                  <p className="text-slate-400 pt-1">Quedo a disposición para confirmarlo. ¡Gracias!</p>
                </div>
                <div className="mt-4">
                  <Link href="/dashboard" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20">
                    <span>Probar Cotizador Ahora →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="funciones" className="py-20 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Diseñado para la velocidad real</h2>
            <p className="text-slate-400">Cada función fue pensada para eliminar clics inútiles y acelerar tu día a día comercial.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 font-bold text-lg">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-3">Carga en 3 Clics</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Sin formularios eternos ni datos fiscales innecesarios. Nombre, teléfono y nota rápida.</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 font-bold text-lg">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-3">Panel "Hoy" Anti-Olvidos</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Una única vista inteligente que te muestra exactamente a qué cliente contactar hoy.</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-6 font-bold text-lg">💬</div>
              <h3 className="text-xl font-semibold text-white mb-3">WhatsApp Nativo</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Acceso directo al chat de WhatsApp con un solo toque desde la ficha del cliente o cotización.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS / OPINIONES (NUEVO) */}
      <section id="testimonios" className="py-20 border-t border-slate-900 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Lo que dicen quienes ya lo usan</h2>
            <p className="text-slate-400">Freelancers y profesionales independientes que recuperaron horas de su semana.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8">
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                "Antes tardaba 15 minutos armando PDFs en la computadora para mandar un presupuesto. Ahora abro Agilizarlo en el celu o la compu, cargo el monto y se lo mando por WhatsApp al cliente en 5 segundos. Me cambió la dinámica."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  CM
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Carlos M.</h4>
                  <p className="text-xs text-slate-500">Taller Mecánico</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8">
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                "El panel 'Hoy' es salvador. Me recuerda exactamente a quién tenía que llamar para no perder la venta. Cero vueltas, justo lo que necesitaba."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">
                  LA
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Lucía A.</h4>
                  <p className="text-xs text-slate-500">Estudio de Arquitectura</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE PRECIOS / PLANES (NUEVO) */}
      <section id="precios" className="py-20 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Planes simples y transparentes</h2>
            <p className="text-slate-400">Sin sorpresas ni contratos de permanencia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Plan Gratis / Beta */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Fase Beta</span>
                <h3 className="text-2xl font-bold text-white mt-4 mb-2">Comunidad</h3>
                <p className="text-slate-400 text-sm mb-6">Ideal para probar la herramienta y empezar a organizar tus clientes hoy mismo.</p>
                <div className="text-4xl font-black text-white mb-6">$0 <span className="text-sm font-normal text-slate-500">/ gratis</span></div>
                
                <ul className="space-y-3 text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-2">✓ Carga rápida de contactos</li>
                  <li className="flex items-center gap-2">✓ Panel "Hoy" anti-olvidos</li>
                  <li className="flex items-center gap-2">✓ Cotizador Relámpago para WhatsApp</li>
                  <li className="flex items-center gap-2">✓ Almacenamiento local ultrarrápido</li>
                </ul>
              </div>

              <Link href="/dashboard" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all text-center text-sm">
                Empezar Gratis
              </Link>
            </div>

            {/* Plan Pro */}
            <div className="bg-gradient-to-b from-indigo-950/40 to-slate-900/60 border border-indigo-500/40 rounded-3xl p-8 flex flex-col justify-between relative shadow-xl shadow-indigo-500/5">
              <div className="absolute -top-3 right-8 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Próximamente
              </div>
              <div>
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Avanzado</span>
                <h3 className="text-2xl font-bold text-white mt-4 mb-2">Pro Business</h3>
                <p className="text-slate-400 text-sm mb-6">Para comercios y equipos que buscan sincronización en la nube.</p>
                <div className="text-4xl font-black text-white mb-6">$9.900 <span className="text-sm font-normal text-slate-500">/ mes</span></div>
                
                <ul className="space-y-3 text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-2">✓ Todo lo del plan Gratis</li>
                  <li className="flex items-center gap-2">✓ Sincronización en la nube multi-dispositivo</li>
                  <li className="flex items-center gap-2">✓ Respaldo automático de datos</li>
                  <li className="flex items-center gap-2">✓ Soporte prioritario 24/7</li>
                </ul>
              </div>

              <button disabled className="w-full bg-indigo-600/50 text-white/70 font-semibold py-3 rounded-xl cursor-not-allowed text-sm">
                Próximamente disponible
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="py-20 border-t border-slate-900 bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-slate-900/60 border border-indigo-500/30 rounded-3xl p-10 md:p-14 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">¿Listo para cerrar más ventas sin perder tiempo?</h2>
            <p className="text-slate-300 max-w-xl mx-auto mb-8 text-sm md:text-base">Únete a los profesionales que ya automatizaron sus presupuestos y seguimiento diario.</p>
            <Link href="/dashboard" className="inline-block bg-white text-slate-950 font-bold px-8 py-4 rounded-xl hover:bg-slate-200 transition-all text-base shadow-xl active:scale-95">
              Comenzar ahora gratis →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500">
          <p>© 2026 Agilizarlo. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6 mt-4 sm:mt-0">
            <span className="hover:text-slate-400 cursor-pointer">Privacidad</span>
            <span className="hover:text-slate-400 cursor-pointer">Términos</span>
          </div>
        </div>
      </footer>
    </div>
  );
}