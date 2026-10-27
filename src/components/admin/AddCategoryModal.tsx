import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, LayoutGrid, ChevronRight, Loader2, Type, Hash, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMenu } from '@/contexts/MenuContext';
import { useAddCategoryMutation } from '@/store/menuApi';
import { toast } from 'sonner';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: any) => void;
}

const INITIAL_FORM = {
  name: '',
  description: '',
  icon: '🍽️',
  color: '#D4A574', // Default accent color
  sortOrder: '0',
};

const ICON_OPTIONS = ['🍽️', '🍕', '🍔', '🥤', '🍰', '🥗', '🍲', '🥘', '🍳', '☕', '🍷', '🍦'];
const COLOR_OPTIONS = [
  { name: 'Accent', value: '#D4A574' },
  { name: 'Primary', value: '#E6DECA' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Pink', value: '#ec4899' },
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onSave }) => {
  const { categories } = useMenu();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [addCategory, { isLoading: isSubmitting }] = useAddCategoryMutation();

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const payload = {
        categoryName: formData.name.trim(),
        // sortOrder and other fields if API supports them
      };

      const result = await addCategory(payload).unwrap();
      onSave(result);
      toast.success('Category added successfully!');
      handleClose();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add category');
      console.error(error);
    }
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative bg-white sm:rounded-2xl shadow-2xl w-full sm:max-w-xl sm:max-h-[90vh] h-full sm:h-auto flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">New Category</h2>
                  <p className="text-xs text-gray-500">Create a new menu group</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose} className="rounded-full h-10 w-10 p-0 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </Button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                {/* Basic Info Section */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      <Type className="w-3 h-3" />
                      Category Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g., Signature Pizzas"
                      className="h-12 text-lg font-medium border-gray-200 focus:border-accent focus:ring-accent/20 rounded-xl"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-black uppercase tracking-wider text-gray-500">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="What kind of items are in this category?"
                      className="min-h-[100px] border-gray-200 focus:border-accent focus:ring-accent/20 rounded-xl resize-none"
                    />
                  </div>
                </div>

                {/* Appearance Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-4">
                    <Label className="text-sm font-black uppercase tracking-wider text-gray-500">
                      Icon
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {ICON_OPTIONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => handleChange('icon', icon)}
                          className={`h-12 flex items-center justify-center rounded-xl border-2 transition-all ${
                            formData.icon === icon
                              ? 'border-accent bg-accent/5 scale-110 shadow-md'
                              : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-xl">{icon}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      <Palette className="w-3 h-3" />
                      Theme Color
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => handleChange('color', color.value)}
                          className={`h-12 flex items-center justify-center rounded-xl border-2 transition-all p-1 ${
                            formData.color === color.value
                              ? 'border-accent shadow-md scale-110'
                              : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                          }`}
                          title={color.name}
                        >
                          <div
                            className="w-full h-full rounded-lg"
                            style={{ backgroundColor: color.value }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Settings Section */}
                <div className="pt-4">
                  <div className="max-w-[200px] space-y-2">
                    <Label htmlFor="sortOrder" className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      <Hash className="w-3 h-3" />
                      Display Order
                    </Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => handleChange('sortOrder', e.target.value)}
                      className="h-10 border-gray-200 focus:border-accent rounded-xl"
                      min="0"
                    />
                  </div>
                </div>

                {/* Preview Card */}
                <div className="pt-6">
                  <Label className="text-sm font-black uppercase tracking-wider text-gray-500 mb-4 block">
                    Live Preview
                  </Label>
                  <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                      style={{ backgroundColor: formData.color + '20' }} // 20% opacity
                    >
                      {formData.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900" style={{ color: formData.color }}>
                        {formData.name || 'Category Name'}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {formData.description || 'Category description will appear here...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  className="text-gray-500 font-bold hover:bg-gray-200"
                >
                  Discard
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 h-12 rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Add Category
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
