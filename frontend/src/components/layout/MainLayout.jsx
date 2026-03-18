import Header from "./Header";
import Footer from "./Footer";
import RegistrationStatusButton from "../RegistrationStatusButton";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#02140c] text-white">

      {/* Header – full width */}
      <Header />

      {/* Main – full width content */}
      <main className="w-full">
        {children}
      </main>

      {/* Footer – full width */}
      <Footer />

      {/* Floating registration status button */}
      <RegistrationStatusButton />
    </div>
  );
}
