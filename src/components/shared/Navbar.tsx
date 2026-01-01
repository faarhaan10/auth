"use client";

import { cn } from "@/lib/utils"; 
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const routes = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },

  // protected routes
  { name: "Dashboard", href: "/dashboard" },
  { name: "Users", href: "/dashboard/users" },
  { name: "Admins", href: "/dashboard/admins" },

  { name: "Login", href: "/login" },
  // {name: 'Register', href: '/register'},
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 shadow-sm">
      <h1 className="text-3xl text-rose-600">
        <Link href="/">
          <Logo />
        </Link>
      </h1>
      <div className="flex gap-8">
        {routes.map((route) => {
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
      </div>
    </div>
  );
}
