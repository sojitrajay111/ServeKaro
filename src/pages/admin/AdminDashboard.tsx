import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye,
  Star,
  Clock,
  ChefHat,
  QrCode,
  Users,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Menu as MenuIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { AddItemModal } from '@/components/admin/AddItemModal';
import { AddCategoryModal } from '@/components/admin/AddCategoryModal';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useMenu } from '@/contexts/MenuContext';
import { useOrders } from '@/contexts/OrdersContext';
import { toast } from 'sonner';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentRestaurant, getTablesByRestaurant } = useRestaurant();
  const { menuItems } = useMenu();
  const { activeOrders } = useOrders();
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  // Real stats derived from live data
  const restaurantTables = currentRestaurant ? getTablesByRestaurant(currentRestaurant.id) : [];
  const activeQRCodes = restaurantTables.filter(t => t.isActive).length;
  const orderList = Array.from(activeOrders.values());
  const liveRevenue = orderList.reduce((sum, o) => sum + o.total, 0);
  const activeOrderCount = orderList.length;
  const avgOrderValue = activeOrderCount > 0 ? liveRevenue / activeOrderCount : 0;

  // Recent Activity — generated from real active orders, newest first
  const recentActivity = orderList
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(order => {
      const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
      const timeLabel = elapsed < 1 ? 'Just now' : `${elapsed}m ago`;
      const statusLabel =
        order.status === 'pending' ? 'New order placed' :
        order.status === 'preparing' ? 'Being prepared' :
        order.status === 'ready' ? 'Ready to serve' :
        order.status === 'browsing' ? 'Browsing menu' : order.status;
      return {
        id: order.tableId,
        time: timeLabel,
        activity: `Table ${order.tableNumber} — ${statusLabel} (${order.items.length} item${order.items.length !== 1 ? 's' : ''}, $${order.total.toFixed(2)})`,
        type: order.status === 'pending' || order.status === 'preparing' ? 'order' : 'status',
      };
    });

  // Popular Items — count frequency across all active orders, fall back to isPopular flag
  const itemFrequency = new Map<number, { name: string; count: number }>();
  orderList.forEach(order => {
    order.items.forEach(item => {
      const existing = itemFrequency.get(item.itemId);
      if (existing) {
        existing.count += item.quantity;
      } else {
        itemFrequency.set(item.itemId, { name: item.foodName, count: item.quantity });
      }
    });
  });

  const popularItems = itemFrequency.size > 0
    ? Array.from(itemFrequency.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
    : menuItems
        .filter(item => item.popular)
        .slice(0, 4)
        .map(item => ({ name: item.foodName, count: 0 }));

  const statsData = [
    {
      title: 'Total Menu Items',
      value: menuItems.length.toString(),
      sub: `${menuItems.filter(i => i.popular).length} popular`,
      icon: ChefHat,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Active QR Codes',
      value: activeQRCodes.toString(),
      sub: `${restaurantTables.length} tables total`,
      icon: QrCode,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Active Orders',
      value: activeOrderCount.toString(),
      sub: `${orderList.filter(o => o.status === 'pending').length} pending`,
      icon: ShoppingCart,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Live Revenue',
      value: `$${liveRevenue.toFixed(2)}`,
      sub: `$${avgOrderValue.toFixed(2)} avg/order`,
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  const handleAddNewItem = () => {
    setIsAddItemModalOpen(true);
  };

  const handleAddNewCategory = () => {
    setIsAddCategoryModalOpen(true);
  };

  const handleViewPublicMenu = () => {
    if (currentRestaurant) {
      const menuUrl = `/menu/${currentRestaurant.slug}`;
      window.open(menuUrl, '_blank');
    } else {
      console.error('No restaurant selected');
    }
  };

  const handleSaveNewItem = () => {
    // Item saved via API in AddItemModal — nothing to do here
  };

  const handleSaveNewCategory = (category: any) => {
    // The AddCategoryModal already calls addCategory, so we just need to show success
    toast.success(`Category "${category.name || category.categoryName}" added successfully`);
  };

  const handleUpdateMenu = () => {
    navigate('/admin/menu');
  };

  const handleViewQRCodes = () => {
    navigate('/admin/qr-codes');
  };

  if (!currentRestaurant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Restaurant Selected</h3>
          <p className="text-gray-500">Please select a restaurant to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                        {stat.title}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">
                        {stat.value}
                      </p>
                      <p className="text-xs sm:text-sm mt-1 sm:mt-2 text-gray-500 truncate">
                        {stat.sub}
                      </p>
                    </div>
                    <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2 ${stat.iconBg}`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Live Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    ${liveRevenue.toFixed(2)}
                  </p>
                  <p className="text-sm mt-2 text-gray-500">
                    From {activeOrderCount} active order{activeOrderCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {activeOrderCount}
                  </p>
                  <p className="text-sm mt-2 text-gray-500">
                    {orderList.filter(o => o.status === 'preparing').length} being prepared
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    ${avgOrderValue.toFixed(2)}
                  </p>
                  <p className="text-sm mt-2 text-gray-500">
                    {orderList.filter(o => o.status === 'ready').length} ready to serve
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">{activity.time}</span>
                        <Badge
                          variant={activity.type === 'order' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {activity.type === 'order' ? 'New Order' : 'Update'}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{activity.activity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={handleUpdateMenu}
              >
                Manage Menu
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Popular Items */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Popular Items Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularItems.length > 0 ? popularItems.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-sm font-semibold text-accent-foreground">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          {item.count > 0
                            ? <span>{item.count} ordered today</span>
                            : <span className="text-orange-500">Marked popular</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No popular items yet</p>
                    <p className="text-sm text-gray-400">Add items and mark them as popular</p>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={handleUpdateMenu}
              >
                Manage Popular Items
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <Button 
                className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-sm"
                onClick={handleAddNewItem}
              >
                <ChefHat className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm">Add Menu Item</span>
              </Button>
              <Button 
                className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-sm"
                onClick={handleAddNewCategory}
              >
                <MenuIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm">Add Category</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-sm"
                onClick={handleUpdateMenu}
              >
                <Eye className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm">Manage Menu</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-sm"
                onClick={() => navigate('/admin/orders')}
              >
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm">Take Orders</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-sm"
                onClick={handleViewQRCodes}
              >
                <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm">QR Codes</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-sm"
                onClick={() => navigate('/admin/settings')}
              >
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
    </div>
  );
};
