import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Background from './components/Background.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Watch from './pages/Watch.jsx';
import Admin from './pages/Admin.jsx';
import { Contact, Privacy, Terms } from './pages/Static.jsx';
import { useApp } from './lib/state.jsx';

function NotFound() {
  return <p className="py-32 text-center text-xl text-ivory/80">الصفحة غير موجودة.</p>;
}

export default function App() {
  const { toast } = useApp();
  const { pathname } = useLocation();
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <Background />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-ink">تخطّي إلى المحتوى</a>
      <Header />
      <main id="main" className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/v/:id" element={<Watch />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
        {toast && <div className="glass rounded-full px-5 py-3 text-sm text-gold-soft shadow-xl">{toast}</div>}
      </div>
    </>
  );
}
