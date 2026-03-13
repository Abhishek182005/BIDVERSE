import { extendTheme } from "@chakra-ui/react";

const colors = {
  brand: {
    50: "#e6f0ff",
    100: "#b3d4ff",
    200: "#80b8ff",
    300: "#4d9cff",
    400: "#2b85ff",
    500: "#1D72F5", // primary blue
    600: "#155dc7",
    700: "#0e4799",
    800: "#08306b",
    900: "#031a3d",
  },
  gold: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#FFD700", // auction gold
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  cyber: {
    50: "#e6fbff",
    100: "#b3f3ff",
    200: "#80ebff",
    300: "#4de3ff",
    400: "#1adbff",
    500: "#00D4FF", // cyan accent
    600: "#00aace",
    700: "#00809e",
    800: "#00556d",
    900: "#002b3d",
  },
  dark: {
    50: "#f7f7f8",
    100: "#e9e9ed",
    200: "#d0d0d8",
    300: "#a8a8bc",
    400: "#7070909",
    500: "#4a4a6a",
    600: "#2a2a3e",
    700: "#1E1E2E", // card bg
    800: "#12121A", // panel bg
    900: "#0A0A0F", // page bg
  },
};

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  colors,
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  styles: {
    global: {
      "html, body": {
        bg: "dark.900",
        color: "whiteAlpha.900",
        minH: "100vh",
      },
      "::-webkit-scrollbar": { width: "6px", height: "6px" },
      "::-webkit-scrollbar-track": { bg: "dark.800" },
      "::-webkit-scrollbar-thumb": { bg: "dark.600", borderRadius: "3px" },
      "::-webkit-scrollbar-thumb:hover": { bg: "brand.500" },
      "::selection": { bg: "brand.500", color: "white" },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 600,
        borderRadius: "lg",
        _focus: { boxShadow: "0 0 0 3px rgba(108, 99, 255, 0.4)" },
      },
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === "brand" ? "brand.500" : undefined,
          color: "white",
          _hover: {
            bg: props.colorScheme === "brand" ? "brand.400" : undefined,
            transform: "translateY(-1px)",
            boxShadow: "0 4px 20px rgba(108, 99, 255, 0.4)",
          },
          _active: { transform: "translateY(0)" },
          transition: "all 0.2s",
        }),
        ghost: {
          _hover: { bg: "whiteAlpha.100" },
        },
        outline: {
          borderColor: "brand.500",
          color: "brand.400",
          _hover: { bg: "brand.500", color: "white" },
        },
        gold: {
          bg: "gold.500",
          color: "dark.900",
          fontWeight: 700,
          _hover: {
            bg: "gold.400",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 20px rgba(255, 215, 0, 0.4)",
          },
          _active: { transform: "translateY(0)" },
          transition: "all 0.2s",
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: "dark.700",
          border: "1px solid",
          borderColor: "whiteAlpha.100",
          borderRadius: "xl",
          overflow: "hidden",
          transition: "all 0.3s",
          _hover: {
            borderColor: "brand.500",
            boxShadow: "0 8px 32px rgba(108, 99, 255, 0.15)",
          },
        },
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: "dark.800",
            border: "1px solid",
            borderColor: "whiteAlpha.200",
            color: "white",
            _hover: { bg: "dark.700", borderColor: "brand.500" },
            _focus: {
              bg: "dark.700",
              borderColor: "brand.500",
              boxShadow: "0 0 0 1px #6C63FF",
            },
            _placeholder: { color: "whiteAlpha.400" },
          },
        },
      },
      defaultProps: { variant: "filled" },
    },
    Textarea: {
      variants: {
        filled: {
          bg: "dark.800",
          border: "1px solid",
          borderColor: "whiteAlpha.200",
          color: "white",
          _hover: { bg: "dark.700", borderColor: "brand.500" },
          _focus: {
            bg: "dark.700",
            borderColor: "brand.500",
            boxShadow: "0 0 0 1px #6C63FF",
          },
          _placeholder: { color: "whiteAlpha.400" },
        },
      },
      defaultProps: { variant: "filled" },
    },
    Select: {
      variants: {
        filled: {
          field: {
            bg: "dark.800",
            borderColor: "whiteAlpha.200",
            color: "white",
            _hover: { bg: "dark.700", borderColor: "brand.500" },
            _focus: { bg: "dark.700", borderColor: "brand.500" },
          },
        },
      },
      defaultProps: { variant: "filled" },
    },
    Badge: {
      variants: {
        active: {
          bg: "green.500",
          color: "white",
          px: 3,
          py: 1,
          borderRadius: "full",
        },
        pending: {
          bg: "yellow.500",
          color: "dark.900",
          px: 3,
          py: 1,
          borderRadius: "full",
        },
        ended: {
          bg: "gray.600",
          color: "white",
          px: 3,
          py: 1,
          borderRadius: "full",
        },
        cancelled: {
          bg: "red.500",
          color: "white",
          px: 3,
          py: 1,
          borderRadius: "full",
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: "dark.700",
          border: "1px solid",
          borderColor: "whiteAlpha.200",
        },
        overlay: { bg: "blackAlpha.700", backdropFilter: "blur(4px)" },
        header: { color: "white" },
        body: { color: "whiteAlpha.900" },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: "dark.700",
          border: "1px solid",
          borderColor: "whiteAlpha.200",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        },
        item: {
          bg: "transparent",
          color: "whiteAlpha.900",
          _hover: { bg: "whiteAlpha.100" },
        },
      },
    },
    Divider: {
      baseStyle: { borderColor: "whiteAlpha.200" },
    },
    Tooltip: {
      baseStyle: {
        bg: "dark.600",
        color: "white",
        border: "1px solid",
        borderColor: "whiteAlpha.200",
        borderRadius: "md",
      },
    },
  },
  shadows: {
    brand: "0 0 20px rgba(108, 99, 255, 0.3)",
    gold: "0 0 20px rgba(255, 215, 0, 0.3)",
    cyber: "0 0 20px rgba(0, 212, 255, 0.3)",
  },
});

export default theme;
