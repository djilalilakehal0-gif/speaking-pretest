import { Link } from 'react-router-dom';
import { Crescent } from './Icons.jsx';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-gold/20 bg-black/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2"><Crescent /><span className="text-lg font-extrabold gold-text">نور اليقين</span></div>
          <p className="mt-3 text-sm leading-7 text-ivory/70">أدعية تلامس القلب، ومقاطع تجدد اليقين وتزرع الأمل. whbo94</p>
        </div>
        <nav aria-label="روابط التذييل">
          <h2 className="font-bold text-gold-soft">روابط</h2>
          <ul className="mt-3 space-y-2 text-sm text-ivory/75">
            <li><Link className="hover:text-gold-soft" to="/privacy">سياسة الخصوصية</Link></li>
            <li><Link className="hover:text-gold-soft" to="/terms">شروط الاستخدام</Link></li>
            <li><Link className="hover:text-gold-soft" to="/contact">اتصل بنا</Link></li>
          </ul>
        </nav>
        <p className="text-sm leading-7 text-ivory/60">
          الآيات الكريمة المعروضة منقولة للتذكير فقط، وننصح بمراجعتها من مصحف موثوق. المقاطع المنشورة تعبّر عن أصحابها.
        </p>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-ivory/50">© {new Date().getFullYear()} نور اليقين — جميع الحقوق محفوظة</div>
    </footer>
  );
}
