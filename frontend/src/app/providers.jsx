"use client";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { Toaster } from "react-hot-toast";
import theme from "@/theme";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { NotificationProvider } from "@/context/NotificationContext";

export function Providers({ children }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              {children}
              <Toaster
                position='top-right'
                toastOptions={{
                  style: {
                    background: "#1E1E2E",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    fontSize: "14px",
                  },
                  success: {
                    iconTheme: { primary: "#00E5A0", secondary: "#fff" },
                  },
                  error: {
                    iconTheme: { primary: "#FF6B6B", secondary: "#fff" },
                  },
                  duration: 4000,
                }}
              />
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}
