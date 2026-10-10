import React, { useState, useEffect } from 'react';
import { Flame, Plus, Trash2, Settings, Clock, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  name_ar: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  is_deal: boolean;
  deal_ends_at: string | null;
}

interface DealsSettings {
  id: string;
  is_active: boolean;
  ends_at: string | null;
  title: string;
  description: string | null;
}

const DealsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<DealsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [dealEndsAt, setDealEndsAt] = useState('');

  const [settingsForm, setSettingsForm] = useState({
    is_active: true,
    ends_at: '',
    title: 'عروض اليوم',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch deals settings
    const { data: settingsData } = await supabase
      .from('deals_settings')
      .select('*')
      .single();
    
    if (settingsData) {
      setSettings(settingsData);
      setSettingsForm({
        is_active: settingsData.is_active,
        ends_at: settingsData.ends_at ? new Date(settingsData.ends_at).toISOString().slice(0, 16) : '',
        title: settingsData.title || 'عروض اليوم',
        description: settingsData.description || '',
      });
    }

    // Fetch all products
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, name_ar, price, original_price, image_url, is_deal, deal_ends_at')
      .eq('is_active', true)
      .order('name');

    if (productsData) {
      setProducts(productsData.filter(p => !p.is_deal));
      setDealProducts(productsData.filter(p => p.is_deal));
    }

    setLoading(false);
  };

  const handleAddToDeal = async () => {
    if (!selectedProductId) {
      toast.error('يرجى اختيار منتج');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const updateData: any = {
      is_deal: true,
      deal_ends_at: dealEndsAt ? new Date(dealEndsAt).toISOString() : null,
    };

    if (dealPrice && parseFloat(dealPrice) > 0) {
      updateData.original_price = product.price;
      updateData.price = parseFloat(dealPrice);
    }

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', selectedProductId);

    if (error) {
      toast.error('فشل إضافة المنتج للعروض');
      console.error(error);
    } else {
      toast.success('تم إضافة المنتج للعروض');
      setIsAddDialogOpen(false);
      setSelectedProductId('');
      setDealPrice('');
      setDealEndsAt('');
      fetchData();
    }
  };

  const handleRemoveFromDeal = async (product: Product) => {
    const updateData: any = {
      is_deal: false,
      deal_ends_at: null,
    };

    // Restore original price if exists
    if (product.original_price) {
      updateData.price = product.original_price;
      updateData.original_price = null;
    }

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', product.id);

    if (error) {
      toast.error('فشل إزالة المنتج من العروض');
      console.error(error);
    } else {
      toast.success('تم إزالة المنتج من العروض');
      fetchData();
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    const { error } = await supabase
      .from('deals_settings')
      .update({
        is_active: settingsForm.is_active,
        ends_at: settingsForm.ends_at ? new Date(settingsForm.ends_at).toISOString() : null,
        title: settingsForm.title,
        description: settingsForm.description || null,
      })
      .eq('id', settings.id);

    if (error) {
      toast.error('فشل حفظ الإعدادات');
      console.error(error);
    } else {
      toast.success('تم حفظ الإعدادات');
      setIsSettingsDialogOpen(false);
      fetchData();
    }
  };

  const toggleDealsActive = async () => {
    if (!settings) return;

    const { error } = await supabase
      .from('deals_settings')
      .update({ is_active: !settings.is_active })
      .eq('id', settings.id);

    if (error) {
      toast.error('فشل تحديث الحالة');
    } else {
      toast.success(settings.is_active ? 'تم إيقاف العروض' : 'تم تفعيل العروض');
      fetchData();
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ar-DZ') + ' دج';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDiscountPercentage = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            إدارة العروض
          </h2>
          <p className="text-sm text-muted-foreground">إضافة وإزالة المنتجات من قسم العروض</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={settings?.is_active ? "destructive" : "default"}
            onClick={toggleDealsActive}
            className="gap-2"
          >
            {settings?.is_active ? (
              <>
                <PowerOff className="h-4 w-4" />
                إيقاف العروض
              </>
            ) : (
              <>
                <Power className="h-4 w-4" />
                تفعيل العروض
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            الإعدادات
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة منتج
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl border ${settings?.is_active ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings?.is_active ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Flame className={`h-5 w-5 ${settings?.is_active ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <div>
              <p className={`font-semibold ${settings?.is_active ? 'text-green-500' : 'text-red-500'}`}>
                {settings?.is_active ? 'العروض مفعلة' : 'العروض متوقفة'}
              </p>
              <p className="text-sm text-muted-foreground">
                {settings?.title} - {dealProducts.length} منتج في العروض
              </p>
            </div>
          </div>
          {settings?.ends_at && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">تنتهي: {formatDate(settings.ends_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dealProducts.length}</p>
              <p className="text-sm text-muted-foreground">منتجات في العروض</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Flame className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">
                {dealProducts.filter(p => p.original_price).length}
              </p>
              <p className="text-sm text-muted-foreground">منتجات مخفضة</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">
                {dealProducts.filter(p => p.deal_ends_at).length}
              </p>
              <p className="text-sm text-muted-foreground">عروض محدودة الوقت</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Flame className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-500">{products.length}</p>
              <p className="text-sm text-muted-foreground">منتجات متاحة للإضافة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Products */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground mt-4">جاري التحميل...</p>
        </div>
      ) : dealProducts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد منتجات في العروض</p>
          <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
            إضافة منتج للعروض
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dealProducts.map(product => (
            <div key={product.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Flame className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {product.original_price && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-sm px-2 py-1 rounded-full font-bold">
                    -{getDiscountPercentage(product.original_price, product.price)}%
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{product.name_ar || product.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold text-primary text-lg">{formatCurrency(product.price)}</span>
                  {product.original_price && (
                    <span className="text-sm text-muted-foreground line-through">{formatCurrency(product.original_price)}</span>
                  )}
                </div>
                {product.deal_ends_at && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ينتهي: {formatDate(product.deal_ends_at)}
                  </p>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full mt-3 gap-2"
                  onClick={() => handleRemoveFromDeal(product)}
                >
                  <Trash2 className="h-4 w-4" />
                  إزالة من العروض
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة منتج للعروض</DialogTitle>
            <DialogDescription>
              اختر منتج وحدد سعر العرض وتاريخ الانتهاء (اختياري)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المنتج *</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر منتج" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name_ar || product.name} - {formatCurrency(product.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>سعر العرض (اختياري)</Label>
              <Input
                type="number"
                value={dealPrice}
                onChange={(e) => setDealPrice(e.target.value)}
                placeholder="اتركه فارغاً للإبقاء على السعر الأصلي"
                min="0"
              />
            </div>
            <div>
              <Label>تاريخ انتهاء العرض (اختياري)</Label>
              <Input
                type="datetime-local"
                value={dealEndsAt}
                onChange={(e) => setDealEndsAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddToDeal}>
              إضافة للعروض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعدادات العروض</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={settingsForm.is_active}
                onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>تفعيل قسم العروض</Label>
            </div>
            <div>
              <Label>عنوان القسم</Label>
              <Input
                value={settingsForm.title}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>الوصف (اختياري)</Label>
              <Input
                value={settingsForm.description}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>تاريخ انتهاء جميع العروض (اختياري)</Label>
              <Input
                type="datetime-local"
                value={settingsForm.ends_at}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, ends_at: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveSettings}>
              حفظ الإعدادات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DealsManager;
