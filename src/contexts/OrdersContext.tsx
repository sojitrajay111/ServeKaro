import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { orderApi } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { useOrderHub } from '@/hooks/useOrderHub';
import { authService } from '@/services/api';
import { toast } from 'sonner';

export interface OrderItem {
  itemId: number;
  foodName: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface TableOrder {
  tableId: string;
  tableNumber: string;
  items: OrderItem[];
  status: 'browsing' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
  total: number;
  customerName?: string;
  customerPhone?: string;
  orderId?: number;
}

interface OrdersContextType {
  activeOrders: Map<string, TableOrder>;
  customerOrders: TableOrder[];
  updateOrderStatus: (orderIdOrTableId: string, status: TableOrder['status']) => void;
  completeOrder: (orderIdOrTableId: string) => void;
  submitOrder: (order: TableOrder) => void;
  syncCartWithAdmin: (tableId: string, tableNumber: string, items: OrderItem[], total: number) => void;
  connectionState: string;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [activeOrders, setActiveOrders] = useState<Map<string, TableOrder>>(new Map());
  const [customerOrders, setCustomerOrders] = useState<TableOrder[]>([]);

  const { isAuthenticated } = useAuth();

  // SignalR integration
  const handleNewOrder = (order: any) => {
    const tableIdStr = order.tableId ? order.tableId.toString() : 'takeaway';
    const orderKey = order.orderId ? order.orderId.toString() : tableIdStr;
    
    const rawStatus = order.status ? order.status.toLowerCase() : 'pending';
    const mappedStatus = ['browsing', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].includes(rawStatus)
      ? (rawStatus as TableOrder['status'])
      : 'pending';

    const mappedOrder: TableOrder = {
      tableId: tableIdStr,
      tableNumber: order.tableNumber || 'TA',
      status: mappedStatus,
      createdAt: order.createdAt || new Date().toISOString(),
      total: order.totalAmount || 0,
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      orderId: order.orderId,
      items: (order.items || []).map((bi: any) => ({
        itemId: bi.menuItemId,
        foodName: bi.itemName || 'Item',
        price: bi.unitPrice || 0,
        quantity: bi.quantity || 1,
        notes: order.notes || ''
      }))
    };

    // Add to active orders
    setActiveOrders(prev => {
      const next = new Map(prev);
      
      // If we receive a new order for a table, remove any browsing/cart session for that table
      if (order.tableId) {
        const browsingKey = Array.from(prev.keys()).find(k => prev.get(k)?.tableId === tableIdStr && prev.get(k)?.status === 'browsing');
        if (browsingKey) {
          next.delete(browsingKey);
        }
      }
      
      next.set(orderKey, mappedOrder);
      return next;
    });

    // Display real-time toast for authenticated admin users only when inside the admin panel
    if (isAuthenticated && window.location.pathname.startsWith('/admin')) {
      toast.success(`New order ${order.orderNumber} received!`);
    }
  };

  const handleStatusUpdate = (update: any) => {
    const { orderId, status } = update;
    const rawStatus = status ? status.toLowerCase() : 'pending';
    const mappedStatus = ['browsing', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].includes(rawStatus)
      ? (rawStatus as TableOrder['status'])
      : 'pending';

    setActiveOrders(prev => {
      const next = new Map(prev);
      // Find order by orderId
      for (const [key, order] of next.entries()) {
        if (order.orderId === orderId) {
          if (mappedStatus === 'completed' || mappedStatus === 'cancelled') {
            next.delete(key);
          } else {
            next.set(key, { ...order, status: mappedStatus });
          }
          break;
        }
      }
      return next;
    });

    // Also update customer history if it matches
    setCustomerOrders(prev => prev.map(co =>
      co.orderId === orderId ? { ...co, status: mappedStatus } : co
    ));

    // Display status update toast only when inside the admin panel
    if (window.location.pathname.startsWith('/admin')) {
      toast.info(`Order #${orderId} status updated to ${status}`);
    }
  };

  const token = isAuthenticated ? authService.getToken() : null;
  const { connectionState } = useOrderHub(token, handleNewOrder, handleStatusUpdate);

  // Sync active orders from the backend API
  useEffect(() => {
    const syncBackendOrders = async () => {
      if (!isAuthenticated) return;
      try {
        const backendOrders = await orderApi.getOrders();
        setActiveOrders(prev => {
          const next = new Map();
          // Retain local client-side browsing sessions
          prev.forEach((order, key) => {
            if (order.status === 'browsing') {
              next.set(key, order);
            }
          });

          if (backendOrders && backendOrders.length > 0) {
            backendOrders.forEach((bo: any) => {
              const rawStatus = bo.status ? bo.status.toLowerCase() : 'pending';
              // Filter out completed and cancelled orders from active orders list
              if (rawStatus === 'completed' || rawStatus === 'cancelled') {
                return;
              }
              const tableIdStr = bo.tableId ? bo.tableId.toString() : 'takeaway';
              const orderKey = bo.orderId ? bo.orderId.toString() : tableIdStr;
              const mappedStatus = ['browsing', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].includes(rawStatus)
                ? (rawStatus as TableOrder['status'])
                : 'pending';

              next.set(orderKey, {
                tableId: tableIdStr,
                tableNumber: bo.tableNumber || 'TA',
                status: mappedStatus,
                createdAt: bo.createdAt || new Date().toISOString(),
                total: bo.totalAmount || 0,
                customerName: bo.customerName || '',
                customerPhone: bo.customerPhone || '',
                orderId: bo.orderId,
                items: (bo.items || []).map((bi: any) => ({
                  itemId: bi.menuItemId,
                  foodName: bi.itemName || 'Item',
                  price: bi.unitPrice || 0,
                  quantity: bi.quantity || 1,
                  notes: bo.notes || ''
                }))
              });
            });
          }
          return next;
        });
      } catch (err) {
        console.error('Failed to sync active orders from backend:', err);
      }
    };

    syncBackendOrders();
  }, [isAuthenticated]);

