import earbudsImg from '@/assets/products/earbuds.jpg';
import smartwatchImg from '@/assets/products/smartwatch.jpg';
import handbagImg from '@/assets/products/handbag.jpg';
import sunglassesImg from '@/assets/products/sunglasses.jpg';
import lampImg from '@/assets/products/lamp.jpg';
import perfumeImg from '@/assets/products/perfume.jpg';
import shoesImg from '@/assets/products/shoes.jpg';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  description: string;
  specifications?: { label: string; value: string }[];
  reviews?: Review[];
  stock?: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Wilaya {
  code: string;
  name: string;
  municipalities: string[];
  shippingCost: number;
  officeShippingCost?: number;
}

export type DeliveryType = 'home' | 'office';

// تكلفة التوصيل إلى المكتب (Stop Desk) أرخص من التوصيل للمنزل
export const getOfficeShippingCost = (homeCost: number): number =>
  Math.max(300, homeCost - 200);

// دالة للحصول على تكلفة التوصيل حسب كود الولاية ونوع التوصيل
export const getShippingCost = (wilayaCode: string, deliveryType: DeliveryType = 'home'): number => {
  const wilaya = wilayas.find(w => w.code === wilayaCode);
  const homeCost = wilaya?.shippingCost || 600; // سعر افتراضي
  if (deliveryType === 'office') {
    return wilaya?.officeShippingCost ?? getOfficeShippingCost(homeCost);
  }
  return homeCost;
};


// Sample reviews
const sampleReviews: Review[] = [
  { id: 'r1', userName: 'أحمد محمد', rating: 5, comment: 'منتج ممتاز! جودة عالية وتوصيل سريع. أنصح به بشدة.', date: '2024-01-15' },
  { id: 'r2', userName: 'سارة علي', rating: 4, comment: 'جيد جداً، يستحق السعر. التغليف كان رائع.', date: '2024-01-10' },
  { id: 'r3', userName: 'محمد خالد', rating: 5, comment: 'أفضل شراء قمت به! شكراً للمتجر.', date: '2024-01-08' },
  { id: 'r4', userName: 'فاطمة أحمد', rating: 4, comment: 'المنتج كما في الصورة تماماً. راضية عن الشراء.', date: '2024-01-05' },
];

export const categories: Category[] = [
  { id: 'electronics', name: 'الإلكترونيات', image: earbudsImg },
  { id: 'fashion', name: 'الأزياء', image: handbagImg },
  { id: 'home', name: 'المنزل', image: lampImg },
  { id: 'beauty', name: 'الجمال', image: perfumeImg },
  { id: 'sports', name: 'الرياضة', image: shoesImg },
];

