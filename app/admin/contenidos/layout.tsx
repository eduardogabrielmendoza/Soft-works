export default function ContenidosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-gray-100">
      {children}
    </div>
  );
}