  const submitOrder = async (order: TableOrder) => {
    try {
      // Map to PlaceOrderDTO:
      const placeOrderData = {
        tableId: order.tableId && order.tableId !== 'takeaway' ? parseInt(order.tableId) : null,
        customerName: order.customerName || 'Walk-in Customer',
        customerPhone: order.customerPhone || '',
        notes: order.items.map(item => item.notes).filter(Boolean).join(', ') || '',
        items: order.items.map(item => ({
          menuItemId: item.itemId,
          quantity: item.quantity
        }))
      };

      const response = await orderApi.createOrder('restaurant-001', placeOrderData);
      const bo = response?.data || response;
      
      const newOrder = { 
        ...order, 
        status: 'pending' as const,
        orderId: bo?.orderId
      };
      
      // Add to admin's active orders
      setActiveOrders(prev => {
        const next = new Map(prev);
        const orderKey = bo?.orderId ? bo.orderId.toString() : order.tableId;
        
        // Remove browsing order for this table if any
        if (order.tableId) {
          const browsingKey = Array.from(prev.keys()).find(k => prev.get(k)?.tableId === order.tableId && prev.get(k)?.status === 'browsing');
          if (browsingKey) {
            next.delete(browsingKey);
          }
        }
        
        next.set(orderKey, newOrder);
        return next;
      });

      // Add to customer's personal history
      setCustomerOrders(prev => {
        const filtered = prev.filter(o => o.createdAt !== order.createdAt);
        return [newOrder, ...filtered];
      });
    } catch (err) {
      console.error('Error placing order on backend:', err);
    }
  };

  const syncCartWithAdmin = (tableId: string, tableNumber: string, items: OrderItem[], total: number) => {
    if (items.length === 0) return;
    
    setActiveOrders(prev => {
      const next = new Map(prev);
      const existingKey = Array.from(prev.keys()).find(k => prev.get(k)?.tableId === tableId && prev.get(k)?.status === 'browsing') || tableId;
      const existing = prev.get(existingKey);
      
      // If there is an active pending/preparing/ready order on this table, do not overwrite it with browsing
      const hasRealOrder = Array.from(prev.values()).some(o => o.tableId === tableId && o.status !== 'browsing');
      if (hasRealOrder) {
        if (existing?.status === 'browsing') {
          next.delete(existingKey);
        }
        return next;
      }
      
      next.set(tableId, {
        tableId,
        tableNumber,
        items,
        total,
        status: existing?.status || 'browsing',
        createdAt: existing?.createdAt || new Date().toISOString()
      });
      return next;
    });
  };

  const updateOrderStatus = async (orderIdOrTableId: string, status: TableOrder['status']) => {
    try {
      const order = activeOrders.get(orderIdOrTableId);
      if (order) {
        // If orderId exists, use it to call the backend status PUT endpoint
        const targetId = order.orderId ? order.orderId.toString() : orderIdOrTableId;
        
        await orderApi.updateOrderStatus('restaurant-001', targetId, status);
        
        const updatedOrder = { ...order, status };
        setActiveOrders(prev => {
          const next = new Map(prev);
          if (status === 'completed' || status === 'cancelled') {
            next.delete(orderIdOrTableId);
          } else {
            next.set(orderIdOrTableId, updatedOrder);
          }
          return next;
        });
        
        // Also update in customer history if it matches
        setCustomerOrders(cPrev => cPrev.map(co => 
          (co.orderId?.toString() === targetId || co.tableId === orderIdOrTableId) && co.status !== 'completed' ? updatedOrder : co
        ));
      }
    } catch (err) {
      console.error('Error updating order status on backend:', err);
    }
  };

  const completeOrder = async (orderIdOrTableId: string) => {
    try {
      const order = activeOrders.get(orderIdOrTableId);
      if (order && order.orderId) {
        await orderApi.updateOrderStatus('restaurant-001', order.orderId.toString(), 'completed');
      }
      
      setActiveOrders(prev => {
        const next = new Map(prev);
        next.delete(orderIdOrTableId);
        return next;
      });
      
      // Mark as completed in customer history
      setCustomerOrders(cPrev => cPrev.map(co => 
        (co.orderId?.toString() === order?.orderId?.toString() || co.tableId === orderIdOrTableId) ? { ...co, status: 'completed' } : co
      ));
    } catch (err) {
      console.error('Error completing order on backend:', err);
    }
  };

  return (
    <OrdersContext.Provider value={{
      activeOrders,
      customerOrders,
      updateOrderStatus,
      completeOrder,
      submitOrder,
      syncCartWithAdmin,
      connectionState
    }}>
      {children}
    </OrdersContext.Provider>
  );
};

