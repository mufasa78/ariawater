import React, { useState, useRef, useEffect } from 'react';
import { useListProducts, getListProductsQueryKey, useCreateProduct, useUpdateProduct, useDeleteProduct, Product } from '@workspace/api-client-react';
import { formatKes } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Package, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function AdminProducts() {
  const { data: products, isLoading } = useListProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreateNew = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Products</h1>
          <p className="text-slate-500">Manage your product catalogue and inventory.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 w-[250px]" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-slate-100 rounded-t-xl" />
              <CardContent className="p-5 space-y-3">
                <div className="h-6 bg-slate-100 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-50 border border-dashed rounded-xl">
            <Package className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No products found</h3>
            <p className="text-slate-500">Try adjusting your search or add a new product.</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden flex flex-col group border-slate-200">
              <div className="relative h-48 bg-slate-50 flex items-center justify-center p-4">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full object-contain mix-blend-multiply" />
                ) : (
                  <Package className="h-16 w-16 text-slate-300" />
                )}
                <div className="absolute top-3 left-3">
                  {!product.isActive && <Badge variant="destructive" className="shadow-sm">Inactive</Badge>}
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button size="icon" variant="secondary" className="h-8 w-8 bg-white shadow-sm" onClick={() => handleEdit(product)}>
                    <Edit2 className="h-4 w-4 text-slate-600" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900">{product.name}</h3>
                  <span className="font-bold text-primary">{formatKes(product.priceKes)}</span>
                </div>
                <div className="flex gap-2 text-xs text-slate-500 mb-4">
                  <span className="bg-slate-100 px-2 py-1 rounded">SKU: {product.sku}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded">{product.packSize}</span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${product.stockQuantity > 20 ? 'bg-green-500' : product.stockQuantity > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-slate-700">{product.stockQuantity} in stock</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ProductDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        product={editingProduct} 
      />
    </div>
  );
}

function ProductDialog({ open, onOpenChange, product }: { open: boolean, onOpenChange: (open: boolean) => void, product: Product | null }) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    packSize: '',
    priceKes: 0,
    stockQuantity: 0,
    imageUrl: '',
    category: 'bottles',
    isActive: true
  });

  useEffect(() => {
    if (open) {
      if (product) {
        setFormData({
          name: product.name,
          sku: product.sku,
          description: product.description || '',
          packSize: product.packSize,
          priceKes: product.priceKes,
          stockQuantity: product.stockQuantity,
          imageUrl: product.imageUrl || '',
          category: product.category,
          isActive: product.isActive
        });
      } else {
        setFormData({
          name: '',
          sku: '',
          description: '',
          packSize: '',
          priceKes: 0,
          stockQuantity: 0,
          imageUrl: '',
          category: 'bottles',
          isActive: true
        });
      }
    }
  }, [open, product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = () => {
    if (product) {
      updateProduct.mutate(
        { id: product.id, data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast({ title: 'Product updated' });
            onOpenChange(false);
          }
        }
      );
    } else {
      createProduct.mutate(
        { data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast({ title: 'Product created' });
            onOpenChange(false);
          }
        }
      );
    }
  };

  const handleDelete = () => {
    if (!product || !confirm('Are you sure you want to delete this product?')) return;
    
    deleteProduct.mutate(
      { id: product.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: 'Product deleted' });
          onOpenChange(false);
        }
      }
    );
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Create Product'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input name="sku" value={formData.sku} onChange={handleChange} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pack Size (e.g. 500ml, 1L)</Label>
              <Input name="packSize" value={formData.packSize} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input name="category" value={formData.category} onChange={handleChange} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (KES)</Label>
              <Input type="number" name="priceKes" value={formData.priceKes} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Stock Quantity</Label>
              <Input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="/bottle-500ml.png" />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea name="description" value={formData.description} onChange={handleChange} rows={3} />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 mt-2">
            <div>
              <Label className="text-base">Active Status</Label>
              <p className="text-sm text-slate-500">Inactive products are hidden from the store</p>
            </div>
            <Switch 
              checked={formData.isActive} 
              onCheckedChange={(checked) => setFormData(p => ({ ...p, isActive: checked }))} 
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
          {product ? (
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPending}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
