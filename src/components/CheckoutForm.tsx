import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Banknote, CreditCard, Upload, ArrowLeft, Check, Copy, Loader2, Image as ImageIcon, Tag, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { wilayas, getShippingCost } from '@/data/store';
import { createOrder, Order } from '@/lib/orders';
import { isValidAlgerianPhone, normalizePhone, PHONE_ERROR_MESSAGE, isValidName, NAME_ERROR_MESSAGE } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// واجهة الكوبون
interface AppliedCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  target: 'products' | 'shipping';
  value: number;
}

// دالة لحساب الخصم
const calculateDiscount = (coupon: AppliedCoupon, productTotal: number, shippingCost: number): { productDiscount: number; shippingDiscount: number } => {
  let productDiscount = 0;
  let shippingDiscount = 0;
  
  if (coupon.target === 'products') {
    if (coupon.type === 'percentage') {
      productDiscount = Math.round(productTotal * (coupon.value / 100));
    } else {
      productDiscount = Math.min(coupon.value, productTotal);
    }
  } else if (coupon.target === 'shipping') {
    if (coupon.type === 'percentage') {
      shippingDiscount = Math.round(shippingCost * (coupon.value / 100));
    } else {
      shippingDiscount = Math.min(coupon.value, shippingCost);
    }
  }
  
  return { productDiscount, shippingDiscount };
};

type PaymentMethod = 'cash' | 'baridimob' | null;
type CheckoutStep = 'method' | 'details' | 'baridimob-pay' | 'baridimob-confirm' | 'success';

const BARIDIMOB_ACCOUNT = '00799999001234567890'; // رقم حساب البريدي موب

