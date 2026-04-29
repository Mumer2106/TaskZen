import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#02000d] text-white selection:bg-pink-500/30 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-pink-600/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Animated Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6 text-center">
        {/* 404 Floating Badge */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.05] border-2 border-pink-500/30 backdrop-blur-2xl mb-8 hover:border-pink-500/50 transition-all cursor-default group shadow-[0_0_20px_rgba(255,45,149,0.15)] hover:shadow-[0_0_30px_rgba(255,45,149,0.25)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500 shadow-[0_0_8px_rgba(255,45,149,0.8)]"></span>
          </span>
          <span className="text-[11px] font-black tracking-[0.25em] text-slate-200 uppercase">
            Route Not Found
          </span>
        </div>

        <h1 className="text-7xl sm:text-9xl font-black tracking-tighter leading-[0.95] mb-8">
          <span className="text-gradient inline-block drop-shadow-[0_0_30px_rgba(255,45,149,0.3)]">Lost in</span><br />
          <span className="text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.25)] italic">space?</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 font-light mx-auto leading-relaxed mb-10 sm:mb-12">
          The task you're looking for seems to have escaped the flow.
          <span className="text-slate-200 block sm:inline"> Let's get you back to productivity.</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto">
          <Link href="/" className="w-full sm:w-auto">
            <button className="btn-premium-pink group w-full sm:w-auto py-4 sm:py-5 px-12">
              Return Home
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="translate-x-0 group-hover:translate-x-1.5 transition-transform duration-300 ml-2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </button>
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-0 w-full text-center py-8 sm:py-12 text-slate-500 z-10">
        <p className="text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase opacity-60">
          TaskZen Protocol | Standard 404
        </p>
      </footer>
    </main>
  );
}
