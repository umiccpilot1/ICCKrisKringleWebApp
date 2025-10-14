export default function PortalFooter() {
  return (
    <footer className="border-t border-icc-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-6 text-center text-xs uppercase tracking-wider text-icc-gray-600 lg:px-10">
        © {new Date().getFullYear()} Kris Kringle Gift Exchange · Crafted for joyful teams
      </div>
    </footer>
  );
}
