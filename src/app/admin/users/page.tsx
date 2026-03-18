'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, ShieldCheck, Loader2, Mail, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import {
  collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc
} from 'firebase/firestore';

interface AdminUser {
  uid: string;
  name?: string;
  email?: string;
  phone?: string;
}

export default function AdminUsersPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingUid, setRemovingUid] = useState<string | null>(null);

  const rolesRef = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'roles_admin');
  }, [db]);

  const { data: adminRoles, isLoading: isRolesLoading } = useCollection(rolesRef);

  useEffect(() => {
    if (isRolesLoading || !adminRoles || !db) return;

    async function fetchUserDetails() {
      setIsLoadingUsers(true);
      const users: AdminUser[] = [];
      for (const role of adminRoles!) {
        try {
          const userDoc = await getDoc(doc(db, 'users', role.id));
          if (userDoc.exists()) {
            const data = userDoc.data();
            users.push({ uid: role.id, name: data.name, email: data.email, phone: data.phone });
          } else {
            users.push({ uid: role.id });
          }
        } catch {
          users.push({ uid: role.id });
        }
      }
      setAdminUsers(users);
      setIsLoadingUsers(false);
    }

    fetchUserDetails();
  }, [adminRoles, isRolesLoading, db]);

  const handleAddAdmin = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setIsAdding(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast({ variant: 'destructive', title: 'User Not Found', description: 'No account found with that email address.' });
        return;
      }

      const userDoc = snapshot.docs[0];
      const uid = userDoc.id;

      if (adminUsers.some(u => u.uid === uid)) {
        toast({ variant: 'destructive', title: 'Already Admin', description: 'This user already has admin access.' });
        return;
      }

      await setDoc(doc(db, 'roles_admin', uid), { grantedAt: new Date().toISOString() });
      toast({ title: 'Access Granted', description: `${userDoc.data().name || email} can now access the admin panel.` });
      setNewEmail('');
    } catch {
      toast({ variant: 'destructive', title: 'Failed', description: 'Could not grant admin access.' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAdmin = async (uid: string, name?: string) => {
    setRemovingUid(uid);
    try {
      await deleteDoc(doc(db, 'roles_admin', uid));
      toast({ title: 'Access Revoked', description: `${name || uid} no longer has admin access.` });
    } catch {
      toast({ variant: 'destructive', title: 'Failed', description: 'Could not revoke admin access.' });
    } finally {
      setRemovingUid(null);
    }
  };

  const isLoading = isRolesLoading || isLoadingUsers;

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Admin Access</h1>
        <p className="text-sm text-muted-foreground">Manage which users can access the admin panel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Admins List */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest">Authorized Admins</CardTitle>
              <CardDescription className="text-xs">Users with full access to this admin panel.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                </div>
              ) : adminUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                  <p className="text-sm font-medium">No admin users configured</p>
                  <p className="text-xs mt-1">Add an email address to grant access.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminUsers.map((admin) => (
                    <div key={admin.uid} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm uppercase">
                          {admin.name?.[0] || admin.email?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{admin.name || 'Unknown User'}</p>
                          <p className="text-xs text-muted-foreground">{admin.email || admin.phone || admin.uid}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-primary/10 text-primary text-[9px] font-bold tracking-widest border-0 uppercase">
                          Admin
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={removingUid === admin.uid}
                          onClick={() => handleRemoveAdmin(admin.uid, admin.name)}
                          className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {removingUid === admin.uid
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add New Admin */}
        <div>
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest">Grant Access</CardTitle>
              <CardDescription className="text-xs">Enter an email address to give admin panel access.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAdmin()}
                    className="h-12 pl-12 rounded-xl border-slate-100 bg-slate-50/50"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddAdmin}
                disabled={isAdding || !newEmail.trim()}
                className="w-full rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {isAdding
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : <UserPlus className="h-4 w-4 mr-2" />
                }
                Grant Admin Access
              </Button>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                  The user must have an existing account with this email address to be granted access.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
