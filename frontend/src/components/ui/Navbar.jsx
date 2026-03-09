"use client";

import {
  Box,
  Flex,
  HStack,
  Text,
  Heading,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  IconButton,
  Icon,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  VStack,
  Divider,
} from "@chakra-ui/react";
import {
  HamburgerIcon,
  CloseIcon,
  ViewIcon,
  SearchIcon,
  CalendarIcon,
  RepeatClockIcon,
  BellIcon,
  AtSignIcon,
  AttachmentIcon,
  UnlockIcon,
  StarIcon,
} from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import NotificationBell from "./NotificationBell";
import CreditBadge from "./CreditBadge";

const MotionBox = motion(Box);

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: ViewIcon },
  { href: "/admin/auctions", label: "Auctions", icon: CalendarIcon },
  { href: "/admin/users", label: "Bidders", icon: AtSignIcon },
  { href: "/admin/reports", label: "Reports", icon: AttachmentIcon },
];

const bidderLinks = [
  { href: "/dashboard", label: "Dashboard", icon: ViewIcon },
  { href: "/auctions", label: "Browse Auctions", icon: SearchIcon },
  { href: "/history", label: "My Bids", icon: RepeatClockIcon },
  { href: "/notifications", label: "Notifications", icon: BellIcon },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const links = isAdmin ? adminLinks : bidderLinks;

  return (
    <Box
      position='fixed'
      top={0}
      left={0}
      right={0}
      zIndex={100}
      bg='rgba(10,10,15,0.9)'
      backdropFilter='blur(20px)'
      borderBottom='1px solid'
      borderColor='whiteAlpha.100'
    >
      <Flex
        h={16}
        px={{ base: 4, md: 8 }}
        align='center'
        justify='space-between'
        maxW='1400px'
        mx='auto'
      >
        {/* Logo */}
        <Link
          href={isAdmin ? "/admin" : "/dashboard"}
          style={{ textDecoration: "none" }}
        >
          <HStack spacing={2}>
            <StarIcon color='brand.400' boxSize={5} />
            <Heading size='sm' className='gradient-text'>
              BidVerse
            </Heading>
            {isAdmin && (
              <Badge
                colorScheme='purple'
                fontSize='2xs'
                px={2}
                borderRadius='full'
              >
                ADMIN
              </Badge>
            )}
          </HStack>
        </Link>

        {/* Desktop Nav Links */}
        <HStack spacing={1} display={{ base: "none", md: "flex" }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ textDecoration: "none" }}
            >
              <Box
                px={3}
                py={1.5}
                borderRadius='lg'
                fontWeight={500}
                color={pathname === link.href ? "brand.300" : "whiteAlpha.700"}
                bg={pathname === link.href ? "brand.500" + "22" : "transparent"}
                _hover={{ color: "white", bg: "whiteAlpha.100" }}
                transition='all 0.2s'
              >
                <HStack spacing={2}>
                  <Icon as={link.icon} boxSize={3.5} />
                  <Text fontSize='sm'>{link.label}</Text>
                </HStack>
              </Box>
            </Link>
          ))}
        </HStack>

        {/* Right side */}
        <HStack spacing={3}>
          {!isAdmin && user && <CreditBadge credits={user.credits} />}
          {user && <NotificationBell />}

          {/* User menu */}
          <Menu>
            <MenuButton>
              <Avatar
                name={user?.name}
                size='sm'
                bg='brand.500'
                cursor='pointer'
                border='2px solid'
                borderColor='brand.500'
                _hover={{ borderColor: "brand.300" }}
              />
            </MenuButton>
            <MenuList>
              <Box px={4} py={2}>
                <Text fontWeight={600} fontSize='sm'>
                  {user?.name}
                </Text>
                <Text fontSize='xs' color='whiteAlpha.500'>
                  {user?.email}
                </Text>
              </Box>
              <MenuDivider />
              <MenuItem
                icon={<ViewIcon />}
                onClick={() => router.push(isAdmin ? "/admin" : "/dashboard")}
              >
                Dashboard
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<UnlockIcon />} color='red.400' onClick={logout}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Mobile hamburger */}
          <IconButton
            display={{ base: "flex", md: "none" }}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            variant='ghost'
            onClick={isOpen ? onClose : onOpen}
            aria-label='Menu'
          />
        </HStack>
      </Flex>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement='right' onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent
          bg='dark.800'
          borderLeft='1px solid'
          borderColor='whiteAlpha.100'
        >
          <DrawerBody pt={8}>
            <VStack align='stretch' spacing={2}>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{ textDecoration: "none" }}
                  onClick={onClose}
                >
                  <Box
                    p={3}
                    borderRadius='lg'
                    color={
                      pathname === link.href ? "brand.300" : "whiteAlpha.800"
                    }
                    bg={
                      pathname === link.href
                        ? "brand.500" + "22"
                        : "transparent"
                    }
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    <HStack spacing={3}>
                      <Icon as={link.icon} boxSize={4} />
                      <Text fontWeight={500}>{link.label}</Text>
                    </HStack>
                  </Box>
                </Link>
              ))}
              <Divider borderColor='whiteAlpha.100' my={2} />
              <Button
                variant='ghost'
                color='red.400'
                onClick={logout}
                justifyContent='flex-start'
                leftIcon={<UnlockIcon />}
              >
                Logout
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
