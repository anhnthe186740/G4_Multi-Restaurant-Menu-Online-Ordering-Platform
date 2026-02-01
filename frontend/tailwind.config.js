/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "3rem",
        xl: "4rem",
        "2xl": "6rem",
      },
    },

    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },

    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
        playfair: ["Playfair Display", "serif"],
      },

      /** 🔥 CẬP NHẬT BẢNG MÀU THEO GIAO DIỆN ADMIN */
      colors: {
        // Màu xanh Neon chủ đạo (giống nút Phê duyệt)
        primary: {
          DEFAULT: "#00c04b", 
          hover: "#00a841",   // Màu hover đậm hơn một chút
        },

        // Các màu nền
        background: {
          light: "#f6f7f7",
          dark: "#02140c",    // Màu nền chính (Xanh đen rất tối)
          paper: "#062519",   // Màu nền của Card / Header (Xanh rêu tối)
          input: "#031a11",   // Màu nền của ô Input
        },

        // Màu viền
        border: {
          DEFAULT: "#e5e7eb",
          dark: "#133827",    // Màu viền xanh tối
        },
        
        // Giữ lại cấu trúc card cũ của bạn nhưng update màu
        card: {
          dark: "#062519",
        },
      },

      borderRadius: {
        xs: "0.25rem",
        sm: "0.375rem",
        base: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },

  plugins: [],
};