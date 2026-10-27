import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  ConciergeBell,
  Trash2,
  Edit2,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  User,
  MoreVertical,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/apiService';
import { toast } from 'sonner';

interface Waiter {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'waiter' | 'staff';
  status: 'active' | 'inactive';
  joinedDate: string;
}

const DEFAULT_WAITERS: Waiter[] = [
  {
    id: 'w-1',
    username: 'waiter_john',
    email: 'john.doe@bellavista.com',
    name: 'John Doe',
    role: 'waiter',
    status: 'active',
    joinedDate: '2026-04-12',
  },
  {
    id: 'w-2',
    username: 'waiter_sarah',
    email: 'sarah.connor@bellavista.com',
    name: 'Sarah Connor',
    role: 'waiter',
    status: 'active',
    joinedDate: '2026-05-01',
  },
  {
    id: 'w-3',
    username: 'waiter_alex',
    email: 'alex.mercer@bellavista.com',
    name: 'Alex Mercer',
    role: 'waiter',
    status: 'inactive',
    joinedDate: '2026-05-18',
  }
];

export const WaiterManagement: React.FC = () => {
  const { user } = useAuth();
  
  // States
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  
  // Form values
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadLocalWaiters = () => {
    const saved = localStorage.getItem('restaurantWaiters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_WAITERS;
      }
    }
    localStorage.setItem('restaurantWaiters', JSON.stringify(DEFAULT_WAITERS));
    return DEFAULT_WAITERS;
  };

  const fetchWaiters = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.getWaiters();
      const data = response?.data || response;
      
      let waiterArray: any[] = [];
      let isSuccess = false;
      
      if (Array.isArray(data)) {
        waiterArray = data;
        isSuccess = true;
      } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
        waiterArray = data.data;
        isSuccess = true;
      }

      if (isSuccess) {
        const mapped: Waiter[] = waiterArray.map((item: any, index: number) => ({
          id: item.waiterId?.toString() || item.id?.toString() || `w-backend-${index}-${item.username}`,
          username: item.username || '',
          email: item.email || '',
          name: item.name || item.username?.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Waiter',
          role: item.role?.toLowerCase() === 'waiter' ? 'waiter' : 'staff',
          status: item.status || 'active',
          joinedDate: item.createdAt ? item.createdAt.split('T')[0] : (item.joinedDate ? item.joinedDate.split('T')[0] : new Date().toISOString().split('T')[0]),
        }));

        setWaiters(mapped);
        localStorage.setItem('restaurantWaiters', JSON.stringify(mapped));
      } else {
        setWaiters(loadLocalWaiters());
      }
    } catch (err) {
      console.error('Failed to fetch waiters from backend:', err);
      setWaiters(loadLocalWaiters());
    } finally {
      setIsLoading(false);
    }
  };

  // Load waiters from backend on mount
  useEffect(() => {
    fetchWaiters();
  }, []);

  const saveWaitersList = (updated: Waiter[]) => {
    setWaiters(updated);
    localStorage.setItem('restaurantWaiters', JSON.stringify(updated));
  };

  // Add Waiter Handler
  const handleAddWaiterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('A valid email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Call real backend API
      const result = await authApi.createWaiter({
        username: username.trim(),
        email: email.trim(),
      });

      console.log('Backend createWaiter response:', result);

      // Save locally
      const newWaiter: Waiter = {
        id: `waiter-${Date.now()}`,
        username: username.trim(),
        email: email.trim(),
        name: username.trim().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        role: 'waiter',
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0],
      };

      const updatedList = [newWaiter, ...waiters];
      saveWaitersList(updatedList);
      
      toast.success(result?.message || 'Waiter created successfully on the server!');
      
      // Reset form
      setUsername('');
      setEmail('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create waiter on server. Waiter added locally.');
      
      // Fallback local save in case of backend server downtime, so UI is still testable
      const newWaiter: Waiter = {
        id: `waiter-${Date.now()}`,
        username: username.trim(),
        email: email.trim(),
        name: username.trim().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        role: 'waiter',
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0],
      };
      saveWaitersList([newWaiter, ...waiters]);
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit/Update Waiter/Admin Profile Handler
  const handleEditWaiterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaiter) return;
    if (!editUsername.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      toast.error('A valid email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // If editing currently logged-in user/admin, call updateProfile API
      const isCurrentUser = selectedWaiter.username === user?.username || selectedWaiter.email === user?.email;
      
      if (isCurrentUser) {
        const result = await authApi.updateProfile({
          username: editUsername.trim(),
          name: selectedWaiter.name,
          email: editEmail.trim(),
        });
        console.log('Profile updated via backend:', result);
        toast.success('Your admin profile updated successfully on backend!');
      } else {
        // Otherwise, update simulated waiter locally
        toast.success('Waiter details updated successfully!');
      }

      // Update local state list
      const updatedList = waiters.map(w => {
        if (w.id === selectedWaiter.id) {
          return {
            ...w,
            username: editUsername.trim(),
            email: editEmail.trim(),
            name: editUsername.trim().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          };
        }
        return w;
      });

      saveWaitersList(updatedList);
      setIsEditModalOpen(false);
      setSelectedWaiter(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status Handler
  const handleToggleStatus = (waiterId: string) => {
    const updated = waiters.map(w => {
      if (w.id === waiterId) {
        const newStatus = w.status === 'active' ? 'inactive' : 'active';
        toast.success(`Waiter "${w.name}" set to ${newStatus}`);
        return { ...w, status: newStatus as 'active' | 'inactive' };
      }
      return w;
    });
    saveWaitersList(updated);
  };

  // Delete Waiter Handler
  const handleDeleteWaiter = (waiterId: string) => {
    const waiterToDelete = waiters.find(w => w.id === waiterId);
    if (!waiterToDelete) return;
    
    const updated = waiters.filter(w => w.id !== waiterId);
    saveWaitersList(updated);
    toast.success(`Waiter "${waiterToDelete.name}" removed successfully.`);
  };

  // Open Edit Modal
  const openEditModal = (waiter: Waiter) => {
    setSelectedWaiter(waiter);
    setEditUsername(waiter.username);
    setEditEmail(waiter.email);
    setIsEditModalOpen(true);
  };

  // Filtered List
  const filteredWaiters = waiters.filter(w => {
    const matchesSearch = 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && w.status === statusFilter;
  });

  // Stats Derived
  const totalCount = waiters.length;
  const activeCount = waiters.filter(w => w.status === 'active').length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <ConciergeBell className="w-7 h-7 text-accent" />
            Staff Management
          </h1>
          <p className="text-sm text-gray-500">Add waitstaff and manage accounts for tables and orders assistance.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={fetchWaiters}
            disabled={isLoading}
            className="rounded-xl px-4 h-11 font-bold border-gray-200 text-gray-600 flex items-center gap-2"
          >
            <Clock className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Staff
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl px-5 h-11 font-bold shadow-md shadow-accent/10 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add New Waiter
          </Button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <Card className="border-gray-200/60 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Staff</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{totalCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="border-gray-200/60 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Waiters</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1 text-green-600">{activeCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="border-gray-200/60 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Inactive/On Break</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1 text-amber-500">{inactiveCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel */}
      <Card className="border-gray-200/60 shadow-sm bg-white rounded-2xl overflow-hidden">
        {/* Filters and Search */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="z-10 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-10 rounded-xl border-gray-200 focus-visible:ring-accent bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filter Status:</span>
            <div className="flex bg-gray-100 p-0.5 rounded-lg">
              {(['all', 'active', 'inactive'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${
                    statusFilter === status
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Waiters List */}
        <div className="overflow-x-auto">
          {isLoading && waiters.length === 0 ? (
            <div className="text-center py-20 px-4 bg-gray-50/20">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-accent border-t-transparent animate-spin" />
                <p className="text-sm font-bold text-gray-800">Loading Waitstaff...</p>
                <p className="text-xs text-gray-400">Connecting to restaurant authentication server</p>
              </div>
            </div>
          ) : filteredWaiters.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/20">
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-wider pl-6">Waiter Info</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-wider">Username</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-wider">Joined Date</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-wider">Status</th>
                  <th className="p-4 text-xs font-black uppercase text-gray-400 tracking-wider pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredWaiters.map((waiter) => (
                    <motion.tr
                      key={waiter.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="border-b border-gray-100 hover:bg-gray-50/30 transition-all align-middle"
                    >
                      {/* Name & Email */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/90 text-accent-foreground font-black flex items-center justify-center shadow-inner">
                            {waiter.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{waiter.name}</p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{waiter.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="p-4">
                        <Badge variant="secondary" className="font-mono text-xs font-bold bg-gray-100 text-gray-600 rounded-md">
                          @{waiter.username}
                        </Badge>
                      </td>

                      {/* Joined Date */}
                      <td className="p-4 text-sm text-gray-500 font-medium">
                        {waiter.joinedDate}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {waiter.status === 'active' ? (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1 w-fit rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase">
                            <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-300 hover:bg-gray-400 text-gray-700 flex items-center gap-1 w-fit rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase">
                            Offline
                          </Badge>
                        )}
                      </td>

                      {/* Action Menu */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Toggle Status"
                            onClick={() => handleToggleStatus(waiter.id)}
                            className={`p-1.5 h-8 w-8 rounded-lg ${
                              waiter.status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'
                            }`}
                          >
                            {waiter.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="p-1 h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              <DropdownMenuLabel className="text-xs">Manage Staff</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEditModal(waiter)} className="text-xs cursor-pointer flex items-center gap-2">
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteWaiter(waiter.id)}
                                className="text-xs cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Waiter
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 px-4 bg-gray-50/20">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No waiters found</h3>
              <p className="text-sm text-gray-400 max-w-xs mx-auto mt-1">
                Try modifying your search or click "+ Add New Waiter" to add waitstaff to this restaurant.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* dialog for Add Waiter */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Add New Waitstaff</DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Enter details below. This will register a new waiter on the system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddWaiterSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="waiter-username" className="text-xs font-bold uppercase text-gray-400">Username</Label>
                <div className="relative">
                  <User className="z-10 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="waiter-username"
                    placeholder="waiter_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-gray-200"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="waiter-email" className="text-xs font-bold uppercase text-gray-400">Email Address</Label>
                <div className="relative">
                  <Mail className="z-10 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="waiter-email"
                    type="email"
                    placeholder="waiter@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-gray-200"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="h-11 rounded-xl font-bold"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90 text-accent-foreground h-11 rounded-xl font-bold px-6 shadow-md shadow-accent/15"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Add Waiter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* dialog for Edit Waiter/Admin Profile */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Edit Profile</DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Update credentials or display details for this staff profile.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditWaiterSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-waiter-username" className="text-xs font-bold uppercase text-gray-400">Username</Label>
                <div className="relative">
                  <User className="z-10 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="edit-waiter-username"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-gray-200"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-waiter-email" className="text-xs font-bold uppercase text-gray-400">Email Address</Label>
                <div className="relative">
                  <Mail className="z-10 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="edit-waiter-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-gray-200"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="h-11 rounded-xl font-bold"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90 text-accent-foreground h-11 rounded-xl font-bold px-6 shadow-md shadow-accent/15"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
