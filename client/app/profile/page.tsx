"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Calendar, Shield, Settings, LogOut, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from '../../contexts/SessionContext';

export default function ProfilePage() {
    const router = useRouter();
    const { isLoggedIn, currentUser, logout } = useSession();

    // Redirect to login if not authenticated
    React.useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, router]);

    if (!isLoggedIn || !currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    const getUserInitials = (name: string | null | undefined): string => {
        if (!name) return 'TU';
        return name.split(' ').map((word: string) => word[0]).join('').toUpperCase();
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="h-screen overflow-y-auto bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-10 w-10"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                            <p className="text-muted-foreground">Manage your account settings and preferences</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* User Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                User Information
                            </CardTitle>
                            <CardDescription>Your basic account details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                                        {currentUser.avatarUrl ? (
                                            <img src={currentUser.avatarUrl} alt={currentUser.username || 'User'} className="h-full w-full object-cover" />
                                        ) : (
                                            getUserInitials(currentUser.username)
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{currentUser.username || 'FlowZen User'}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {currentUser.email}
                                    </p>
                                    {currentUser.authProvider && (
                                        <Badge variant="outline" className="mt-2 text-xs capitalize">
                                            Via {currentUser.authProvider}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        Joined: {new Date(Number(currentUser.createdAt) || currentUser.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Status: Active</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Settings Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Account Settings
                            </CardTitle>
                            <CardDescription>Configure your account preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium">Email Notifications</h4>
                                        <p className="text-sm text-muted-foreground">Receive updates about your account</p>
                                    </div>
                                    <Button variant="outline" size="sm">Configure</Button>
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium">Security</h4>
                                        <p className="text-sm text-muted-foreground">Manage your password and security settings</p>
                                    </div>
                                    <Button variant="outline" size="sm">Manage</Button>
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <h4 className="font-medium">Privacy</h4>
                                        <p className="text-sm text-muted-foreground">Control your data and privacy settings</p>
                                    </div>
                                    <Button variant="outline" size="sm">Settings</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscription Status Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Status</CardTitle>
                            <CardDescription>Your current plan and billing information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                                        Free Plan
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">Basic features included</span>
                                </div>
                                <Button variant="outline">Upgrade</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => router.push('/dashboard')}>
                            Back to Dashboard
                        </Button>
                        <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
