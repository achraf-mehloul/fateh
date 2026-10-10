import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Tag, Percent, DollarSign, Truck, Package, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  target: 'products' | 'shipping';
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const CouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Coupon | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    target: 'products' as 'products' | 'shipping',
    value: '',
    min_order_amount: '',
    max_uses: '',
    expires_at: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('فشل تحميل الكوبونات');
      console.error(error);
    } else {
      // Type assertion to handle the string types from database
      setCoupons((data || []).map(c => ({
        ...c,
        type: c.type as 'percentage' | 'fixed',
        target: c.target as 'products' | 'shipping',
      })));
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      target: 'products',
      value: '',
      min_order_amount: '',
      max_uses: '',
      expires_at: '',
      is_active: true,
    });
    setEditingCoupon(null);
  };

  const openEditForm = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      target: coupon.target,
      value: coupon.value.toString(),
      min_order_amount: coupon.min_order_amount?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      is_active: coupon.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.value) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    const couponData = {
      code: formData.code.toUpperCase(),
      type: formData.type,
      target: formData.target,
      value: parseFloat(formData.value),
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      is_active: formData.is_active,
    };

    let error;
    if (editingCoupon) {
      const { error: updateError } = await supabase
        .from('coupons')
        .update(couponData)
        .eq('id', editingCoupon.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('coupons')
        .insert([couponData]);
      error = insertError;
    }

    if (error) {
      if (error.code === '23505') {
        toast.error('كود الخصم موجود مسبقاً');
      } else {
        toast.error('فشل حفظ الكوبون');
        console.error(error);
      }
    } else {
      toast.success(editingCoupon ? 'تم تحديث الكوبون' : 'تم إنشاء الكوبون');
      setShowForm(false);
      resetForm();
      fetchCoupons();
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id);

    if (error) {
      toast.error('فشل تحديث حالة الكوبون');
    } else {
      toast.success(coupon.is_active ? 'تم إيقاف الكوبون' : 'تم تفعيل الكوبون');
      fetchCoupons();
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', deleteConfirm.id);

    if (error) {
      toast.error('فشل حذف الكوبون');
    } else {
      toast.success('تم حذف الكوبون');
      setDeleteConfirm(null);
      fetchCoupons();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            إدارة الكوبونات
          </h2>
          <p className="text-sm text-muted-foreground mt-1">إنشاء وإدارة أكواد الخصم</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="btn-velvet">
          <Plus className="h-4 w-4 ml-2" />
          كوبون جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-2xl font-bold text-primary">{coupons.length}</p>
          <p className="text-xs text-muted-foreground">إجمالي الكوبونات</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-2xl font-bold text-green-500">{coupons.filter(c => c.is_active).length}</p>
          <p className="text-xs text-muted-foreground">الكوبونات المفعلة</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-2xl font-bold text-yellow-500">{coupons.reduce((acc, c) => acc + c.used_count, 0)}</p>
          <p className="text-xs text-muted-foreground">مرات الاستخدام</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-2xl font-bold text-red-500">{coupons.filter(c => isExpired(c.expires_at)).length}</p>
          <p className="text-xs text-muted-foreground">منتهية الصلاحية</p>
        </div>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground mt-4">جاري التحميل...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد كوبونات حتى الآن</p>
          <Button onClick={() => setShowForm(true)} className="mt-4">
            إنشاء أول كوبون
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`bg-card rounded-xl border p-4 sm:p-6 transition-all ${
                !coupon.is_active || isExpired(coupon.expires_at)
                  ? 'border-border opacity-60'
                  : 'border-primary/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Coupon Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-lg font-bold bg-primary/10 text-primary px-3 py-1 rounded-lg">
                      {coupon.code}
                    </span>
                    {coupon.is_active && !isExpired(coupon.expires_at) ? (
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        مفعل
                      </span>
                    ) : isExpired(coupon.expires_at) ? (
                      <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full flex items-center gap-1">
                        <X className="h-3 w-3" />
                        منتهي
                      </span>
                    ) : (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1">
                        <X className="h-3 w-3" />
                        موقف
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {coupon.type === 'percentage' ? (
                        <Percent className="h-4 w-4" />
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value} دج`}
                    </span>
                    <span className="flex items-center gap-1">
                      {coupon.target === 'products' ? (
                        <Package className="h-4 w-4" />
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}
                      {coupon.target === 'products' ? 'على المنتجات' : 'على التوصيل'}
                    </span>
                    {coupon.min_order_amount && (
                      <span className="flex items-center gap-1">
                        الحد الأدنى: {coupon.min_order_amount} دج
                      </span>
                    )}
                    {coupon.max_uses && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {coupon.used_count}/{coupon.max_uses}
                      </span>
                    )}
                    {coupon.expires_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(coupon.expires_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={coupon.is_active}
                    onCheckedChange={() => handleToggleActive(coupon)}
                  />
                  <Button variant="outline" size="icon" onClick={() => openEditForm(coupon)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setDeleteConfirm(coupon)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'تعديل الكوبون' : 'كوبون جديد'}</DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'قم بتعديل تفاصيل الكوبون' : 'أدخل تفاصيل كود الخصم الجديد'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">كود الخصم *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="مثال: WELCOME10"
                className="mt-1 font-mono"
                dir="ltr"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">نوع الخصم</Label>
                <Select value={formData.type} onValueChange={(v: 'percentage' | 'fixed') => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="target">يُطبق على</Label>
                <Select value={formData.target} onValueChange={(v: 'products' | 'shipping') => setFormData({ ...formData, target: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="products">المنتجات</SelectItem>
                    <SelectItem value="shipping">التوصيل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="value">القيمة * {formData.type === 'percentage' ? '(%)' : '(دج)'}</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.type === 'percentage' ? '10' : '500'}
                className="mt-1"
                min="0"
                max={formData.type === 'percentage' ? '100' : undefined}
                required
              />
            </div>

            <div>
              <Label htmlFor="min_order_amount">الحد الأدنى للطلب (دج)</Label>
              <Input
                id="min_order_amount"
                type="number"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                placeholder="اختياري"
                className="mt-1"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="max_uses">الحد الأقصى للاستخدام</Label>
              <Input
                id="max_uses"
                type="number"
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                placeholder="غير محدود"
                className="mt-1"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="expires_at">تاريخ انتهاء الصلاحية</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">تفعيل الكوبون</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                إلغاء
              </Button>
              <Button type="submit" className="btn-velvet">
                {editingCoupon ? 'حفظ التغييرات' : 'إنشاء الكوبون'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف الكوبون "{deleteConfirm?.code}"؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponManager;
