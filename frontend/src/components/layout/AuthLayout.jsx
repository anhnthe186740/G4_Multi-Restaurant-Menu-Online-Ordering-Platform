export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark flex justify-center">
      <div className="
        w-full
        max-w-[1200px]
        px-4 sm:px-6 lg:px-8
        py-12
      ">
        {children}
      </div>
    </div>
  );
}
