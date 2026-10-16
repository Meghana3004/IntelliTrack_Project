export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-app-bg px-4">
      {children}
    </div>
  );
}
