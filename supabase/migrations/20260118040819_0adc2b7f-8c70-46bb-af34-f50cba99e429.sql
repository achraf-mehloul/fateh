-- جدول الولايات الجزائرية
CREATE TABLE public.wilayas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(2) NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  shipping_cost NUMERIC NOT NULL DEFAULT 600,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول البلديات
CREATE TABLE public.municipalities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wilaya_id UUID NOT NULL REFERENCES public.wilayas(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة للجميع
CREATE POLICY "Anyone can view wilayas" ON public.wilayas FOR SELECT USING (true);
CREATE POLICY "Anyone can view municipalities" ON public.municipalities FOR SELECT USING (true);

-- سياسات الإدارة للأدمن
CREATE POLICY "Admins can manage wilayas" ON public.wilayas FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage municipalities" ON public.municipalities FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- فهرس لتحسين الأداء
CREATE INDEX idx_municipalities_wilaya ON public.municipalities(wilaya_id);
CREATE INDEX idx_wilayas_code ON public.wilayas(code);