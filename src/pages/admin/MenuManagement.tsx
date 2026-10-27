import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  Star,
  Clock,
  Database
} from 'lucide-react';
import { MenuManagementSkeleton } from '@/components/SkeletonLoaders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetCategoriesQuery, useGetMenuItemsQuery, MenuItem as ApiMenuItem, useSaveMenuItemMutation, useDeleteMenuItemMutation } from '@/store/menuApi';
import { MenuItem } from '@/contexts/MenuContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditItemModal } from '@/components/admin/EditItemModal';
import { AddItemModal } from '@/components/admin/AddItemModal';
import { AddCategoryModal } from '@/components/admin/AddCategoryModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export const MenuManagement: React.FC = () => {
  // Use RTK Query to fetch data
  const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showSoldOut, setShowSoldOut] = useState(false);

  // Reset to first page whenever filters change
  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory, showSoldOut]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<ApiMenuItem | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  // Fetch menu items - all items if no category selected, or filtered by category
  const { data: allMenuItems = [], isLoading: isLoadingItems, refetch: refetchItems } = useGetMenuItemsQuery(
    { categoryId: selectedCategory || undefined },
    { skip: false }
  );

  const [saveMenuItem] = useSaveMenuItemMutation();
  const [deleteMenuItem] = useDeleteMenuItemMutation();

  // Filter items based on search and category
  const filteredItems = allMenuItems.filter(item => {
    // Filter by category first (subcategory removed)
    if (selectedCategory !== null) {
      if (item.categoryId !== selectedCategory) return false;
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = item.foodName.toLowerCase().includes(query) ||
                           item.description.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Filter sold out items
    if (!showSoldOut && item.soldOut) return false;
    
    return true;
  });

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const paginatedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getCategoryName = (categoryId: number) => {
    return categories.find(cat => cat.categoryId === categoryId)?.categoryName || 'Unknown';
  };

  // getSubCategoryName - COMMENTED OUT (not used in project)
  // const getSubCategoryName = (subCategoryId: number) => {
  //   return subCategories.find(sub => sub.subCategoryId === subCategoryId)?.subCategoryName || 'Unknown';
  // };

  const handleToggleVisibility = async (item: ApiMenuItem) => {
    try {
      await saveMenuItem({
        ...item,
        soldOut: !item.soldOut,
      }).unwrap();
      toast.success(item.soldOut ? 'Marked as available' : 'Marked as sold out');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to update item');
    }
  };

  const handleEditItem = (itemId: number) => {
    const item = allMenuItems.find(i => i.itemId === itemId);
    if (item) {
      const convertedItem: any = {
        ...item,
        images: item.images || [],
        portionSize: item.weight || '',
        preparationTime: item.approxTime || '',
        popular: item.isPopular || false,
        new: item.isNewItem || false,
        chefRecommended: item.isChefsChoice || false,
        dietaryInfo: {
          vegetarian: item.isVeg || false,
          vegan: false,
          glutenFree: false,
          dairyFree: false,
          spicy: false,
        },
        tags: [],
        ingredients: [],
        allergens: [],
        nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      };
      setEditingItem(convertedItem);
    }
  };

  const handleSaveItem = () => {
    setEditingItem(null);
    refetchItems();
  };

  const handleDeleteItem = (item: ApiMenuItem) => {
    setPendingDeleteItem(item);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteItem) return;
    try {
      await deleteMenuItem(pendingDeleteItem.itemId).unwrap();
      toast.success(`"${pendingDeleteItem.foodName}" deleted`);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete item');
    } finally {
      setPendingDeleteItem(null);
    }
  };

  const handleAddNewItem = () => {
    setIsAddItemModalOpen(true);
  };

  const handleAddNewCategory = () => {
    setIsAddCategoryModalOpen(true);
  };

  const handleSaveNewItem = () => {
    refetchItems();
  };

  const handleSaveNewCategory = (category: any) => {
    // The AddCategoryModal already calls addCategory, so we just need to show success
    toast.success(`Successfully added category!`);
    refetchItems();
  };



  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-3">

        {/* Row 1: Search — full width */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10 pointer-events-none" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Row 2: Category filter + Sold Out toggle */}
        <div className="flex gap-2">
          <Select
            value={selectedCategory?.toString() || 'all'}
            onValueChange={(val) => setSelectedCategory(val === 'all' ? null : Number(val))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.filter(cat => cat?.categoryId != null).map(cat => (
                <SelectItem key={cat.categoryId} value={cat.categoryId?.toString()}>
                  {cat.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={showSoldOut ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSoldOut(!showSoldOut)}
            className="flex items-center gap-2 h-10 whitespace-nowrap flex-shrink-0"
          >
            {showSoldOut ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="hidden sm:inline">Sold Out Items</span>
            <span className="sm:hidden">Sold Out</span>
          </Button>
        </div>

        {/* Row 3: Add buttons — full width on mobile */}
        <div className="flex gap-2">
          <Button
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handleAddNewItem}
          >
            <Plus className="h-4 w-4" />
            Add New Item
          </Button>

          <Button
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handleAddNewCategory}
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>

      </div>

      {/* Stats Cards */}
      {isLoadingItems ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-xl font-semibold">{allMenuItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Star className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Popular</p>
                  <p className="text-xl font-semibold">
                    {allMenuItems.filter(item => item.isPopular).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <EyeOff className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sold Out</p>
                  <p className="text-xl font-semibold">
                    {allMenuItems.filter(item => item.soldOut).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">New Items</p>
                  <p className="text-xl font-semibold">
                    {allMenuItems.filter(item => item.isNewItem).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Menu Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Items ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {isLoadingItems ? (
              <div className="p-4 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <MenuManagementSkeleton key={i} />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedItems.map((item, index) => {
                const category = categories.find(cat => cat.categoryId === item.categoryId);
                // subCategory removed - not used in project

                return (
                  <motion.div
                    key={item.itemId}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    onClick={() => handleEditItem(item.itemId)}
                    className={`p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-accent/40 ${
                      item.soldOut ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Item Image */}
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.images?.find(i => i.isPrimary)?.imageUrl || item.images?.[0]?.imageUrl || '/placeholder.svg'}
                          alt={item.foodName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold ${item.soldOut ? 'text-gray-500' : 'text-gray-900'}`}>
                                {item.foodName}
                              </h3>
                              <div className="flex gap-1">
                                {item.isPopular && (
                                  <Badge variant="secondary" className="text-xs">
                                    Popular
                                  </Badge>
                                )}
                                {item.isNewItem && (
                                  <Badge variant="outline" className="text-xs">
                                    New
                                  </Badge>
                                )}
                                {item.isChefsChoice && (
                                  <Badge variant="default" className="text-xs">
                                    Chef's Choice
                                  </Badge>
                                )}
                                {item.soldOut && (
                                  <Badge variant="destructive" className="text-xs">
                                    Sold Out
                                  </Badge>
                                )}
                                {item.isVeg && (
                                  <Badge variant="outline" className="text-xs bg-green-50">
                                    Vegetarian
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className={`text-sm mb-2 ${item.soldOut ? 'text-gray-400' : 'text-gray-600'}`}>
                              {item.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{category?.categoryName}</span>
                              {item.approxTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.approxTime}
                                </span>
                              )}
                              {item.weight && (
                                <span>{item.weight}</span>
                              )}
                            </div>
                          </div>

                          {/* Price and Actions */}
                          <div className="flex items-center gap-4 ml-4">
                            <div className="text-right">
                              <p className={`text-lg font-semibold ${item.soldOut ? 'text-gray-500' : 'text-gray-900'}`}>
                                ${item.price.toFixed(2)}
                              </p>
                              {/* originalPrice removed - not in API response */}
                            </div>

                            {/* Actions Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditItem(item.itemId)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Item
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleVisibility(item)}>
                                  {item.soldOut ? (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Mark Available
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      Mark Sold Out
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteItem(item)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Item
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredItems.length)} of {filteredItems.length} items
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    ‹
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                      ) : (
                        <Button
                          key={p}
                          variant={currentPage === p ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(p as number)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {p}
                        </Button>
                      )
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    ›
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleSaveItem}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onSave={handleSaveNewItem}
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onSave={handleSaveNewCategory}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!pendingDeleteItem} onOpenChange={() => setPendingDeleteItem(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <div className="bg-red-50 p-6 flex items-center gap-4 border-b border-red-100">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-red-900 uppercase tracking-tight">Confirm Deletion</h3>
              <p className="text-xs font-bold text-red-600/70 uppercase tracking-widest">Safety Check Required</p>
            </div>
          </div>
          
          <div className="p-8 space-y-4">
            <p className="text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-black text-gray-900">"{pendingDeleteItem?.foodName}"</span>? 
              This action cannot be undone and the item will be removed from all customer menus immediately.
            </p>
          </div>

          <div className="p-6 bg-gray-50 flex gap-3 justify-end">
            <Button 
              variant="ghost" 
              onClick={() => setPendingDeleteItem(null)}
              className="font-bold text-gray-500 hover:bg-gray-200"
            >
              Keep Item
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 font-black uppercase tracking-widest px-8 shadow-lg shadow-red-200"
            >
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
