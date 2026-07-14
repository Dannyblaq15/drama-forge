'use client';

import { Bell, Search, LogOut, User as UserIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  
  // Format pathname into breadcrumb
  const breadcrumb = pathname.split('/').filter(Boolean).map(s => 
    s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')
  );

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <div className="flex items-center flex-1">
        <div className="flex items-center text-sm text-muted-foreground">
          {breadcrumb.map((crumb, index) => (
            <span key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              <span className={index === breadcrumb.length - 1 ? 'text-foreground font-medium' : ''}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Search Input (Placeholder) */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="h-9 w-64 rounded-md border border-input bg-background px-8 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        
        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border border-background"></span>
        </button>
 
        {/* User Profile */}
        <Link href="/studio/profile" className="flex items-center gap-3 pl-4 border-l border-border cursor-pointer hover:opacity-85">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium leading-none">{user?.displayName || 'User'}</span>
            <span className="text-xs text-muted-foreground mt-1">{user?.email}</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserIcon className="h-5 w-5" />
          </div>
        </Link>

        {/* User Action */}
        <button 
          onClick={async () => {
            await signOut(auth);
            router.push('/login');
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted text-muted-foreground ml-2"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
