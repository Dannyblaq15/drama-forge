'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, 
  Layout, 
  Video, 
  Scissors, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Script Generator', href: '/studio/script', icon: FileText },
  { name: 'Story Board', href: '/studio/story-board', icon: Layout },
  { name: 'Video Gen', href: '/studio/video-gen', icon: Video },
  { name: 'Editing', href: '/studio/editing', icon: Scissors },
  { name: 'Production', href: '/studio/production', icon: Settings },
  { name: 'Profile', href: '/studio/profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "relative flex flex-col border-r border-border bg-background transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Sidebar Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 shadow-sm">
              <img src="/logo.svg" className="h-5 w-5 animate-pulse" alt="DramaForge Logo" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              DramaForge
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 shadow-sm">
            <img src="/logo.svg" className="h-5 w-5" alt="DramaForge Logo" />
          </Link>
        )}
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-md hover:bg-muted z-50"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed ? "justify-center" : "justify-start"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "mr-3 h-5 w-5")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile / Settings */}
      <div className="border-t border-border p-4">
        <Link 
          href="/studio/profile"
          className={cn("flex items-center cursor-pointer hover:opacity-85 transition", collapsed ? "justify-center" : "gap-3")}
        >
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
            US
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-foreground truncate">User Studio</span>
              <span className="text-xs text-muted-foreground truncate">Developer Account</span>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
