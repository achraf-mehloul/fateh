-- إنشاء جدول الكوبونات
CREATE TABLE public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    target TEXT NOT NULL CHECK (target IN ('products', 'shipping')),
    value NUMERIC NOT NULL CHECK (value > 0),
    min_order_amount NUMERIC DEFAULT NULL,
    max_uses INTEGER DEFAULT NULL,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - الأدمن فقط يمكنه إدارة الكوبونات
CREATE POLICY "Admins can view all coupons" 
ON public.coupons 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create coupons" 
ON public.coupons 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coupons" 
ON public.coupons 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete coupons" 
ON public.coupons 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- دالة للتحقق من صلاحية الكوبون (للعملاء)
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _order_total numeric)
RETURNS TABLE (
    valid boolean,
    coupon_id uuid,
    code text,
    type text,
    target text,
    value numeric,
    error_message text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _coupon RECORD;
BEGIN
    -- البحث عن الكوبون
    SELECT * INTO _coupon FROM public.coupons c WHERE UPPER(c.code) = UPPER(_code);
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::numeric, 'كود الخصم غير صحيح'::text;
        RETURN;
    END IF;
    
    -- التحقق من التفعيل
    IF NOT _coupon.is_active THEN
        RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::numeric, 'كود الخصم غير مفعل'::text;
        RETURN;
    END IF;
    
    -- التحقق من تاريخ الانتهاء
    IF _coupon.expires_at IS NOT NULL AND _coupon.expires_at < now() THEN
        RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::numeric, 'كود الخصم منتهي الصلاحية'::text;
        RETURN;
    END IF;
    
    -- التحقق من عدد الاستخدامات
    IF _coupon.max_uses IS NOT NULL AND _coupon.used_count >= _coupon.max_uses THEN
        RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::numeric, 'تم استنفاد عدد مرات استخدام الكوبون'::text;
        RETURN;
    END IF;
    
    -- التحقق من الحد الأدنى للطلب
    IF _coupon.min_order_amount IS NOT NULL AND _order_total < _coupon.min_order_amount THEN
        RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::numeric, ('الحد الأدنى للطلب ' || _coupon.min_order_amount::text || ' دج')::text;
        RETURN;
    END IF;
    
    -- الكوبون صالح
    RETURN QUERY SELECT true, _coupon.id, _coupon.code, _coupon.type, _coupon.target, _coupon.value, NULL::text;
END;
$$;

-- تحديث updated_at تلقائياً
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();