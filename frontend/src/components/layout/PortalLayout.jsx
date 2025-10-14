import PortalHeader from './PortalHeader.jsx';
import PortalFooter from './PortalFooter.jsx';
import ToastContainer from '../common/ToastContainer.jsx';

export default function PortalLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-icc-gray-50 via-white to-icc-gray-100">
      <div className="pointer-events-none absolute inset-0 bg-hero-gradient opacity-[0.03]" aria-hidden="true" />
      <div className="relative flex min-h-screen flex-col">
        <PortalHeader />
        <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="relative bg-white/80 backdrop-blur border border-white/60 rounded-3xl shadow-card p-6 sm:p-10">
              {children}
            </div>
          </div>
        </main>
        <PortalFooter />
      </div>
      <ToastContainer />
    </div>
  );
}