export const products: Product[] = [
  // Electronics
  { 
    id: '1', 
    name: 'سماعات لاسلكية', 
    price: 4500, 
    image: earbudsImg, 
    images: [earbudsImg, smartwatchImg, earbudsImg],
    category: 'electronics', 
    description: 'سماعات بلوتوث عالية الجودة مع عزل للضوضاء وبطارية تدوم طويلاً',
    specifications: [
      { label: 'نوع الاتصال', value: 'بلوتوث 5.0' },
      { label: 'عمر البطارية', value: '24 ساعة' },
      { label: 'مقاومة الماء', value: 'IPX5' },
      { label: 'الوزن', value: '50 غرام' },
    ],
    reviews: sampleReviews,
  },
  { 
    id: '2', 
    name: 'ساعة ذكية', 
    price: 12000, 
    image: smartwatchImg, 
    images: [smartwatchImg, earbudsImg, smartwatchImg],
    category: 'electronics', 
    description: 'ساعة ذكية متعددة الوظائف مع شاشة AMOLED وتتبع اللياقة البدنية',
    specifications: [
      { label: 'حجم الشاشة', value: '1.4 بوصة AMOLED' },
      { label: 'عمر البطارية', value: '7 أيام' },
      { label: 'مقاومة الماء', value: '5 ATM' },
      { label: 'التوافق', value: 'iOS و Android' },
    ],
    reviews: sampleReviews.slice(0, 3),
  },
  { 
    id: '3', 
    name: 'شاحن سريع', 
    price: 2500, 
    image: earbudsImg, 
    images: [earbudsImg],
    category: 'electronics', 
    description: 'شاحن 65 واط سريع يدعم الشحن السريع لجميع الأجهزة',
    specifications: [
      { label: 'القدرة', value: '65 واط' },
      { label: 'المنافذ', value: 'USB-C + USB-A' },
      { label: 'الحماية', value: 'حماية من الحرارة الزائدة' },
    ],
    reviews: sampleReviews.slice(1, 4),
  },
  { 
    id: '4', 
    name: 'كاميرا ويب', 
    price: 8000, 
    image: smartwatchImg, 
    images: [smartwatchImg, earbudsImg],
    category: 'electronics', 
    description: 'كاميرا HD للاجتماعات والبث المباشر بدقة 1080p',
    specifications: [
      { label: 'الدقة', value: '1080p Full HD' },
      { label: 'معدل الإطارات', value: '30 إطار/ثانية' },
      { label: 'الميكروفون', value: 'مدمج مع إلغاء الضوضاء' },
    ],
    reviews: sampleReviews.slice(0, 2),
  },
  { 
    id: '5', 
    name: 'لوحة مفاتيح', 
    price: 6500, 
    image: earbudsImg, 
    images: [earbudsImg, smartwatchImg],
    category: 'electronics', 
    description: 'لوحة مفاتيح ميكانيكية RGB للألعاب والكتابة',
    specifications: [
      { label: 'نوع المفاتيح', value: 'ميكانيكية' },
      { label: 'الإضاءة', value: 'RGB قابلة للتخصيص' },
      { label: 'الاتصال', value: 'سلكي USB' },
    ],
    reviews: sampleReviews,
  },
  
  // Fashion
  { 
    id: '6', 
    name: 'حقيبة جلدية', 
    price: 7500, 
    image: handbagImg, 
    images: [handbagImg, sunglassesImg, handbagImg],
    category: 'fashion', 
    description: 'حقيبة جلد طبيعي فاخرة بتصميم عصري وأنيق',
    specifications: [
      { label: 'الخامة', value: 'جلد طبيعي 100%' },
      { label: 'الأبعاد', value: '30×25×12 سم' },
      { label: 'الجيوب', value: '3 جيوب داخلية + جيب خارجي' },
    ],
    reviews: sampleReviews.slice(0, 3),
  },
  { 
    id: '7', 
    name: 'نظارة شمسية', 
    price: 3500, 
    image: sunglassesImg, 
    images: [sunglassesImg, handbagImg],
    category: 'fashion', 
    description: 'نظارة شمسية أنيقة مع حماية UV400',
    specifications: [
      { label: 'الحماية', value: 'UV400' },
      { label: 'الإطار', value: 'معدن خفيف' },
      { label: 'العدسات', value: 'بولاريزد' },
    ],
    reviews: sampleReviews,
  },
  { 
    id: '8', 
    name: 'حزام كلاسيكي', 
    price: 2000, 
    image: handbagImg, 
    images: [handbagImg],
    category: 'fashion', 
    description: 'حزام جلد فاخر بتصميم كلاسيكي',
    specifications: [
      { label: 'الخامة', value: 'جلد طبيعي' },
      { label: 'الطول', value: 'قابل للتعديل' },
      { label: 'الإبزيم', value: 'معدن مطلي' },
    ],
    reviews: sampleReviews.slice(2),
  },
  { 
    id: '9', 
    name: 'محفظة رجالية', 
    price: 4000, 
    image: handbagImg, 
    images: [handbagImg, sunglassesImg],
    category: 'fashion', 
    description: 'محفظة جلد أصلي بتصميم عملي',
    specifications: [
      { label: 'الخامة', value: 'جلد أصلي' },
      { label: 'الجيوب', value: '8 جيوب للبطاقات' },
      { label: 'الحجم', value: 'مدمج' },
    ],
    reviews: sampleReviews.slice(0, 2),
  },
  { 
    id: '10', 
    name: 'قبعة أنيقة', 
    price: 1500, 
    image: sunglassesImg, 
    images: [sunglassesImg],
    category: 'fashion', 
    description: 'قبعة قطنية مريحة بتصميم عصري',
    specifications: [
      { label: 'الخامة', value: 'قطن 100%' },
      { label: 'الحجم', value: 'قابل للتعديل' },
    ],
    reviews: sampleReviews.slice(1, 3),
  },
  
  // Home
  { 
    id: '11', 
    name: 'مصباح طاولة', 
    price: 3000, 
    image: lampImg, 
    images: [lampImg, perfumeImg, lampImg],
    category: 'home', 
    description: 'مصباح LED حديث مع إضاءة قابلة للتعديل',
    specifications: [
      { label: 'نوع الإضاءة', value: 'LED' },
      { label: 'درجات السطوع', value: '3 مستويات' },
      { label: 'الارتفاع', value: '45 سم' },
    ],
    reviews: sampleReviews,
  },
  { 
    id: '12', 
    name: 'وسادة مريحة', 
    price: 1800, 
    image: lampImg, 
    images: [lampImg],
    category: 'home', 
    description: 'وسادة قطنية ناعمة للراحة والاسترخاء',
    specifications: [
      { label: 'الخامة', value: 'قطن ناعم' },
      { label: 'الأبعاد', value: '50×50 سم' },
      { label: 'الحشوة', value: 'ألياف مضادة للحساسية' },
    ],
    reviews: sampleReviews.slice(0, 2),
  },
  { 
    id: '13', 
    name: 'ساعة حائط', 
    price: 2500, 
    image: smartwatchImg, 
    images: [smartwatchImg, lampImg],
    category: 'home', 
    description: 'ساعة حائط عصرية بتصميم أنيق',
    specifications: [
      { label: 'القطر', value: '30 سم' },
      { label: 'الحركة', value: 'كوارتز صامت' },
    ],
    reviews: sampleReviews.slice(1),
  },
  { 
    id: '14', 
    name: 'مزهرية', 
    price: 2200, 
    image: lampImg, 
    images: [lampImg, perfumeImg],
    category: 'home', 
    description: 'مزهرية سيراميك أنيقة لتزيين المنزل',
    specifications: [
      { label: 'الخامة', value: 'سيراميك' },
      { label: 'الارتفاع', value: '25 سم' },
    ],
    reviews: sampleReviews.slice(0, 3),
  },
  { 
    id: '15', 
    name: 'إطار صور', 
    price: 1200, 
    image: lampImg, 
    images: [lampImg],
    category: 'home', 
    description: 'إطار خشبي للصور بتصميم كلاسيكي',
    specifications: [
      { label: 'الخامة', value: 'خشب' },
      { label: 'حجم الصورة', value: '20×15 سم' },
    ],
    reviews: sampleReviews.slice(2),
  },
  
  // Beauty
  { 
    id: '16', 
    name: 'عطر فاخر', 
    price: 9000, 
    image: perfumeImg, 
    images: [perfumeImg, lampImg, perfumeImg],
    category: 'beauty', 
    description: 'عطر فرنسي أصلي برائحة فاخرة تدوم طويلاً',
    specifications: [
      { label: 'الحجم', value: '100 مل' },
      { label: 'التركيز', value: 'Eau de Parfum' },
      { label: 'المكونات', value: 'عود، مسك، عنبر' },
      { label: 'مدة الثبات', value: '12+ ساعة' },
    ],
    reviews: sampleReviews,
  },
  { 
    id: '17', 
    name: 'طقم مكياج', 
    price: 5500, 
    image: perfumeImg, 
    images: [perfumeImg, lampImg],
    category: 'beauty', 
    description: 'طقم مكياج متكامل للإطلالة المثالية',
    specifications: [
      { label: 'عدد القطع', value: '24 قطعة' },
      { label: 'يشمل', value: 'أحمر شفاه، ظلال، ماسكارا' },
    ],
    reviews: sampleReviews.slice(0, 3),
  },
  { 
    id: '18', 
    name: 'كريم مرطب', 
    price: 2800, 
    image: perfumeImg, 
    images: [perfumeImg],
    category: 'beauty', 
    description: 'كريم للوجه والجسم للترطيب العميق',
    specifications: [
      { label: 'الحجم', value: '200 مل' },
      { label: 'للبشرة', value: 'جميع أنواع البشرة' },
    ],
    reviews: sampleReviews.slice(1, 4),
  },
  { 
    id: '19', 
    name: 'فرشاة شعر', 
    price: 1500, 
    image: perfumeImg, 
    images: [perfumeImg],
    category: 'beauty', 
    description: 'فرشاة خشبية طبيعية للعناية بالشعر',
    specifications: [
      { label: 'الخامة', value: 'خشب طبيعي' },
      { label: 'الشعيرات', value: 'طبيعية' },
    ],
    reviews: sampleReviews.slice(0, 2),
  },
  { 
    id: '20', 
    name: 'زيت أرغان', 
    price: 3200, 
    image: perfumeImg, 
    images: [perfumeImg, lampImg],
    category: 'beauty', 
    description: 'زيت أرغان مغربي أصلي للشعر والبشرة',
    specifications: [
      { label: 'الحجم', value: '50 مل' },
      { label: 'المصدر', value: 'مغربي 100%' },
      { label: 'الاستخدام', value: 'للشعر والوجه' },
    ],
    reviews: sampleReviews,
  },
  
  // Sports
  { 
    id: '21', 
    name: 'حذاء رياضي', 
    price: 8500, 
    image: shoesImg, 
    images: [shoesImg, handbagImg, shoesImg],
    category: 'sports', 
    description: 'حذاء للجري والتمارين بتصميم مريح وخفيف',
    specifications: [
      { label: 'الخامة', value: 'قماش شبكي' },
      { label: 'النعل', value: 'مطاط مرن' },
      { label: 'الوزن', value: '280 غرام' },
      { label: 'المقاسات', value: '38-45' },
    ],
    reviews: sampleReviews,
  },
  { 
    id: '22', 
    name: 'زجاجة ماء', 
    price: 800, 
    image: shoesImg, 
    images: [shoesImg],
    category: 'sports', 
    description: 'زجاجة رياضية 1 لتر مانعة للتسرب',
    specifications: [
      { label: 'السعة', value: '1 لتر' },
      { label: 'الخامة', value: 'بلاستيك BPA-free' },
    ],
    reviews: sampleReviews.slice(0, 2),
  },
  { 
    id: '23', 
    name: 'حبل قفز', 
    price: 600, 
    image: shoesImg, 
    images: [shoesImg],
    category: 'sports', 
    description: 'حبل قفز للتمارين الهوائية',
    specifications: [
      { label: 'الطول', value: 'قابل للتعديل 3 م' },
      { label: 'المقبض', value: 'مريح وغير قابل للانزلاق' },
    ],
    reviews: sampleReviews.slice(1, 3),
  },
  { 
    id: '24', 
    name: 'دمبل', 
    price: 3500, 
    image: shoesImg, 
    images: [shoesImg, handbagImg],
    category: 'sports', 
    description: 'أثقال للتمارين 5 كغ مع طلاء مطاطي',
    specifications: [
      { label: 'الوزن', value: '5 كغ × 2' },
      { label: 'الطلاء', value: 'مطاط مانع للانزلاق' },
    ],
    reviews: sampleReviews.slice(0, 3),
  },
  { 
    id: '25', 
    name: 'سجادة يوغا', 
    price: 2000, 
    image: shoesImg, 
    images: [shoesImg],
    category: 'sports', 
    description: 'سجادة مضادة للانزلاق للتمارين واليوغا',
    specifications: [
      { label: 'الأبعاد', value: '180×60 سم' },
      { label: 'السماكة', value: '6 مم' },
      { label: 'الخامة', value: 'TPE صديق للبيئة' },
    ],
    reviews: sampleReviews,
  },
];

