import React from 'react';
import { Button } from '@/components/ui/button';
import { Coins, Trophy, Settings, User as UserIcon, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { User } from '@supabase/supabase-js';

interface GameHeaderProps {
  balance?: number;
  demoMode?: boolean;
}

const UserNav = ({ user, signOut }: { user: User; signOut: () => Promise<any> }) => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    await signOut();
  };

  if (isMobile) {
    return (
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button size="sm" variant="ghost" className="p-2">
            <UserIcon className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Mon Compte</SheetTitle>
            <SheetDescription>{user.email}</SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <Button
              onClick={handleSignOut}
              className="w-full justify-start"
              variant="ghost"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="p-2">
          <UserIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function GameHeader({ balance = 0, demoMode = true }: GameHeaderProps) {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="w-full gaming-card p-4 mb-6">
      <div className="flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold gaming-text-gradient">GameWin</h1>
            <p className="text-xs text-muted-foreground">Jeux Rémunérés</p>
          </div>
        </div>

        {/* Balance & Mode */}
        <div className="flex items-center space-x-4">
          <div className="gaming-card px-4 py-2 border border-secondary/20">
            <div className="flex items-center space-x-2">
              <Coins className="w-4 h-4 text-secondary" />
              <div className="text-right">
                <div className="text-sm font-semibold text-secondary">
                  {balance.toLocaleString()} FCFA
                </div>
                <div className="text-xs text-muted-foreground">
                  {demoMode ? '(Demo)' : 'Réel'}
                </div>
              </div>
            </div>
          </div>

          {/* User Menu */}
          {!loading && user && (
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="p-2">
                <Settings className="w-4 h-4" />
              </Button>
              <UserNav user={user} signOut={signOut} />
            </div>
          )}
        </div>
      </div>

      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="mt-4 p-3 rounded-lg bg-gradient-accent/10 border border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-accent">
                🎯 Mode Démonstration Actif
              </p>
              <p className="text-xs text-muted-foreground">
                Gains généreux pour tester - Passez au mode réel pour gagner vraiment !
              </p>
            </div>
            <Button size="sm" className="gaming-button-secondary text-xs px-3">
              Mode Réel
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}