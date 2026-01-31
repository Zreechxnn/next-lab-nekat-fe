"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { ReactNode, useEffect, useState } from "react";
import Unauthorized from "./Unauthorized";

interface RoleBasedGuardProps {
  children: ReactNode;
  allowedRoles: string[];
}

export default function RoleBasedGuard({
  children,
  allowedRoles,
}: RoleBasedGuardProps) {
  const { user, isLoading } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading) {
    return null;
  }

  if (!user || !user.role) {
    return null;
  }

  const userRole = user.role.toLowerCase();
  if (!allowedRoles.includes(userRole)) {
    return <Unauthorized />;
  }

  return <>{children}</>;
}