export const wilayas: Wilaya[] = [
  {
    code: '01',
    name: 'أدرار',
    municipalities: ['أدرار', 'رقان', 'تيميمون', 'أولف', 'تسابيت', 'شروين', 'زاوية كنتة', 'أوقروت', 'تيط', 'فنوغيل', 'تينركوك'],
    shippingCost: 900
  },
  {
    code: '02',
    name: 'الشلف',
    municipalities: ['الشلف', 'تنس', 'الشطية', 'بوقادير', 'واد فضة', 'عين مران', 'وادي سلي', 'تاوقريت', 'بني حواء', 'صبحة', 'حرشون', 'أولاد فارس', 'سنجاس', 'مصدق', 'بني راشد'],
    shippingCost: 500
  },
  {
    code: '03',
    name: 'الأغواط',
    municipalities: ['الأغواط', 'قصر الحيران', 'حاسي الرمل', 'عين ماضي', 'الحويطة', 'بريدة', 'الغيشة', 'الحاج المشري', 'سبقاق', 'تاجموت', 'الخنق', 'أفلو', 'قلتة سيدي سعد'],
    shippingCost: 700
  },
  {
    code: '04',
    name: 'أم البواقي',
    municipalities: ['أم البواقي', 'عين البيضاء', 'عين مليلة', 'عين فكرون', 'بئر الشهداء', 'الفجوج', 'سوق نعمان', 'فكيرينة', 'الضلعة', 'العامرية', 'عين ببوش', 'الحرملية', 'مسكيانة', 'قصر الصبيحي'],
    shippingCost: 600
  },
  {
    code: '05',
    name: 'باتنة',
    municipalities: ['باتنة', 'بريكة', 'عين التوتة', 'مروانة', 'نقاوس', 'تازولت', 'الجزار', 'سريانة', 'منعة', 'إشمول', 'فم الطوب', 'عيون العصافير', 'الشمرة', 'تيغانيمين', 'راس العيون', 'ثنية العابد', 'القصبات'],
    shippingCost: 550
  },
];