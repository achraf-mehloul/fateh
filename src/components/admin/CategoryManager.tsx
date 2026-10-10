import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, FolderOpen, Upload, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  products_count?: number;
}

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    slug: '',
    description: '',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (error) {
      toast.error('فشل تحميل التصنيفات');
      console.error(error);
    } else {
      // Get products count for each category
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (cat) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id);
          return { ...cat, products_count: count || 0 };
        })
      );
      setCategories(categoriesWithCount);
    }
    setLoading(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0621-\u064A]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.name_ar) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    const categoryData = {
      name: formData.name,
      name_ar: formData.name_ar,
      slug: formData.slug || generateSlug(formData.name),
      description: formData.description || null,
      is_active: formData.is_active,
      sort_order: formData.sort_order,
    };

    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', editingCategory.id);

      if (error) {
        toast.error('فشل تحديث التصنيف');
        console.error(error);
      } else {
        toast.success('تم تحديث التصنيف بنجاح');
        setIsDialogOpen(false);
        fetchCategories();
      }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([categoryData]);

      if (error) {
        toast.error('فشل إضافة التصنيف');
        console.error(error);
      } else {
        toast.success('تم إضافة التصنيف بنجاح');
        setIsDialogOpen(false);
        fetchCategories();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmCategory) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', deleteConfirmCategory.id);

    if (error) {
      toast.error('فشل حذف التصنيف');
      console.error(error);
    } else {
      toast.success('تم حذف التصنيف بنجاح');
      setDeleteConfirmCategory(null);
      fetchCategories();
    }
  };

  const toggleActive = async (category: Category) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id);

    if (error) {
      toast.error('فشل تحديث الحالة');
    } else {
      fetchCategories();
    }
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      name_ar: '',
      slug: '',
      description: '',
      is_active: true,
      sort_order: categories.length,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_ar: category.name_ar,
      slug: category.slug,
      description: category.description || '',
      is_active: category.is_active,
      sort_order: category.sort_order,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">إدارة التصنيفات</h2>
          <p className="text-sm text-muted-foreground">إضافة وتعديل وحذف تصنيفات المنتجات</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة تصنيف
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي التصنيفات</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <FolderOpen className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{categories.filter(c => c.is_active).length}</p>
              <p className="text-sm text-muted-foreground">نشط</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <FolderOpen className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{categories.filter(c => !c.is_active).length}</p>
              <p className="text-sm text-muted-foreground">غير نشط</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground mt-4">جاري التحميل...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد تصنيفات</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right p-4 font-medium">الترتيب</th>
                <th className="text-right p-4 font-medium">الاسم (عربي)</th>
                <th className="text-right p-4 font-medium">الاسم (إنجليزي)</th>
                <th className="text-right p-4 font-medium">المنتجات</th>
                <th className="text-right p-4 font-medium">الحالة</th>
                <th className="text-right p-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <span>{category.sort_order}</span>
                    </div>
                  </td>
                  <td className="p-4 font-semibold">{category.name_ar}</td>
                  <td className="p-4 text-muted-foreground">{category.name}</td>
                  <td className="p-4">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                      {category.products_count} منتج
                    </span>
                  </td>
                  <td className="p-4">
                    <Switch
                      checked={category.is_active}
                      onCheckedChange={() => toggleActive(category)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmCategory(category)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'تعديل تصنيف' : 'إضافة تصنيف جديد'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>الاسم (إنجليزي) *</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  }));
                }}
                required
              />
            </div>
            <div>
              <Label>الاسم (عربي) *</Label>
              <Input
                value={formData.name_ar}
                onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>الرابط المختصر (Slug)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="يتم إنشاؤه تلقائياً"
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>تصنيف نشط</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {editingCategory ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmCategory} onOpenChange={() => setDeleteConfirmCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف التصنيف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف "{deleteConfirmCategory?.name_ar}"؟ سيتم إلغاء ربط المنتجات بهذا التصنيف.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmCategory(null)}>
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

export default CategoryManager;
