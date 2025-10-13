import Header from './Header.jsx';
import Footer from './Footer.jsx';
import ToastContainer from '../common/ToastContainer.jsx';

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-nightfall text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-aurora-gradient" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-aurora/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-orchid/15 blur-3xl" aria-hidden="true" />

      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10 lg:py-16">{children}</div>
        </main>
        <Footer />
      </div>
      <ToastContainer />
    </div>
  );
}
