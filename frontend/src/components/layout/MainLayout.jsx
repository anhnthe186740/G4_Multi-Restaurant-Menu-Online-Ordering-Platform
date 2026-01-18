export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <Header />

      <main className="flex-1 w-full py-8">
        <div className="
          mx-auto
          w-full
          max-w-[1200px]
          px-4 sm:px-6 lg:px-8
        ">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
