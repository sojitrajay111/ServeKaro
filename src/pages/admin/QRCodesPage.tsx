import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download, Share, Copy, Check, Plus, Trash2, Edit, Table, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { QRGenerator } from '@/components/QRGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface QRCodeData {
  id: string;
  name: string;
  url: string;
  description: string;
  scans: number;
  created: string;
  active: boolean;
  tableId?: string;
  type: 'general' | 'table' | 'special';
}

export const QRCodesPage: React.FC = () => {
  const { currentRestaurant, tables, getTablesByRestaurant, addTable, updateTable, deleteTable } = useRestaurant();
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newQRName, setNewQRName] = useState('');
  const [newQRUrl, setNewQRUrl] = useState('');
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'general' | 'table' | 'special'>('all');

  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [qrToDelete, setQrToDelete] = useState<QRCodeData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [newTableLocation, setNewTableLocation] = useState('Main Dining');
  const [newTableActive, setNewTableActive] = useState(true);
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  // Bulk add state
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkTableCount, setBulkTableCount] = useState(5);
  const [bulkStartNumber, setBulkStartNumber] = useState(1);
  const [bulkLocation, setBulkLocation] = useState('Main Dining');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || isSubmittingTable) return;

    if (!newTableNumber.trim()) {
      toast.error('Table number is required');
      return;
    }

    const restaurantTables = getTablesByRestaurant(currentRestaurant.id);
    const existingTable = restaurantTables.find(
      t => t.tableNumber.trim().toLowerCase() === newTableNumber.trim().toLowerCase() &&
        t.location.trim().toLowerCase() === newTableLocation.trim().toLowerCase()
    );
    if (existingTable) {
      toast.error(`Table ${newTableNumber} already exists in ${newTableLocation}`);
      return;
    }

    setIsSubmittingTable(true);
    try {
      await addTable({
        restaurantId: currentRestaurant.id,
        tableNumber: newTableNumber.trim(),
        tableName: newTableName.trim() || undefined,
        capacity: parseInt(newTableCapacity) || 4,
        location: newTableLocation,
        isActive: newTableActive
      });
      toast.success(`Table ${newTableNumber} created successfully`);
      setIsAddTableOpen(false);
      // Reset form
      setNewTableNumber('');
      setNewTableName('');
      setNewTableCapacity('4');
      setNewTableLocation('Main Dining');
      setNewTableActive(true);
    } catch (err) {
      toast.error('Failed to create table');
      console.error(err);
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const handleBulkAddTables = async () => {
    if (!currentRestaurant || bulkTableCount < 1) {
      toast.error('Please enter a valid number of tables');
      return;
    }

    setIsBulkSubmitting(true);
    try {
      const restaurantTables = getTablesByRestaurant(currentRestaurant.id);
      const existingNumbers = restaurantTables
        .filter(t => t.location === bulkLocation)
        .map(t => parseInt(t.tableNumber))
        .filter(n => !isNaN(n));
      const maxExisting = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
      const startNumber = Math.max(bulkStartNumber, maxExisting + 1);

      for (let i = 0; i < bulkTableCount; i++) {
        const tableNumber = (startNumber + i).toString();
        const exists = restaurantTables.some(
          t => t.tableNumber === tableNumber && t.location === bulkLocation
        );
        if (!exists) {
          await addTable({
            restaurantId: currentRestaurant.id,
            tableNumber,
            capacity: 4,
            location: bulkLocation,
            isActive: true
          });
        }
      }

      toast.success(`Added ${bulkTableCount} table(s) to ${bulkLocation}`);
      setIsBulkAddOpen(false);
      setBulkTableCount(5);
      setBulkStartNumber(1);
      setBulkLocation('Main Dining');
    } catch (err) {
      toast.error('Failed to bulk add tables');
      console.error(err);
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Generate QR codes based on restaurant tables and general menu
  useEffect(() => {
    if (currentRestaurant) {
      const restaurantTables = getTablesByRestaurant(currentRestaurant.id);
      const baseUrl = `${window.location.origin}/menu/${currentRestaurant.slug}`;

      const generatedQRCodes: QRCodeData[] = [
        {
          id: 'general-menu',
          name: 'General Menu',
          url: baseUrl,
          description: 'Main restaurant menu accessible to all customers',
          scans: 1234,
          created: currentRestaurant.createdAt,
          active: true,
          type: 'general'
        },
        ...restaurantTables.map(table => ({
          id: `table-${table.id}`,
          name: table.tableName || `Table ${table.tableNumber}`,
          url: `${baseUrl}/${table.id}`,
          description: `QR code for ${table.tableName || `Table ${table.tableNumber}`} in ${table.location}`,
          scans: Math.floor(Math.random() * 500) + 50,
          created: table.createdAt,
          active: table.isActive,
          tableId: table.id,
          type: 'table' as const
        }))
      ];

      setQrCodes(prev => {
        // Keep custom QR codes that were manually generated
        const customQRs = prev.filter(qr => qr.type === 'special');
        return [...generatedQRCodes, ...customQRs];
      });
    }
  }, [currentRestaurant, tables]);

  const filteredQRCodes = qrCodes.filter(qr => {
    if (filterType === 'all') return true;
    return qr.type === filterType;
  });

  const generateQRCodeUrl = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&format=png&margin=20`;
  };

  const handleCopyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleDownloadQR = (qrData: QRCodeData) => {
    const qrUrl = generateQRCodeUrl(qrData.url);
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${qrData.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateQR = () => {
    if (newQRName.trim() && newQRUrl.trim()) {
      const newQR: QRCodeData = {
        id: `custom-${Date.now()}`,
        name: newQRName,
        url: newQRUrl,
        description: 'Custom QR code',
        scans: 0,
        created: new Date().toISOString(),
        active: true,
        type: 'special'
      };
      setQrCodes(prev => [...prev, newQR]);
      setNewQRName('');
      setNewQRUrl('');
    }
  };

  const handleToggleQR = (id: string) => {
    setQrCodes(prev => prev.map(qr =>
      qr.id === id ? { ...qr, active: !qr.active } : qr
    ));
  };

  const handleDeleteQR = (qr: QRCodeData) => {
    setQrToDelete(qr);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!qrToDelete) return;
    setIsDeleting(true);
    try {
      if (qrToDelete.id.startsWith('table-')) {
        const tableId = qrToDelete.id.replace('table-', '');
        await deleteTable(tableId);
      } else {
        setQrCodes(prev => prev.filter(qr => qr.id !== qrToDelete.id));
      }
      toast.success(`QR code "${qrToDelete.name}" deleted successfully`);
    } catch (err) {
      toast.error('Failed to delete QR code');
      console.error(err);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setQrToDelete(null);
    }
  };

  if (!currentRestaurant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Restaurant Selected</h3>
          <p className="text-gray-500">Please select a restaurant to manage QR codes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Code Management</h1>
          <p className="text-gray-500 mt-1">Generate and manage QR codes for {currentRestaurant.name}</p>
        </div>
        <div className="flex gap-2">
          <QRGenerator
            restaurantName={currentRestaurant.name}
            menuUrl={`${window.location.origin}/menu/${currentRestaurant.slug}`}
            showTableSelector={true}
          />
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsBulkAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Bulk Add Tables
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsAddTableOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <QrCode className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total QR Codes</p>
                <p className="text-2xl font-bold">{qrCodes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Table className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Table QR Codes</p>
                <p className="text-2xl font-bold">{qrCodes.filter(qr => qr.type === 'table').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{qrCodes.filter(qr => qr.active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="text-purple-600 text-xs font-bold">👆</div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Scans</p>
                <p className="text-2xl font-bold">{qrCodes.reduce((sum, qr) => sum + qr.scans, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label>Filter by type:</Label>
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All QR Codes</SelectItem>
            <SelectItem value="general">General Menu</SelectItem>
            <SelectItem value="table">Table QR Codes</SelectItem>
            <SelectItem value="special">Custom QR Codes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Create New QR Code */}
      <Card>
        <CardHeader>
          <CardTitle>Create New QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="qrName">QR Code Name</Label>
              <Input
                id="qrName"
                value={newQRName}
                onChange={(e) => setNewQRName(e.target.value)}
                placeholder="e.g., Lunch Menu QR"
              />
            </div>
            <div>
              <Label htmlFor="qrUrl">Target URL</Label>
              <Input
                id="qrUrl"
                value={newQRUrl}
                onChange={(e) => setNewQRUrl(e.target.value)}
                placeholder="https://yourrestaurant.com/menu"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateQR} className="w-full">
                Generate QR Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredQRCodes.map((qrData, index) => (
          <motion.div
            key={qrData.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Card className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{qrData.name}</CardTitle>
                      {qrData.type === 'table' && <Table className="w-4 h-4 text-blue-600" />}
                      {qrData.type === 'general' && <QrCode className="w-4 h-4 text-green-600" />}
                      {qrData.type === 'special' && <MapPin className="w-4 h-4 text-purple-600" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{qrData.description}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={qrData.active ? "default" : "secondary"}>
                      {qrData.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {qrData.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* QR Code Preview */}
                <div className="flex justify-center p-4 bg-white border rounded-lg">
                  <img
                    src={generateQRCodeUrl(qrData.url)}
                    alt={`QR Code for ${qrData.name}`}
                    className="w-24 h-24 sm:w-32 sm:h-32"
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{qrData.scans.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total Scans</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(qrData.created).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">Created</p>
                  </div>
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Target URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={qrData.url}
                      readOnly
                      className="text-xs bg-gray-50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyUrl(qrData.url, qrData.id)}
                      className="flex-shrink-0"
                    >
                      {copiedId === qrData.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleDownloadQR(qrData)}
                    className="flex-1 min-w-[120px]"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleQR(qrData.id)}
                    className="flex-1 min-w-[100px]"
                  >
                    {qrData.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteQR(qrData)}
                    className="text-red-600 hover:text-red-700 px-3 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredQRCodes.length === 0 && (
        <div className="text-center py-12">
          <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No QR Codes Found</h3>
          <p className="text-gray-500 mb-4">
            {filterType === 'all'
              ? 'No QR codes have been created yet.'
              : `No ${filterType} QR codes found.`}
          </p>
          <QRGenerator
            restaurantName={currentRestaurant.name}
            menuUrl={`${window.location.origin}/menu/${currentRestaurant.slug}`}
            showTableSelector={true}
          />
        </div>
      )}

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Usage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Best Practices</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Place QR codes at eye level on tables</li>
                <li>• Ensure good lighting for easy scanning</li>
                <li>• Include clear scanning instructions</li>
                <li>• Test QR codes regularly to ensure they work</li>
                <li>• Use high contrast colors (black on white works best)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Recommended Sizes</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Table tents: 2" x 2" minimum</li>
                <li>• Menu inserts: 1.5" x 1.5" minimum</li>
                <li>• Window displays: 4" x 4" or larger</li>
                <li>• Digital screens: Scale appropriately</li>
                <li>• Print quality: 300 DPI minimum</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Add Tables Dialog */}
      <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Bulk Add Tables</DialogTitle>
            <DialogDescription>
              Add multiple tables at once. QR codes will be generated automatically for each table.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="bulkCount">Number of Tables</Label>
                <Input
                  id="bulkCount"
                  type="number"
                  min="1"
                  max="50"
                  value={bulkTableCount}
                  onChange={(e) => setBulkTableCount(parseInt(e.target.value) || 1)}
                  disabled={isBulkSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bulkStart">Starting Number</Label>
                <Input
                  id="bulkStart"
                  type="number"
                  min="1"
                  value={bulkStartNumber}
                  onChange={(e) => setBulkStartNumber(parseInt(e.target.value) || 1)}
                  disabled={isBulkSubmitting}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bulkLoc">Location</Label>
              <Select value={bulkLocation} onValueChange={setBulkLocation} disabled={isBulkSubmitting}>
                <SelectTrigger id="bulkLoc">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main Dining">Main Dining</SelectItem>
                  <SelectItem value="Patio">Patio</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                  <SelectItem value="Private Room">Private Room</SelectItem>
                  <SelectItem value="Outdoor">Outdoor</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-500">
              Will add tables numbered {bulkStartNumber} – {bulkStartNumber + bulkTableCount - 1} in {bulkLocation}.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIsBulkAddOpen(false)} disabled={isBulkSubmitting}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleBulkAddTables}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                disabled={isBulkSubmitting}
              >
                {isBulkSubmitting ? 'Adding...' : `Add ${bulkTableCount} Table(s)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Table Dialog */}
      <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Table</DialogTitle>
            <DialogDescription>
              Create a new table for your restaurant. A corresponding QR code will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTableSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="newTableNumber">Table Number *</Label>
                <Input
                  id="newTableNumber"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g., T4, 5"
                  required
                  disabled={isSubmittingTable}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="newTableName">Table Name (Optional)</Label>
                <Input
                  id="newTableName"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g., Garden Table 2"
                  disabled={isSubmittingTable}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="newTableCapacity">Capacity (number of seats)</Label>
              <Input
                id="newTableCapacity"
                type="number"
                min="1"
                max="50"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
                required
                disabled={isSubmittingTable}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="newTableLocation">Location</Label>
              <Select value={newTableLocation} onValueChange={setNewTableLocation} disabled={isSubmittingTable}>
                <SelectTrigger id="newTableLocation">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main Dining">Main Dining</SelectItem>
                  <SelectItem value="Patio">Patio</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                  <SelectItem value="Private Room">Private Room</SelectItem>
                  <SelectItem value="Outdoor">Outdoor</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-b">
              <div className="space-y-0.5">
                <Label htmlFor="newTableActive" className="text-sm font-semibold">Active Status</Label>
                <p className="text-[10px] text-gray-500">Enable or disable ordering from this table.</p>
              </div>
              <Switch
                id="newTableActive"
                checked={newTableActive}
                onCheckedChange={setNewTableActive}
                disabled={isSubmittingTable}
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddTableOpen(false)} disabled={isSubmittingTable}>
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold" disabled={isSubmittingTable}>
                {isSubmittingTable ? 'Adding...' : 'Add Table'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete the QR code for <strong className="text-gray-900">"{qrToDelete?.name}"</strong>?
              {qrToDelete?.type === 'table' && (
                <span className="block mt-2 text-red-500 font-medium">
                  Warning: This will also permanently delete the associated table from your restaurant.
                </span>
              )}
              {qrToDelete?.type === 'general' && (
                <span className="block mt-2 text-red-500 font-medium">
                  Warning: This is your general menu QR code.
                </span>
              )}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
