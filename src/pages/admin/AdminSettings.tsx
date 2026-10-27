import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Palette, DollarSign, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { toast } from 'sonner';
import { settingsApi } from '@/services/apiService';

interface SettingsState {
  restaurantName: string;
  slug:           string;
  address:        string;
  phone:          string;
  email:          string;
  logoUrl:        string;
  primaryColor:   string;
  accentColor:    string;
  currency:       string;
  showNutritionalInfo: boolean;
}

const DEFAULTS: SettingsState = {
  restaurantName:      '',
  slug:                '',
  address:             '',
  phone:               '',
  email:               '',
  logoUrl:             '',
  primaryColor:        '#FF6B35',
  accentColor:         '#F7931E',
  currency:            'USD',
  showNutritionalInfo: false,
};

const fromApi = (data: any): SettingsState => ({
  restaurantName:      data?.restaurantName      ?? '',
  slug:                data?.slug                ?? '',
  address:             data?.address             ?? '',
  phone:               data?.phone               ?? '',
  email:               data?.email               ?? '',
  logoUrl:             data?.logoUrl             ?? '',
  primaryColor:        data?.primaryColor        ?? '#FF6B35',
  accentColor:         data?.accentColor         ?? '#F7931E',
  currency:            data?.currency            ?? 'USD',
  showNutritionalInfo: data?.showNutritionalInfo ?? false,
});

export const AdminSettings: React.FC = () => {
  const { currentRestaurant, refreshSettings } = useRestaurant();

  const [form, setForm] = useState<SettingsState>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const set = (field: keyof SettingsState, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // ── GET /api/Settings ─────────────────────────────────────────────────────
  const loadSettings = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await settingsApi.get();
      if (data) setForm(fromApi(data));
    } catch (err: any) {
      setLoadError('Could not load settings from server. Showing defaults.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  // ── PUT /api/Settings ─────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsApi.update(form);
      toast.success('Settings saved!');
      await Promise.all([loadSettings(), refreshSettings()]);
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-gray-500">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {currentRestaurant?.name ?? 'Your restaurant'} · synced with backend
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadSettings} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Reload
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Restaurant Information ── */}
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" /> Restaurant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="restaurantName">Restaurant Name</Label>
                <Input
                  id="restaurantName"
                  value={form.restaurantName}
                  onChange={e => set('restaurantName', e.target.value)}
                  placeholder="e.g. Bella Vista"
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={e => set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="bella-vista"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Menu URL: /menu/<strong>{form.slug || 'your-slug'}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+1 555 123 4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="info@restaurant.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  placeholder="123 Main Street, City"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Appearance ── */}
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4" /> Appearance & Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="color"
                      value={form.primaryColor}
                      onChange={e => set('primaryColor', e.target.value)}
                      className="w-12 h-9 p-0.5 rounded cursor-pointer"
                    />
                    <Input
                      value={form.primaryColor}
                      onChange={e => set('primaryColor', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="color"
                      value={form.accentColor}
                      onChange={e => set('accentColor', e.target.value)}
                      className="w-12 h-9 p-0.5 rounded cursor-pointer"
                    />
                    <Input
                      value={form.accentColor}
                      onChange={e => set('accentColor', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="logoUrl"
                    value={form.logoUrl}
                    onChange={e => set('logoUrl', e.target.value)}
                    placeholder="https://…/logo.png"
                  />
                  <Button size="sm" variant="outline" title="Upload coming soon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {form.logoUrl && (
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="mt-2 h-12 w-auto rounded border border-gray-100 object-contain"
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Menu Display ── */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" /> Menu Display Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Currency</Label>
                  <select
                    value={form.currency}
                    onChange={e => set('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between sm:pt-6">
                  <div>
                    <Label htmlFor="showNutrition" className="cursor-pointer">Show Nutritional Info</Label>
                    <p className="text-xs text-gray-400 mt-0.5">Display calories & macros on menu items</p>
                  </div>
                  <Switch
                    id="showNutrition"
                    checked={form.showNutritionalInfo}
                    onCheckedChange={v => set('showNutritionalInfo', v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
};
