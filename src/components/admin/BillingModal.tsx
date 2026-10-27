import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { TableOrder } from '@/contexts/OrdersContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Printer, CreditCard, Banknote, Smartphone, Users } from 'lucide-react';
import { toast } from 'sonner';

interface BillingModalProps {
  order: TableOrder;
  onClose: () => void;
  onPaid: (orderIdOrTableId: string) => void;
}

export const BillingModal: React.FC<BillingModalProps> = ({ order, onClose, onPaid }) => {
  const { currentRestaurant } = useRestaurant();
  const taxRate = (currentRestaurant?.settings?.taxRate ?? 8.5) / 100;

  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [splitBy, setSplitBy] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount =
    discountType === 'percentage'
      ? (subtotal * Math.min(discountValue, 100)) / 100
      : Math.min(discountValue, subtotal);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * taxRate;
  const total = taxableAmount + taxAmount;
  const perPerson = splitBy > 1 ? total / splitBy : null;

  const printBill = () => {
    const billNumber = `BILL-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Bill - Table ${order.tableNumber}</title>
  <style>
    body { font-family: 'Courier New', monospace; max-width: 320px; margin: 0 auto; padding: 16px; font-size: 13px; }
    h1 { text-align: center; font-size: 18px; margin: 0 0 4px; }
    .center { text-align: center; }
    .row { display: flex; justify-content: space-between; margin: 4px 0; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .bold { font-weight: bold; }
    .total-row { font-size: 16px; font-weight: bold; }
    .green { color: #16a34a; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${currentRestaurant?.name || 'Restaurant'}</h1>
  <p class="center" style="margin:0;font-size:11px">${currentRestaurant?.address || ''}</p>
  <div class="divider"></div>
  <div class="row"><span>Bill No: <b>${billNumber}</b></span><span>${now.toLocaleDateString()}</span></div>
  <div class="row"><span>Table: <b>${order.tableNumber}</b></span><span>${now.toLocaleTimeString()}</span></div>
  <div class="divider"></div>
  <div class="row bold"><span>Item</span><span>Amount</span></div>
  <div class="divider"></div>
  ${order.items
    .map(
      (item) =>
        `<div class="row"><span>${item.quantity}× ${item.foodName}</span><span>$${(item.price * item.quantity).toFixed(2)}</span></div>`
    )
    .join('')}
  <div class="divider"></div>
  <div class="row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
  ${discountAmount > 0 ? `<div class="row green"><span>Discount${discountType === 'percentage' ? ` (${discountValue}%)` : ''}</span><span>-$${discountAmount.toFixed(2)}</span></div>` : ''}
  <div class="row"><span>Tax (${(taxRate * 100).toFixed(1)}%)</span><span>$${taxAmount.toFixed(2)}</span></div>
  <div class="divider"></div>
  <div class="row total-row"><span>TOTAL</span><span>$${total.toFixed(2)}</span></div>
  ${perPerson ? `<div class="row"><span>Per Person (÷${splitBy})</span><span>$${perPerson.toFixed(2)}</span></div>` : ''}
  <div class="divider"></div>
  <p class="center">Payment: <b>${paymentMethod.toUpperCase()}</b></p>
  <p class="center" style="margin-top:12px">Thank you for dining with us!</p>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=400,height=620');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const handlePaid = () => {
    onPaid(order.orderId ? order.orderId.toString() : order.tableId);
    toast.success(`Table ${order.tableNumber} — Bill settled (${paymentMethod.toUpperCase()})`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Bill — Table {order.tableNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Items list */}
          <div className="space-y-1.5 bg-gray-50 rounded-lg p-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}× {item.foodName}
                </span>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Discount */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Discount</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={discountType === 'percentage' ? 'default' : 'outline'}
                onClick={() => setDiscountType('percentage')}
                className="flex-1"
              >
                % Percentage
              </Button>
              <Button
                size="sm"
                variant={discountType === 'flat' ? 'default' : 'outline'}
                onClick={() => setDiscountType('flat')}
                className="flex-1"
              >
                $ Flat Amount
              </Button>
            </div>
            <Input
              type="number"
              min="0"
              max={discountType === 'percentage' ? 100 : subtotal}
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              placeholder={discountType === 'percentage' ? 'Enter % (e.g. 10)' : 'Enter amount'}
            />
          </div>

          {/* Split Bill */}
          <div className="space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" /> Split Bill
            </p>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSplitBy(Math.max(1, splitBy - 1))}
                className="h-8 w-8 p-0"
              >
                −
              </Button>
              <span className="text-sm font-bold w-8 text-center">{splitBy}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSplitBy(splitBy + 1)}
                className="h-8 w-8 p-0"
              >
                +
              </Button>
              <span className="text-xs text-gray-500 ml-1">
                {splitBy > 1 ? `$${(total / splitBy).toFixed(2)} per person` : 'No split'}
              </span>
            </div>
          </div>

          <Separator />

          {/* Bill summary */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>
                  Discount
                  {discountType === 'percentage' ? ` (${discountValue}%)` : ''}
                </span>
                <span>−${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Tax ({(taxRate * 100).toFixed(1)}%)</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {perPerson && (
              <div className="flex justify-between text-orange-600 font-semibold">
                <span>Per Person (÷{splitBy})</span>
                <span>${perPerson.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Payment Method</p>
            <div className="flex gap-2">
              {(['cash', 'card', 'upi'] as const).map((method) => (
                <Button
                  key={method}
                  size="sm"
                  variant={paymentMethod === method ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod(method)}
                  className="flex-1 capitalize"
                >
                  {method === 'card' ? (
                    <CreditCard className="w-3 h-3 mr-1" />
                  ) : method === 'upi' ? (
                    <Smartphone className="w-3 h-3 mr-1" />
                  ) : (
                    <Banknote className="w-3 h-3 mr-1" />
                  )}
                  {method}
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={printBill}>
              <Printer className="w-4 h-4 mr-2" />
              Print Bill
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handlePaid}>
              Mark as Paid
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
