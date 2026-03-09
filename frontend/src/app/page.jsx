"use client";

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Stack,
  HStack,
  VStack,
  SimpleGrid,
  Badge,
  Icon,
  useBreakpointValue,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-Time Bidding",
    desc: "Live bid updates via WebSockets. See every bid the moment it happens.",
    color: "#6C63FF",
  },
  {
    icon: "🏆",
    title: "Credit System",
    desc: "Fair credit-based bidding. Credits returned instantly when outbid.",
    color: "#FFD700",
  },
  {
    icon: "🔔",
    title: "Smart Notifications",
    desc: "Get notified when outbid, when you win, or when a new auction goes live.",
    color: "#00D4FF",
  },
  {
    icon: "📊",
    title: "Admin Analytics",
    desc: "Comprehensive reports, live bid monitoring, and auction management.",
    color: "#00E5A0",
  },
  {
    icon: "🔒",
    title: "Secure & Fast",
    desc: "JWT auth, rate limiting, and data sanitization for peace of mind.",
    color: "#FF6B6B",
  },
  {
    icon: "📱",
    title: "Responsive Design",
    desc: "Works seamlessly on desktop, tablet, and mobile devices.",
    color: "#A855F7",
  },
];

const STATS = [
  { label: "Active Auctions", value: "200+" },
  { label: "Registered Bidders", value: "5,000+" },
  { label: "Bids Placed", value: "50K+" },
  { label: "Total Winnings", value: "$2M+" },
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(isAdmin ? "/admin" : "/dashboard");
    }
  }, [isAuthenticated, isAdmin, router]);

  return (
    <Box bg='dark.900' minH='100vh' overflow='hidden'>
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <Box
        position='fixed'
        top={0}
        left={0}
        right={0}
        zIndex={100}
        bg='rgba(10,10,15,0.85)'
        backdropFilter='blur(20px)'
        borderBottom='1px solid'
        borderColor='whiteAlpha.100'
      >
        <Container maxW='7xl'>
          <Flex h={16} align='center' justify='space-between'>
            <HStack spacing={2}>
              <Text fontSize='2xl'>🔨</Text>
              <Heading size='md' className='gradient-text'>
                BidVerse
              </Heading>
            </HStack>
            <HStack spacing={3}>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => router.push("/auth/login")}
              >
                Login
              </Button>
              <Button
                variant='gold'
                size='sm'
                onClick={() => router.push("/auth/register")}
              >
                Join Free
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <Box
        pt={{ base: 32, md: 40 }}
        pb={{ base: 20, md: 28 }}
        position='relative'
        overflow='hidden'
      >
        {/* Background gradient orbs */}
        <Box
          position='absolute'
          top={-20}
          left={-20}
          w='600px'
          h='600px'
          bg='brand.500'
          opacity={0.05}
          borderRadius='full'
          filter='blur(120px)'
        />
        <Box
          position='absolute'
          bottom={-20}
          right={-20}
          w='500px'
          h='500px'
          bg='cyber.500'
          opacity={0.05}
          borderRadius='full'
          filter='blur(120px)'
        />

        <Container maxW='5xl' textAlign='center' position='relative'>
          <MotionBox
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Badge
              bg='whiteAlpha.100'
              color='brand.300'
              border='1px solid'
              borderColor='brand.500'
              px={4}
              py={1}
              borderRadius='full'
              fontSize='sm'
              mb={6}
              letterSpacing='wide'
            >
              🔴 LIVE AUCTIONS NOW
            </Badge>

            <Heading
              fontSize={{ base: "4xl", md: "6xl", lg: "7xl" }}
              fontWeight={900}
              lineHeight={1.1}
              mb={6}
            >
              The Future of{" "}
              <Text as='span' className='gradient-text'>
                Live Auctions
              </Text>
            </Heading>

            <Text
              fontSize={{ base: "lg", md: "xl" }}
              color='whiteAlpha.700'
              maxW='600px'
              mx='auto'
              mb={10}
              lineHeight={1.8}
            >
              Bid in real time, track your credits, and win exclusive items —
              all on one professional platform built for serious bidders.
            </Text>

            <Stack
              direction={{ base: "column", sm: "row" }}
              spacing={4}
              justify='center'
            >
              <Button
                variant='gold'
                size='lg'
                px={10}
                fontSize='md'
                onClick={() => router.push("/auth/register")}
              >
                Start Bidding Free
              </Button>
              <Button
                variant='outline'
                size='lg'
                px={10}
                fontSize='md'
                onClick={() => router.push("/auth/login")}
              >
                Admin Login
              </Button>
            </Stack>
          </MotionBox>

          {/* Animated auction preview card */}
          <MotionBox
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
            mt={16}
            className='float-animation'
          >
            <Box
              className='glass-card'
              maxW='480px'
              mx='auto'
              p={6}
              textAlign='left'
            >
              <Flex justify='space-between' align='center' mb={4}>
                <Badge colorScheme='green' px={3} py={1} borderRadius='full'>
                  🟢 LIVE
                </Badge>
                <Text color='whiteAlpha.500' fontSize='sm'>
                  Ends in
                </Text>
              </Flex>
              <HStack spacing={4} mb={4}>
                <Box
                  w='70px'
                  h='70px'
                  bg='linear-gradient(135deg, #6C63FF, #00D4FF)'
                  borderRadius='xl'
                  flexShrink={0}
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  fontSize='2xl'
                >
                  💎
                </Box>
                <Box>
                  <Heading size='sm' mb={1}>
                    Vintage Diamond Ring
                  </Heading>
                  <Text color='whiteAlpha.500' fontSize='sm'>
                    Category: Jewelry
                  </Text>
                </Box>
              </HStack>
              <Flex justify='space-between' align='center'>
                <Box>
                  <Text color='whiteAlpha.500' fontSize='xs' mb={1}>
                    CURRENT BID
                  </Text>
                  <Text
                    fontSize='2xl'
                    fontWeight={800}
                    className='gradient-gold'
                  >
                    2,450{" "}
                    <Text as='span' fontSize='sm'>
                      credits
                    </Text>
                  </Text>
                </Box>
                <Box textAlign='right'>
                  <Text color='whiteAlpha.500' fontSize='xs' mb={1}>
                    TIME LEFT
                  </Text>
                  <Text
                    fontSize='xl'
                    fontWeight={700}
                    color='red.400'
                    className='pulse-red'
                  >
                    00:04:32
                  </Text>
                </Box>
              </Flex>
              <Box
                mt={4}
                h='2px'
                bg='dark.600'
                borderRadius='full'
                overflow='hidden'
              >
                <MotionBox
                  h='100%'
                  bg='linear-gradient(90deg, #6C63FF, #00D4FF)'
                  borderRadius='full'
                  initial={{ width: "100%" }}
                  animate={{ width: "15%" }}
                  transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </Box>
            </Box>
          </MotionBox>
        </Container>
      </Box>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <Box
        py={16}
        bg='dark.800'
        borderY='1px solid'
        borderColor='whiteAlpha.100'
      >
        <Container maxW='5xl'>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8}>
            {STATS.map((stat, i) => (
              <MotionBox
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                textAlign='center'
              >
                <Text
                  fontSize={{ base: "3xl", md: "4xl" }}
                  fontWeight={900}
                  className='gradient-text'
                >
                  {stat.value}
                </Text>
                <Text color='whiteAlpha.600' fontSize='sm' mt={1}>
                  {stat.label}
                </Text>
              </MotionBox>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <Box py={24}>
        <Container maxW='6xl'>
          <VStack spacing={4} mb={16} textAlign='center'>
            <Heading fontSize={{ base: "3xl", md: "4xl" }} fontWeight={800}>
              Everything You Need to{" "}
              <Text as='span' className='gradient-text'>
                Win Big
              </Text>
            </Heading>
            <Text color='whiteAlpha.600' maxW='500px' lineHeight={1.8}>
              A complete auction ecosystem with real-time updates, smart
              credits, and powerful admin tools.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {FEATURES.map((feature, i) => (
              <MotionBox
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <Box
                  className='glass-card'
                  p={6}
                  h='100%'
                  _hover={{ borderColor: feature.color }}
                  transition='all 0.3s'
                >
                  <Text fontSize='3xl' mb={4}>
                    {feature.icon}
                  </Text>
                  <Heading size='sm' mb={3} color='white'>
                    {feature.title}
                  </Heading>
                  <Text color='whiteAlpha.600' fontSize='sm' lineHeight={1.7}>
                    {feature.desc}
                  </Text>
                </Box>
              </MotionBox>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <Box py={24} position='relative' overflow='hidden'>
        <Box
          position='absolute'
          inset={0}
          bg='linear-gradient(135deg, rgba(108,99,255,0.1) 0%, rgba(0,212,255,0.05) 100%)'
        />
        <Container maxW='3xl' textAlign='center' position='relative'>
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Text fontSize='5xl' mb={6}>
              🔨
            </Text>
            <Heading
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight={800}
              mb={4}
            >
              Ready to Place Your First Bid?
            </Heading>
            <Text color='whiteAlpha.600' mb={8} fontSize='lg'>
              Join thousands of bidders competing in real time. Register free
              and get started today.
            </Text>
            <Button
              variant='gold'
              size='lg'
              px={12}
              fontSize='lg'
              onClick={() => router.push("/auth/register")}
            >
              Create Free Account
            </Button>
          </MotionBox>
        </Container>
      </Box>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <Box py={8} borderTop='1px solid' borderColor='whiteAlpha.100'>
        <Container maxW='6xl'>
          <Flex justify='space-between' align='center' flexWrap='wrap' gap={4}>
            <HStack>
              <Text fontSize='xl'>🔨</Text>
              <Text fontWeight={700} className='gradient-text'>
                BidVerse
              </Text>
            </HStack>
            <Text color='whiteAlpha.400' fontSize='sm'>
              © {new Date().getFullYear()} BidVerse. Professional Auction
              Platform.
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
