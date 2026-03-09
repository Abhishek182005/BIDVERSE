"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/navigation";
import { Box, Spinner, Center } from "@chakra-ui/react";
import Navbar from "@/components/ui/Navbar";

export default function BidderLayout({ children }) {
  const { user, loading } = useAuth();
  const { connected } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    } else if (!loading && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <Center minH='100vh' bg='dark.900'>
        <Spinner size='xl' color='brand.500' thickness='3px' />
      </Center>
    );
  }

  if (!user || user.role !== "bidder") return null;

  return (
    <>
      <Navbar />
      <Box as='main' pt='64px' minH='100vh' bg='dark.900'>
        {children}
      </Box>
    </>
  );
}
