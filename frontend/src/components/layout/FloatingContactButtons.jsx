import zaloLogo from "../../Logo/zalo-1-logo-png-transparent.png";

export default function FloatingContactButtons() {
    const phoneNumber = "0389005769";
    const zaloNumber = "0389005769";

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 animate-fade-in-up stagger-3">
            {/* Zalo Button */}
            <a
                href={`https://zalo.me/${zaloNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center"
                title="Chat Zalo"
            >
                <div className="absolute -left-20 bg-slate-900 border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 group-hover:-left-24 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-2xl">
                    Chat Zalo
                    <div className="absolute top-1/2 left-full -translate-y-1/2 w-2 h-2 bg-slate-900 border-r border-t border-white/10 rotate-45" />
                </div>
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200/50 hover:shadow-slate-300/50 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 relative overflow-hidden border border-slate-100 animate-vibrate">
                    <div className="absolute inset-0 rounded-2xl bg-[#0068FF] animate-ping opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img
                        src={zaloLogo}
                        alt="Zalo"
                        className="w-10 h-10 drop-shadow-sm"
                    />
                </div>
            </a>

            {/* Phone Button */}
            <a
                href={`tel:${phoneNumber}`}
                className="group relative flex items-center justify-center"
                title="Gọi hỗ trợ"
            >
                <div className="absolute -left-20 bg-slate-900 border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 group-hover:-left-24 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-2xl">
                    Gọi hỗ trợ
                    <div className="absolute top-1/2 left-full -translate-y-1/2 w-2 h-2 bg-slate-900 border-r border-t border-white/10 rotate-45" />
                </div>
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 group-hover:shadow-emerald-500/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative">
                    <div className="absolute inset-0 rounded-2xl bg-emerald-500 animate-ping opacity-20" />
                    <span className="material-symbols-outlined text-3xl text-white drop-shadow-lg">call</span>
                </div>
            </a>
        </div>
    );
}