const CheckoutForm: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [step, setStep] = useState<CheckoutStep>('method');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Cash form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'office'>('home');
  
  // Baridimob form
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [senderAccount, setSenderAccount] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Baridimob customer details
  const [baridimobFullName, setBaridimobFullName] = useState('');
  const [baridimobPhone, setBaridimobPhone] = useState('');
  const [baridimobWilaya, setBaridimobWilaya] = useState('');
  const [baridimobMunicipality, setBaridimobMunicipality] = useState('');
  
  // حالة الكوبون
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  const baridimobWilayaData = wilayas.find(w => w.code === baridimobWilaya);
  const selectedWilayaData = wilayas.find(w => w.code === selectedWilaya);
  
  // حساب تكلفة التوصيل حسب الولاية ونوع التوصيل (منزل / مكتب)
  const shippingCost = selectedWilaya ? getShippingCost(selectedWilaya, deliveryType) : 0;
  const baridimobShippingCost = baridimobWilaya ? getShippingCost(baridimobWilaya, deliveryType) : 0;

  
  // حساب الخصم
  const { productDiscount, shippingDiscount } = appliedCoupon 
    ? calculateDiscount(appliedCoupon, totalPrice, shippingCost)
    : { productDiscount: 0, shippingDiscount: 0 };
  
  const { productDiscount: baridimobProductDiscount, shippingDiscount: baridimobShippingDiscount } = appliedCoupon 
    ? calculateDiscount(appliedCoupon, totalPrice, baridimobShippingCost)
    : { productDiscount: 0, shippingDiscount: 0 };
  
  const totalWithShipping = totalPrice - productDiscount + shippingCost - shippingDiscount;
  const baridimobTotalWithShipping = totalPrice - baridimobProductDiscount + baridimobShippingCost - baridimobShippingDiscount;

  // تطبيق الكوبون من قاعدة البيانات
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('أدخل كود الخصم');
      return;
    }
    
    setIsValidatingCoupon(true);
    setCouponError('');
    
    try {
      const { data, error } = await supabase
        .rpc('validate_coupon', { 
          _code: couponCode, 
          _order_total: totalPrice 
        });
      
      if (error) {
        console.error('Coupon validation error:', error);
        setCouponError('حدث خطأ أثناء التحقق من الكوبون');
        setAppliedCoupon(null);
      } else if (data && data.length > 0) {
        const result = data[0];
        if (result.valid) {
          setAppliedCoupon({
            id: result.coupon_id,
            code: result.code,
            type: result.type as 'percentage' | 'fixed',
            target: result.target as 'products' | 'shipping',
            value: result.value,
          });
          toast.success('تم تطبيق كود الخصم بنجاح!');
        } else {
          setCouponError(result.error_message || 'كود غير صحيح');
          setAppliedCoupon(null);
        }
      } else {
        setCouponError('كود الخصم غير صحيح');
        setAppliedCoupon(null);
      }
    } catch (err) {
      console.error('Coupon validation exception:', err);
      setCouponError('حدث خطأ أثناء التحقق من الكوبون');
      setAppliedCoupon(null);
    }
    
    setIsValidatingCoupon(false);
  };
  
  // إزالة الكوبون
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    toast.info('تم إزالة كود الخصم');
  };

  const copyOrderNumber = () => {
    if (createdOrder) {
      navigator.clipboard.writeText(createdOrder.order_number);
      setCopied(true);
      toast.success('تم نسخ رقم الطلب');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !selectedWilaya || !selectedMunicipality) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (!isValidName(fullName)) {
      toast.error(NAME_ERROR_MESSAGE);
      return;
    }
    if (!isValidAlgerianPhone(phone)) {
      toast.error(PHONE_ERROR_MESSAGE);
      return;
    }
    
    setIsSubmitting(true);
    const wilayaName = selectedWilayaData?.name || selectedWilaya;
    const order = await createOrder(
      items,
      totalWithShipping,
      fullName.trim(),
      wilayaName,
      selectedMunicipality,
      'cash',
      normalizePhone(phone),
      undefined,
      undefined,
      deliveryType
    );
    
    if (order) {
      setCreatedOrder(order);
      setStep('success');
      clearCart();
      toast.success('تم تأكيد طلبك بنجاح!');
    } else {
      toast.error('حدث خطأ أثناء إنشاء الطلب');
    }
    setIsSubmitting(false);
  };


  const handleBaridimobPayment = () => {
    // Open Baridimob app (simulated)
    window.open('https://baridimob.poste.dz/', '_blank');
    setStep('baridimob-confirm');
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('يرجى اختيار صورة فقط');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)');
        return;
      }
      
      setPaymentReceipt(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadReceiptToStorage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `receipts/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }
    
    const { data } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const handleBaridimobConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!baridimobFullName || !baridimobWilaya || !baridimobMunicipality) {
      toast.error('يرجى ملء جميع معلومات التوصيل');
      return;
    }

    if (!isValidName(baridimobFullName)) {
      toast.error(NAME_ERROR_MESSAGE);
      return;
    }

    if (!isValidAlgerianPhone(baridimobPhone)) {
      toast.error(PHONE_ERROR_MESSAGE);
      return;
    }
    
    if (!paymentReceipt || !senderAccount) {
      toast.error('يرجى إرفاق صورة الدفع وكتابة رقم الحساب');
      return;
    }
    
    setIsSubmitting(true);
    setIsUploading(true);
    
    // Upload receipt to storage
    const receiptUrl = await uploadReceiptToStorage(paymentReceipt);
    setIsUploading(false);
    
    if (!receiptUrl) {
      toast.error('حدث خطأ أثناء رفع صورة الدفع');
      setIsSubmitting(false);
      return;
    }
    
    const wilayaName = baridimobWilayaData?.name || baridimobWilaya;
    const order = await createOrder(
      items,
      baridimobTotalWithShipping,
      baridimobFullName.trim(),
      wilayaName,
      baridimobMunicipality,
      'baridimob',
      normalizePhone(baridimobPhone),
      senderAccount,
      receiptUrl,
      deliveryType
    );
    
    if (order) {
      setCreatedOrder(order);
      setStep('success');
      clearCart();
      toast.success('تم تأكيد طلبك بنجاح!');
    } else {
      toast.error('حدث خطأ أثناء إنشاء الطلب');
    }
    setIsSubmitting(false);
  };


  if (items.length === 0 && step !== 'success') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">السلة فارغة</p>
        <Button onClick={() => navigate('/')} className="btn-velvet">
          العودة للتسوق
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Success Step */}
      {step === 'success' && createdOrder && (
        <div className="text-center py-12 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="font-display text-2xl mb-4 gradient-text">تم تأكيد طلبك!</h2>
          
          {/* Order Number Display */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6 max-w-sm mx-auto">
            <p className="text-sm text-muted-foreground mb-2">رقم طلبك</p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-xl font-bold gradient-text" dir="ltr">
                {createdOrder.order_number}
              </span>
              <button
                onClick={copyOrderNumber}
                className="p-2 rounded-md hover:bg-muted transition-colors"
                title="نسخ رقم الطلب"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              احتفظ بهذا الرقم لتتبع حالة طلبك
            </p>
          </div>

          <p className="text-muted-foreground mb-6">شكراً لتسوقك معنا. سنتواصل معك قريباً.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={`/track-order?order=${createdOrder.order_number}`}>
              <Button variant="outline" className="w-full sm:w-auto">
                تتبع الطلب
              </Button>
            </Link>
            <Button onClick={() => navigate('/')} className="btn-velvet">
              العودة للتسوق
            </Button>
          </div>
        </div>
      )}

      {/* Payment Method Selection */}
      {step === 'method' && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="font-display text-xl mb-6 text-center gradient-text">اختر طريقة الدفع</h2>
          
          <button
            onClick={() => {
              setPaymentMethod('cash');
              setStep('details');
            }}
            className="w-full p-6 rounded-xl border-2 border-border hover:border-primary bg-card transition-all duration-300 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Banknote className="h-6 w-6 text-primary" />
            </div>
            <div className="text-right">
              <h3 className="font-semibold text-lg">الدفع عند الاستلام</h3>
              <p className="text-muted-foreground text-sm">ادفع نقداً عند وصول طلبك</p>
            </div>
          </button>

          <button
            onClick={() => {
              setPaymentMethod('baridimob');
              setStep('baridimob-pay');
            }}
            className="w-full p-6 rounded-xl border-2 border-border hover:border-secondary bg-card transition-all duration-300 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
              <CreditCard className="h-6 w-6 text-secondary" />
            </div>
            <div className="text-right">
              <h3 className="font-semibold text-lg">البريدي موب</h3>
              <p className="text-muted-foreground text-sm">الدفع عبر تطبيق البريدي موب</p>
            </div>
          </button>
        </div>
      )}

      {/* Cash Payment Details */}
      {step === 'details' && paymentMethod === 'cash' && (
        <form onSubmit={handleCashSubmit} className="space-y-6 animate-fade-in">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep('method')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            رجوع
          </Button>

          <h2 className="font-display text-xl mb-6 text-center gradient-text">معلومات التوصيل</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">الاسم واللقب</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0555 12 34 56"
                className="mt-1 text-left"
                required
              />
              {phone && !isValidAlgerianPhone(phone) && (
                <p className="text-xs text-destructive mt-1">{PHONE_ERROR_MESSAGE}</p>
              )}
            </div>


            <div>
              <Label htmlFor="wilaya">الولاية</Label>
              <Select value={selectedWilaya} onValueChange={(value) => {
                setSelectedWilaya(value);
                setSelectedMunicipality('');
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر الولاية" />
                </SelectTrigger>
                <SelectContent>
                  {wilayas.map((wilaya) => (
                    <SelectItem key={wilaya.code} value={wilaya.code}>
                      {wilaya.code} - {wilaya.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedWilayaData && (
              <div>
                <Label htmlFor="municipality">البلدية</Label>
                <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="اختر البلدية" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedWilayaData.municipalities.map((municipality) => (
                      <SelectItem key={municipality} value={municipality}>
                        {municipality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* نوع التوصيل */}
            <div>
              <Label>نوع التوصيل</Label>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType('home')}
                  className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                    deliveryType === 'home' ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-primary/50'
                  }`}
                >
                  🏠 توصيل للمنزل
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('office')}
                  className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                    deliveryType === 'office' ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-primary/50'
                  }`}
                >
                  🏢 توصيل للمكتب
                </button>
              </div>
            </div>
          </div>

          {/* حقل كود الخصم */}
          <div className="pt-4 border-t border-border">
            <Label htmlFor="couponCode" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              كود الخصم
            </Label>
            {appliedCoupon ? (
              <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 font-medium">{appliedCoupon.code}</span>
                  <span className="text-xs text-muted-foreground">
                    ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `${appliedCoupon.value} دج`}
                    {appliedCoupon.target === 'shipping' ? ' على التوصيل' : ' على المنتجات'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="p-1 hover:bg-destructive/10 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <Input
                  id="couponCode"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError('');
                  }}
                  placeholder="أدخل كود الخصم"
                  className="flex-1"
                  dir="ltr"
                />
                <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={isValidatingCoupon}>
                  {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تطبيق'}
                </Button>
              </div>
            )}
            {couponError && (
              <p className="text-xs text-destructive mt-1">{couponError}</p>
            )}
          </div>

          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex justify-between text-muted-foreground">
              <span>المنتجات</span>
              <span>{totalPrice.toLocaleString()} دج</span>
            </div>
            {productDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>خصم المنتجات</span>
                <span>- {productDiscount.toLocaleString()} دج</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>التوصيل ({selectedWilayaData?.name})</span>
              <span className={shippingCost === 0 ? 'text-green-500' : ''}>
                {shippingCost > 0 ? `${shippingCost.toLocaleString()} دج` : 'اختر الولاية'}
              </span>
            </div>
            {shippingDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>خصم التوصيل</span>
                <span>- {shippingDiscount.toLocaleString()} دج</span>
              </div>
            )}
            <div className="border-t border-border pt-3">
              <div className="flex justify-between font-bold text-lg">
                <span>المجموع الكلي</span>
                <span className="gradient-text">{totalWithShipping.toLocaleString()} دج</span>
              </div>
            </div>
            <Button type="submit" className="w-full btn-velvet" disabled={isSubmitting}>
              {isSubmitting ? 'جاري التأكيد...' : 'تأكيد الطلب'}
            </Button>
          </div>
        </form>
      )}

      {/* Baridimob Payment */}
      {step === 'baridimob-pay' && (
        <div className="space-y-6 animate-fade-in">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep('method')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            رجوع
          </Button>

          <h2 className="font-display text-xl mb-6 text-center gradient-text">الدفع عبر البريدي موب</h2>

          <div className="p-6 bg-card rounded-xl border border-border text-center">
            <p className="text-muted-foreground mb-2">أرسل المبلغ إلى الحساب التالي:</p>
            <p className="font-mono text-lg font-bold gradient-text mb-4 break-all">{BARIDIMOB_ACCOUNT}</p>
            <p className="text-muted-foreground mb-2">سعر المنتجات:</p>
            <p className="text-xl font-bold mb-2">{totalPrice.toLocaleString()} دج</p>
            <p className="text-xs text-muted-foreground mb-4">
              + تكلفة التوصيل (ستحدد بعد اختيار الولاية)
            </p>
            
            <Button onClick={handleBaridimobPayment} className="w-full btn-velvet">
              افتح تطبيق البريدي موب
            </Button>
          </div>
        </div>
      )}

      {/* Baridimob Confirmation */}
      {step === 'baridimob-confirm' && (
        <form onSubmit={handleBaridimobConfirm} className="space-y-6 animate-fade-in">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep('baridimob-pay')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            رجوع
          </Button>

          <h2 className="font-display text-xl mb-6 text-center gradient-text">تأكيد الدفع ومعلومات التوصيل</h2>

          <div className="space-y-4">
            {/* Payment Receipt Upload */}
            <div>
              <Label htmlFor="receipt">إرفاق صورة إثبات الدفع *</Label>
              <div className="mt-2">
                <label
                  htmlFor="receipt"
                  className={`flex flex-col items-center justify-center w-full ${receiptPreview ? 'h-auto' : 'h-32'} border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors bg-card overflow-hidden`}
                >
                  {receiptPreview ? (
                    <div className="relative w-full">
                      <img 
                        src={receiptPreview} 
                        alt="معاينة إيصال الدفع" 
                        className="w-full h-48 object-contain bg-muted"
                      />
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        تم الرفع
                      </div>
                      <div className="p-3 text-center border-t border-border">
                        <span className="text-sm text-muted-foreground">{paymentReceipt?.name}</span>
                        <p className="text-xs text-primary mt-1">انقر لتغيير الصورة</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm font-medium">انقر لرفع صورة الإيصال</span>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG حتى 5MB</p>
                    </div>
                  )}
                  <input
                    id="receipt"
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Sender Account */}
            <div>
              <Label htmlFor="senderAccount">رقم حساب المرسل *</Label>
              <Input
                id="senderAccount"
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value)}
                placeholder="أدخل رقم حسابك البريدي"
                className="mt-1 font-mono"
                dir="ltr"
                required
              />
            </div>

            {/* Delivery Details Section */}
            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold mb-4 text-center">معلومات التوصيل</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="baridimobFullName">الاسم واللقب *</Label>
                  <Input
                    id="baridimobFullName"
                    value={baridimobFullName}
                    onChange={(e) => setBaridimobFullName(e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="baridimobPhone">رقم الهاتف *</Label>
                  <Input
                    id="baridimobPhone"
                    type="tel"
                    inputMode="numeric"
                    dir="ltr"
                    value={baridimobPhone}
                    onChange={(e) => setBaridimobPhone(e.target.value)}
                    placeholder="0555 12 34 56"
                    className="mt-1 text-left"
                    required
                  />
                  {baridimobPhone && !isValidAlgerianPhone(baridimobPhone) && (
                    <p className="text-xs text-destructive mt-1">{PHONE_ERROR_MESSAGE}</p>
                  )}
                </div>


                <div>
                  <Label htmlFor="baridimobWilaya">الولاية *</Label>
                  <Select value={baridimobWilaya} onValueChange={(value) => {
                    setBaridimobWilaya(value);
                    setBaridimobMunicipality('');
                  }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر الولاية" />
                    </SelectTrigger>
                    <SelectContent>
                      {wilayas.map((wilaya) => (
                        <SelectItem key={wilaya.code} value={wilaya.code}>
                          {wilaya.code} - {wilaya.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {baridimobWilayaData && (
                  <div>
                    <Label htmlFor="baridimobMunicipality">البلدية *</Label>
                    <Select value={baridimobMunicipality} onValueChange={setBaridimobMunicipality}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="اختر البلدية" />
                      </SelectTrigger>
                      <SelectContent>
                        {baridimobWilayaData.municipalities.map((municipality) => (
                          <SelectItem key={municipality} value={municipality}>
                            {municipality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* نوع التوصيل */}
                <div>
                  <Label>نوع التوصيل</Label>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('home')}
                      className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                        deliveryType === 'home' ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      🏠 توصيل للمنزل
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('office')}
                      className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                        deliveryType === 'office' ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      🏢 توصيل للمكتب
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* حقل كود الخصم للبريدي موب */}
          <div className="pt-4 border-t border-border">
            <Label htmlFor="baridimobCouponCode" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              كود الخصم
            </Label>
            {appliedCoupon ? (
              <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 font-medium">{appliedCoupon.code}</span>
                  <span className="text-xs text-muted-foreground">
                    ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `${appliedCoupon.value} دج`}
                    {appliedCoupon.target === 'shipping' ? ' على التوصيل' : ' على المنتجات'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="p-1 hover:bg-destructive/10 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <Input
                  id="baridimobCouponCode"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError('');
                  }}
                  placeholder="أدخل كود الخصم"
                  className="flex-1"
                  dir="ltr"
                />
                <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={isValidatingCoupon}>
                  {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تطبيق'}
                </Button>
              </div>
            )}
            {couponError && (
              <p className="text-xs text-destructive mt-1">{couponError}</p>
            )}
          </div>

          {/* ملخص السعر للبريدي موب */}
          {baridimobWilaya && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>المنتجات</span>
                <span>{totalPrice.toLocaleString()} دج</span>
              </div>
              {baridimobProductDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>خصم المنتجات</span>
                  <span>- {baridimobProductDiscount.toLocaleString()} دج</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>التوصيل ({baridimobWilayaData?.name})</span>
                <span>{baridimobShippingCost.toLocaleString()} دج</span>
              </div>
              {baridimobShippingDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>خصم التوصيل</span>
                  <span>- {baridimobShippingDiscount.toLocaleString()} دج</span>
                </div>
              )}
              <div className="border-t border-border pt-2">
                <div className="flex justify-between font-bold">
                  <span>المجموع الكلي</span>
                  <span className="gradient-text">{baridimobTotalWithShipping.toLocaleString()} دج</span>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full btn-velvet" disabled={isSubmitting || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري رفع الصورة...
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري التأكيد...
              </>
            ) : (
              'تأكيد الطلب'
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default CheckoutForm;
