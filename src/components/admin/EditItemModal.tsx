import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Loader2, Upload, ChevronRight, DollarSign, Clock, X, CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMenu } from '@/contexts/MenuContext';
import { useSaveMenuItemMutation, useGetCategoriesQuery } from '@/store/menuApi';
import api from '@/services/api';
import { toast } from 'sonner';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any | null;
  onSave: () => void;
}

const TOGGLES = [
  { id: 'isVeg', label: 'Vegetarian' },
  { id: 'isDinner', label: 'Dinner Item' },
  { id: 'isPopular', label: 'Popular' },
  { id: 'isNewItem', label: 'New Item' },
  { id: 'isChefsChoice', label: "Chef's Choice" },
  { id: 'soldOut', label: 'Sold Out' },
];

export const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, item, onSave }) => {
  const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [images, setImages] = useState<File[]>([]);
  const [isPrimary, setIsPrimary] = useState(true);
  const [saveMenuItem, { isLoading: isSaving }] = useSaveMenuItemMutation();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        itemId: item.itemId,
        categoryId: item.categoryId?.toString() ?? '',
        foodName: item.foodName ?? '',
        description: item.description ?? '',
        price: item.price ?? '',
        approxTime: item.approxTime ?? '',
        weight: item.weight ?? '',
        isVeg: item.isVeg ?? false,
        isDinner: item.isDinner ?? false,
        soldOut: item.soldOut ?? false,
        isPopular: item.isPopular ?? false,
        isNewItem: item.isNewItem ?? false,
        isChefsChoice: item.isChefsChoice ?? false,
        existingImage: item.images?.find((i: any) => i.isPrimary)?.imageUrl ?? item.images?.[0]?.imageUrl ?? null,
      });
      setStep(1);
      setImages([]);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDetails = async () => {
    if (!formData.foodName?.trim() || !formData.description?.trim() || !formData.price || !formData.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      itemId: formData.itemId,
      categoryId: parseInt(formData.categoryId),
      foodName: formData.foodName.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      approxTime: formData.approxTime ?? '',
      weight: formData.weight ?? '',
      isVeg: formData.isVeg,
      isDinner: formData.isDinner,
      soldOut: formData.soldOut,
      isPopular: formData.isPopular,
      isNewItem: formData.isNewItem,
      isChefsChoice: formData.isChefsChoice,
    };

    try {
      await saveMenuItem(payload).unwrap();
      toast.success('Item updated! You can now update the image.');
      setStep(2);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to update item');
    }
  };

  const handleImageUpload = async () => {
    if (images.length === 0) {
      handleDone();
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('MenuItemId', String(formData.itemId));
      fd.append('IsPrimary', String(isPrimary));
      images.forEach(img => fd.append('Images', img));

      await api.upload('/MenuImage/upload', fd);
      toast.success('Image updated successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
      handleDone();
    }
  };

  const handleDone = () => {
    onSave();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative bg-white sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl sm:max-h-[90vh] h-full sm:h-auto flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Item</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${step === 1 ? 'text-accent' : 'text-gray-300 line-through'}`}>
                      Details
                    </span>
                    <ChevronRight className="h-3 w-3 text-gray-300" />
                    <span className={`text-[10px] font-black uppercase tracking-wider ${step === 2 ? 'text-accent' : 'text-gray-300'}`}>
                      Media
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-10 w-10 p-0 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {step === 1 ? (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-foodName" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Item Name *</Label>
                      <Input
                        id="edit-foodName"
                        value={formData.foodName}
                        onChange={(e) => handleChange('foodName', e.target.value)}
                        className="h-12 border-gray-100 focus:border-accent rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-price" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 z-10 pointer-events-none" />
                        <Input
                          id="edit-price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => handleChange('price', e.target.value)}
                          className="h-12 pl-10 border-gray-100 focus:border-accent rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description *</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="min-h-[100px] border-gray-100 focus:border-accent rounded-xl resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category *</Label>
                      <Select value={formData.categoryId} onValueChange={(v) => handleChange('categoryId', v)}>
                        <SelectTrigger className="h-12 border-gray-100 rounded-xl">
                          <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select category"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 z-[110]">
                          {isLoadingCategories ? (
                            <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                          ) : categories.length === 0 ? (
                            <SelectItem value="none" disabled>No categories found</SelectItem>
                          ) : (
                            categories.filter(cat => cat?.categoryId != null).map(cat => (
                              <SelectItem key={cat.categoryId} value={cat.categoryId?.toString()}>
                                {cat.categoryName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-approxTime" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cook Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 z-10 pointer-events-none" />
                        <Input
                          id="edit-approxTime"
                          value={formData.approxTime}
                          onChange={(e) => handleChange('approxTime', e.target.value)}
                          className="h-12 pl-10 border-gray-100 rounded-xl"
                          placeholder="15 min"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-weight" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Portion</Label>
                      <Input
                        id="edit-weight"
                        value={formData.weight}
                        onChange={(e) => handleChange('weight', e.target.value)}
                        className="h-12 border-gray-100 rounded-xl"
                        placeholder="250g"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                    {TOGGLES.map(({ id, label }) => (
                      <div key={id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/50">
                        <Label htmlFor={`edit-${id}`} className="text-xs font-bold text-gray-600">{label}</Label>
                        <Switch
                          id={`edit-${id}`}
                          checked={formData[id] ?? false}
                          onCheckedChange={(v) => handleChange(id, v)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 sm:p-8 space-y-8">
                  {formData.existingImage && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Image</Label>
                      <div className="relative group w-40 h-40 rounded-2xl overflow-hidden shadow-md border-4 border-white">
                        <img
                          src={formData.existingImage}
                          alt={formData.foodName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Replace Image(s)</Label>
                    <div className="border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer group"
                         onClick={() => document.getElementById('edit-image-upload')?.click()}>
                      <Upload className="h-10 w-10 mx-auto text-gray-300 mb-4 group-hover:text-accent group-hover:scale-110 transition-all" />
                      <p className="text-sm font-bold text-gray-900 mb-1">Click to upload new photos</p>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP (Max 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        id="edit-image-upload"
                        onChange={(e) => setImages(Array.from(e.target.files || []))}
                      />
                    </div>
                    {images.length > 0 && (
                      <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-xs">
                          {images.length}
                        </div>
                        <p className="text-xs font-bold text-accent truncate flex-1">
                          {images.map(f => f.name).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100">
                    <Switch id="edit-isPrimary" checked={isPrimary} onCheckedChange={setIsPrimary} />
                    <Label htmlFor="edit-isPrimary" className="text-sm font-bold text-gray-700">Set as primary image</Label>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-gray-500 font-bold hover:bg-gray-200"
              >
                Cancel
              </Button>
              <div className="flex gap-3">
                {step === 1 ? (
                  <Button
                    onClick={handleSaveDetails}
                    disabled={isSaving}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 h-12 rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-95"
                  >
                    {isSaving ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />Save & Continue</>
                    )}
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={handleDone} className="font-bold">Skip</Button>
                    <Button
                      onClick={handleImageUpload}
                      disabled={isUploading || images.length === 0}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 h-12 rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-95"
                    >
                      {isUploading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                      ) : (
                        'Upload & Finish'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
