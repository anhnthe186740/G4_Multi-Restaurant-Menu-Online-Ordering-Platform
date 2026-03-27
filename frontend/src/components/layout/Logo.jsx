import { UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Reusable Logo component for the GastroAdmin brand.
 * 
 * @param {Object} props
 * @param {string} props.size - 'sm', 'md', 'lg' (default: 'md')
 * @param {string} props.className - Additional classes for the wrapper
 * @param {boolean} props.showText - Whether to show the brand text (default: true)
 */
export default function Logo({ size = "md", className = "", showText = true }) {
  const sizes = {
    sm: {
      container: "w-8 h-8",
      icon: 16,
      brand: "text-lg",
      sub: "text-[8px]"
    },
    md: {
      container: "w-10 h-10",
      icon: 20,
      brand: "text-xl",
      sub: "text-[10px]"
    },
    lg: {
      container: "w-14 h-14",
      icon: 28,
      brand: "text-2xl",
      sub: "text-[12px]"
    }
  };

  const s = sizes[size] || sizes.md;

  return (
    <Link to="/" className={`flex items-center gap-3 transition-opacity hover:opacity-90 group ${className}`}>
      {/* Icon Circle */}
      <div className={`${s.container} bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300`}>
        <UtensilsCrossed size={s.icon} className="text-white" />
      </div>

      {/* Text Branding */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold text-white tracking-tight ${s.brand}`}>
            restaurant
          </span>
          <span className={`font-black text-blue-500 tracking-[0.2em] uppercase mt-0.5 ${s.sub}`}>
            management system
          </span>
        </div>
      )}
    </Link>
  );
}
