import React, { useState, useRef, useEffect } from 'react';
import {
  useListProducts, getListProductsQueryKey,
  useCreateProduct, useUpdateProduct, useDeleteProduct, Product
} from '@workspace/api-client-react';
import { formatKes } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Edit2, Package, Search, Upload, X, Loader2, Calculator, Receipt } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// ── VAT helpers ───────────────────────────────────────────────────────────────
const VAT_RATES: Record<string, number> = { standard: 0.16, zero: 0, exempt: 0 };
const VAT_LABELS: Record<string, string> = {
  standard: 'Standard (16%)',
  zero: 'Zero-rated (0%)',
  exempt: 'Exempt',
};
const UOM_OPTIONS = ['carton', 'piece', 'litre', 'kg', 'unit', 'bottle', 'pack'];

function vatBreakdown(priceKes: number, vatClass: string) {
  const rate = VAT_RATES[vatClass] ?? 0.16;
  const vat = Math.round(priceKes * rate / (1 + rate));
  return { net: priceKes - vat, vat };
}

// ── Image Upload Component ────────────────────────────────────────────────────
function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const { toast } = useToast();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Image files only', variant: 'destructive' });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: 'File too large (max 8 MB)', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/uploads/image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Upload failed');
      const { imageUrl } = await res.json() as { imageUrl: string };
      onChange(imageUrl);
      toast({ title: 'Image uploaded' });
    } catch (err) {
      toast({ title: String(err instanceof Error ? err.message : err), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Product preview"
            className="h-28 w-auto max-w-full rounded-lg border object-contain bg-slate-50"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200
          ${dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Upload className="h-6 w-6" />
            <p className="text-sm"><span className="text-primary font-medium">Click to upload</span> or drag &amp; drop</p>
            <p className="text-xs">PNG, JPG, WebP — max 8 MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onEdit }: { product: Product; onEdit: (p: Product) => void }) {
  const { net, vat } = vatBreakdown(product.priceKes, product.vatClass ?? 'standard');
  const vatLabel = VAT_LABELS[product.vatClass ?? 'standard'] ?? 'Standard (16%)';

  return (
    <Card className="overflow-hidden flex flex-col group border-slate-200 hover:shadow-md transition-shadow">
      <div className="relative h-44 bg-slate-50 flex items-center justify-center p-4">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full object-contain mix-blend-multiply" />
        ) : (
          <Package className="h-16 w-16 text-slate-200" />
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {!product.isActive && <Badge variant="destructive" className="text-xs shadow-sm">Inactive</Badge>}
          {product.vatClass && product.vatClass !== 'standard' && (
            <Badge variant="outline" className="text-xs bg-white shadow-sm">{vatLabel}</Badge>
          )}
        </div>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="secondary" className="h-8 w-8 bg-white shadow-sm" onClick={() => onEdit(product)}>
            <Edit2 className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="font-bold text-slate-900 text-sm leading-tight">{product.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{product.uom ? `UOM: ${product.uom}` : ''}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="font-bold text-primary">{formatKes(product.priceKes)}</span>
            <p className="text-xs text-slate-400">incl. VAT</p>
          </div>
        </div>
        <div className="flex gap-2 text-xs text-slate-500 mb-3 flex-wrap">
          <span className="bg-slate-100 px-2 py-0.5 rounded">SKU: {product.sku}</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded">{product.packSize}</span>
        </div>
        <div className="text-xs text-slate-400 mb-3 flex gap-3">
          <span>Net: <strong className="text-slate-600">{formatKes(net)}</strong></span>
          <span>VAT: <strong className="text-orange-500">{formatKes(vat)}</strong></span>
        </div>
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${product.stockQuantity > 20 ? 'bg-green-500' : product.stockQuantity > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-slate-700">{product.stockQuantity} in stock</span>
          </div>
          <Badge variant="outline" className="text-xs">{product.category}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Product Dialog ─────────────────────────────────────────────────────────────
type FormData = {
  name: string; sku: string; description: string; packSize: string;
  priceKes: number; stockQuantity: number; imageUrl: string;
  category: string; isActive: boolean;
  vatClass: string; kraItemCode: string; uom: string;
};

const DEFAULT_FORM: FormData = {
  name: '', sku: '', description: '', packSize: '', priceKes: 0,
  stockQuantity: 0, imageUrl: '', category: 'Bottled Water',
  isActive: true, vatClass: 'standard', kraItemCode: '', uom: 'carton',
};

function ProductDialog({ open, onOpenChange, product }: { open: boolean; onOpenChange: (v: boolean) => void; product: Product | null }) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

  useEffect(() => {
    if (!open) return;
    setFormData(product ? {
      name: product.name, sku: product.sku,
      description: product.description ?? '',
      packSize: product.packSize, priceKes: product.priceKes,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl ?? '',
      category: product.category, isActive: product.isActive,
      vatClass: product.vatClass ?? 'standard',
      kraItemCode: product.kraItemCode ?? '',
      uom: product.uom ?? 'carton',
    } : DEFAULT_FORM);
  }, [open, product]);

  const set = (key: keyof FormData) => (val: string | number | boolean) =>
    setFormData(p => ({ ...p, [key]: val }));

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(p => ({ ...p, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSave = () => {
    const payload = {
      ...formData,
      kraItemCode: formData.kraItemCode || null,
      description: formData.description || null,
      imageUrl: formData.imageUrl || null,
    };
    if (product) {
      updateProduct.mutate({ id: product.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: 'Product updated' });
          onOpenChange(false);
        },
        onError: (err) => toast({ title: String(err), variant: 'destructive' }),
      });
    } else {
      createProduct.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: 'Product created' });
          onOpenChange(false);
        },
        onError: (err) => toast({ title: String(err), variant: 'destructive' }),
      });
    }
  };

  const handleDelete = () => {
    if (!product || !confirm('Delete this product? This cannot be undone.')) return;
    deleteProduct.mutate({ id: product.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: 'Product deleted' });
        onOpenChange(false);
      },
    });
  };

  const isPending = createProduct.isPending || updateProduct.isPending;
  const { net, vat } = vatBreakdown(formData.priceKes, formData.vatClass);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {product ? 'Edit Product' : 'Add Product'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="pricing">Pricing &amp; VAT</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>

          {/* ── Details Tab ── */}
          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input name="name" value={formData.name} onChange={handleInput} placeholder="Ari Water 500ml" />
              </div>
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input name="sku" value={formData.sku} onChange={handleInput} placeholder="AW-500ML-24" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pack Size *</Label>
                <Input name="packSize" value={formData.packSize} onChange={handleInput} placeholder="24 × 500 ml" />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={set('category')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bottled Water">Bottled Water</SelectItem>
                    <SelectItem value="Refill">Refill</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Stock Quantity *</Label>
              <Input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleInput} min={0} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea name="description" value={formData.description} onChange={handleInput} rows={3} placeholder="Short product description for customers…" />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50">
              <div>
                <Label className="text-sm font-medium">Active on store</Label>
                <p className="text-xs text-slate-500">Inactive products are hidden from customers</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={set('isActive')} />
            </div>
          </TabsContent>

          {/* ── Pricing & VAT Tab ── */}
          <TabsContent value="pricing" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Price (KES) — VAT inclusive *</Label>
              <Input type="number" name="priceKes" value={formData.priceKes} onChange={handleInput} min={0} step={0.01} />
              <p className="text-xs text-slate-500">Enter the customer-facing price including VAT</p>
            </div>

            {/* VAT Breakdown preview */}
            {formData.priceKes > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-800">VAT Breakdown</p>
                </div>
                <div className="flex justify-between text-xs text-blue-700">
                  <span>Net amount (excl. VAT)</span>
                  <span className="font-semibold">{formatKes(net)}</span>
                </div>
                <div className="flex justify-between text-xs text-orange-700">
                  <span>VAT @ {(VAT_RATES[formData.vatClass] ?? 0) * 100}%</span>
                  <span className="font-semibold">{formatKes(vat)}</span>
                </div>
                <div className="flex justify-between text-xs text-blue-900 font-bold border-t border-blue-200 pt-1">
                  <span>Total (incl. VAT)</span>
                  <span>{formatKes(formData.priceKes)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-slate-400" /> VAT Classification (KRA) *
              </Label>
              <Select value={formData.vatClass} onValueChange={set('vatClass')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Rate (16%) — Packaged water</SelectItem>
                  <SelectItem value="zero">Zero-rated (0%) — Exports &amp; basic food</SelectItem>
                  <SelectItem value="exempt">Exempt — Financial/educational services</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Bottled drinking water is <strong>standard-rated at 16%</strong> per the KRA VAT Act. Zero-rating applies to exports and certain food items.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Unit of Measure (UOM) *</Label>
              <Select value={formData.uom} onValueChange={set('uom')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UOM_OPTIONS.map(u => (
                    <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Required for KRA VAT returns and tax invoices</p>
            </div>

            <div className="space-y-2">
              <Label>KRA Item Code / HS Code (optional)</Label>
              <Input
                name="kraItemCode"
                value={formData.kraItemCode}
                onChange={handleInput}
                placeholder="e.g. 22011010"
              />
              <p className="text-xs text-slate-500">
                Harmonised System (HS) code for customs/KRA classification. Bottled water: 2201.10.10
              </p>
            </div>
          </TabsContent>

          {/* ── Image Tab ── */}
          <TabsContent value="image" className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Product Image</Label>
              <ImageUpload value={formData.imageUrl} onChange={set('imageUrl')} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-500 text-xs">Or enter a URL directly</Label>
              <Input name="imageUrl" value={formData.imageUrl} onChange={handleInput} placeholder="https://... or /public-path.png" />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center sm:justify-between w-full pt-2">
          {product ? (
            <Button variant="destructive" onClick={handleDelete} disabled={isPending} size="sm">
              Delete
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…</> : 'Save Product'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const { data: products, isLoading } = useListProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = (products ?? []).filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Products</h1>
          <p className="text-slate-500">Manage your catalogue, pricing and KRA tax classification.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search…" className="pl-9 w-[220px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Button onClick={() => { setEditingProduct(null); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading
          ? Array(4).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-44 bg-slate-100 rounded-t-xl" />
                <CardContent className="p-5 space-y-3">
                  <div className="h-5 bg-slate-100 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                </CardContent>
              </Card>
            ))
          : filteredProducts.length === 0
            ? (
              <div className="col-span-full py-16 text-center bg-slate-50 border border-dashed rounded-xl">
                <Package className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No products found</h3>
                <p className="text-slate-500">Try adjusting your search or add a new product.</p>
              </div>
            )
            : filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onEdit={(p) => { setEditingProduct(p); setIsDialogOpen(true); }} />
            ))
        }
      </div>

      <ProductDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} product={editingProduct} />
    </div>
  );
}
