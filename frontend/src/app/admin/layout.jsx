"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@chakra-ui/react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import Navbar from "@/components/ui/Navbar";

export default function AdminLayout({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const { joinAdmin } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/auth/login");
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      joinAdmin();
    }
  }, [isAdmin, joinAdmin]);

  if (loading || !user || !isAdmin) return null;

  return (
    <Box minH='100vh' bg='dark.900'>
      <Navbar />
      <Box pt={16}>{children}</Box>
    </Box>
  );
}
