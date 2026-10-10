import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import logo from '@/assets/logo.png';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Logo & About */}
          <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start gap-3 sm:gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Velvet Store" className="h-10 w-10 sm:h-12 sm:w-12" />
              <span className="font-display text-lg gradient-text">Velvet Store</span>
            </Link>
            <p className="font-footer text-sm sm:text-base text-muted-foreground text-center md:text-right leading-relaxed">
              متجر Velvet Store - وجهتك الأولى للتسوق الأنيق والمنتجات الفاخرة
            </p>
            {/* Social Icons */}
            <div className="flex gap-3 mt-2">
              <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-right">
            <h3 className="font-footer text-base sm:text-lg mb-3 sm:mb-4 gradient-text">روابط سريعة</h3>
            <ul className="font-footer space-y-2 text-sm sm:text-base text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-primary transition-colors">السلة</Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-primary transition-colors">تتبع الطلب</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="text-center md:text-right">
            <h3 className="font-footer text-base sm:text-lg mb-3 sm:mb-4 gradient-text">التصنيفات</h3>
            <ul className="font-footer space-y-2 text-sm sm:text-base text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">إلكترونيات</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">أزياء</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">إكسسوارات</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">عطور</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center md:text-right col-span-2 md:col-span-1">
            <h3 className="font-footer text-base sm:text-lg mb-3 sm:mb-4 gradient-text">تواصل معنا</h3>
            <ul className="font-footer space-y-3 text-sm sm:text-base text-muted-foreground">
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="break-all">info@velvetstore.dz</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span dir="ltr">+213 555 123 456</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>الجزائر العاصمة</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
            <p className="font-footer text-sm text-muted-foreground">
              © 2026 Velvet Store. جميع الحقوق محفوظة.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground font-footer">
              <a href="#" className="hover:text-primary transition-colors">سياسة الخصوصية</a>
              <a href="#" className="hover:text-primary transition-colors">الشروط والأحكام</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;