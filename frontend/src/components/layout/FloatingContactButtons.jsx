import { Phone } from "lucide-react";
import zaloIcon from "../../Logo/zalo-1-logo-png-transparent.png";

export default function FloatingContactButtons() {
  const phoneNumber = "0389005769"; // Số điện thoại mới
  const zaloNumber = "0389005769";  // Số Zalo mới

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4 items-end">

      {/* Zalo Button */}
      <div className="group relative flex items-center">
        <span className="absolute right-[calc(100%+12px)] px-3 py-1.5 bg-[#0068ff] text-white font-semibold text-xs rounded-lg shadow-xl
          opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap">
          Chat Zalo
          <div className="absolute top-1/2 left-full -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent" style={{borderLeftColor:'#0068ff'}}></div>
        </span>

        <a
          href={`https://zalo.me/${zaloNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-white rounded-[22%] overflow-hidden shadow-[0_6px_24px_rgba(0,104,255,0.5)]
            hover:scale-110 hover:shadow-[0_10px_36px_rgba(0,104,255,0.7)] active:scale-95
            transition-all duration-300 animate-float flex items-center justify-center p-1.5"
        >
          <img src={zaloIcon} alt="Zalo" className="w-full h-full object-contain" />
        </a>
      </div>

      {/* Phone Button */}
      <div className="group relative flex items-center">
        <span className="absolute right-[calc(100%+12px)] px-3 py-1.5 bg-white text-[#0068ff] font-semibold text-xs rounded-lg shadow-xl border border-blue-100
          opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap">
          Gọi ngay
          <div className="absolute top-1/2 left-full -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-white"></div>
        </span>

        <a
          href={`tel:${phoneNumber}`}
          className="w-14 h-14 bg-white text-[#0068ff] rounded-full flex items-center justify-center
            shadow-[0_6px_24px_rgba(0,0,0,0.12)]
            hover:scale-110 hover:shadow-[0_10px_36px_rgba(0,0,0,0.2)] hover:bg-blue-50 active:scale-95
            transition-all duration-300 border-2 border-blue-100 animate-float-delayed"
        >
          <Phone className="w-6 h-6" fill="currentColor" />
        </a>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-delayed { animation: float 3s ease-in-out infinite 1.5s; }
      `}} />
    </div>
  );
}
