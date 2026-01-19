import Header from "./Header";
import Footer from "./Footer";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      
      {/* Header – full width */}
      <Header />

      {/* Main – center content */}
      <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer – full width */}
      <Footer />
    </div>
  );
}
