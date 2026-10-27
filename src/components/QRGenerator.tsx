import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Download, Share, Copy, Check, Plus, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRestaurant } from '@/contexts/RestaurantContext';

interface QRGeneratorProps {
  restaurantName: string;
  menuUrl: string;
  tableId?: string;
  showTableSelector?: boolean;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ 
  restaurantName, 
  menuUrl, 
  tableId,
  showTableSelector = false 
}) => {
  const { currentRestaurant, tables, getTablesByRestaurant, addTable } = useRestaurant();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(tableId || 'general');
  const [qrSize, setQrSize] = useState('300');
  const [qrFormat, setQrFormat] = useState('png');

  // Get restaurant tables
  const restaurantTables = currentRestaurant ? getTablesByRestaurant(currentRestaurant.id) : [];

  // Generate the appropriate URL based on table selection
  const generateMenuUrl = () => {
    if (selectedTableId && selectedTableId !== 'general' && currentRestaurant) {
      return `${window.location.origin}/menu/${currentRestaurant.slug}/${selectedTableId}`;
    }
    return menuUrl;
  };

  const finalMenuUrl = generateMenuUrl();

  // Generate QR code URL using a free service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(finalMenuUrl)}&format=${qrFormat}&margin=20`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(finalMenuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    const fileName = selectedTableId && selectedTableId !== 'general'
      ? `${restaurantName}-table-${selectedTableId}-qr.${qrFormat}`
      : `${restaurantName}-menu-qr.${qrFormat}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateNewTable = () => {
    if (currentRestaurant) {
      const tableNumber = String(restaurantTables.length + 1);
      addTable({
        restaurantId: currentRestaurant.id,
        tableNumber,
        capacity: 4,
        location: 'Main Dining'
      });
      // The table will be available in the next render
      setTimeout(() => {
        const newTable = restaurantTables[restaurantTables.length - 1];
        if (newTable) {
          setSelectedTableId(newTable.id);
        }
      }, 100);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="w-4 h-4" />
          Generate QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Generator
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Table Selection */}
          {showTableSelector && currentRestaurant && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Table</Label>
                <Button size="sm" variant="outline" onClick={handleCreateNewTable}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Table
                </Button>
              </div>
              <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a table or general menu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Menu</SelectItem>
                  {restaurantTables.map(table => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.tableNumber} ({table.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* QR Code Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="qrSize">Size (px)</Label>
              <Select value={qrSize} onValueChange={setQrSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="200">200x200</SelectItem>
                  <SelectItem value="300">300x300</SelectItem>
                  <SelectItem value="400">400x400</SelectItem>
                  <SelectItem value="500">500x500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="qrFormat">Format</Label>
              <Select value={qrFormat} onValueChange={setQrFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* QR Code Display */}
          <motion.div 
            className="flex justify-center p-4 bg-white rounded-lg border"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <img 
              src={qrCodeUrl} 
              alt="Menu QR Code"
              className={`w-${Math.min(parseInt(qrSize) / 20, 24)} h-${Math.min(parseInt(qrSize) / 20, 24)}`}
              style={{ width: `${Math.min(parseInt(qrSize), 300)}px`, height: `${Math.min(parseInt(qrSize), 300)}px` }}
            />
          </motion.div>

          {/* Restaurant Info */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{restaurantName}</h3>
            <p className="text-sm text-muted-foreground">
              {selectedTableId && selectedTableId !== 'general' ? `Table ${restaurantTables.find(t => t.id === selectedTableId)?.tableNumber} - ` : ''}
              Scan to view our interactive menu
            </p>
            <p className="text-xs text-gray-500 font-mono break-all">
              {finalMenuUrl}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={handleDownloadQR}
              className="w-full gap-2"
            >
              <Download className="w-4 h-4" />
              Download QR Code
            </Button>
            
            <Button 
              onClick={handleCopyLink}
              variant="outline" 
              className="w-full gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Menu Link
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${restaurantName} Menu`,
                    text: 'Check out our interactive menu!',
                    url: finalMenuUrl
                  });
                }
              }}
              variant="outline" 
              className="w-full gap-2"
            >
              <Share className="w-4 h-4" />
              Share Menu
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-accent/10 p-4 rounded-lg">
            <h4 className="font-medium mb-2">How to use:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Print and place QR codes on tables</li>
              <li>• Customers scan with their phones</li>
              <li>• They get instant access to your digital menu</li>
              <li>• No app download required!</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
