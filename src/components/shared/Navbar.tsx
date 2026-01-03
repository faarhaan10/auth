"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import useAuth from "@/hooks/useAuth";
import Button from "../ui/Button";

const routes = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },

  // protected routes
  { name: "Dashboard", href: "/dashboard", isProtected: true, },
  { name: "Users", href: "/dashboard/users", isProtected: true, },
  { name: "Admins", href: "/dashboard/admins", isProtected: true, },

  { name: "Login", href: "/login", hideOnLogin: true, },
  { name: 'Register', href: '/register', hideOnLogin: true, },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn, loading,token,setToken,logout } = useAuth();

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 shadow-sm">
      <h1 className="text-3xl text-rose-600">
        <Link href="/">
          <Logo />
        </Link>
      </h1>
      <div className="flex gap-8">
        <Button size="sm" onClick={()=> setToken(null)}>
          {token? '🏴‍☠️':'❌'}
        </Button>
        {routes.map((route) => {
          if (route.hideOnLogin && isLoggedIn) return null;
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.name}
              href={route.href}
              className={cn(
                "transition-all transition-discrete",
                isActive
                  ? "text-rose-600"
                  : "hover:text-rose-400"
              )}
            >
              {route.name}
            </Link>
          );
        })}

        {isLoggedIn && !loading && (
          <Button size="sm" onClick={logout}>
            Logout
          </Button>
        )}
      </div>
    </div>
  );
}
