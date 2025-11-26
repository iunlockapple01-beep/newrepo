'use client';
import {
  useAuth,
  useUser,
  useFirebase,
  signInWithGoogle,
  signOut,
} from '@/firebase';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LogIn, LogOut } from 'lucide-react';

export function LoginButton() {
  const { auth, firestore } = useFirebase();
  const { data: user } = useUser();

  const handleSignIn = async () => {
    await signInWithGoogle(auth, firestore);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL!} alt={user.displayName!} />
              <AvatarFallback>
                {user.displayName?.[0] || user.email?.[0]}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.displayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={handleSignIn} className="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium">
      <LogIn className="mr-2 h-4 w-4" />
      Login
    </Button>
  );
}
