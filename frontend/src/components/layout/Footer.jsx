export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-nightfall/70">
      <div className="mx-auto max-w-7xl px-6 py-6 text-center text-xs uppercase tracking-[0.2em] text-slate-500 lg:px-10">
        © {new Date().getFullYear()} Kris Kringle Gift Exchange · Crafted for joyful teams
      </div>
    </footer>
  );
}
