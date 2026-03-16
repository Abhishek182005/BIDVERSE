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
  Divider,
  Avatar,
  AvatarGroup,
} from "@chakra-ui/react";
import {
  BellIcon,
  LockIcon,
  StarIcon,
  TimeIcon,
  TriangleUpIcon,
  CheckCircleIcon,
  ArrowForwardIcon,
  RepeatClockIcon,
  ViewIcon,
} from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionText = motion(Text);

const FEATURES = [
  {
    Icon: TriangleUpIcon,
    title: "Real-Time Bidding",
    desc: "Live bid updates via WebSockets. Every bid reflected instantly across all connected clients.",
    color: "#6C63FF",
    bg: "rgba(108,99,255,0.1)",
  },
  {
    Icon: StarIcon,
    title: "Credit System",
    desc: "Fair credit-based bidding. Credits returned instantly when outbid  zero risk of losing funds.",
    color: "#FFD700",
    bg: "rgba(255,215,0,0.1)",
  },
  {
    Icon: BellIcon,
    title: "Smart Notifications",
    desc: "Instant alerts when outbid, when you win, or when a watched auction is about to close.",
    color: "#00D4FF",
    bg: "rgba(0,212,255,0.1)",
  },
  {
    Icon: ViewIcon,
    title: "Admin Analytics",
    desc: "Comprehensive reports, live bid monitoring, and full auction lifecycle management.",
    color: "#00E5A0",
    bg: "rgba(0,229,160,0.1)",
  },
  {
    Icon: LockIcon,
    title: "Secure & Fast",
    desc: "JWT auth, rate limiting, XSS protection, and sanitization for complete peace of mind.",
    color: "#FF6B6B",
    bg: "rgba(255,107,107,0.1)",
  },
  {
    Icon: RepeatClockIcon,
    title: "Auto-Bidding",
    desc: "Set a max budget and let the system bid for you. Stay ahead even when you're away.",
    color: "#A855F7",
    bg: "rgba(168,85,247,0.1)",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create an Account",
    desc: "Sign up free. Your account comes loaded with starter credits to begin bidding immediately.",
    color: "#6C63FF",
  },
  {
    step: "02",
    title: "Browse Live Auctions",
    desc: "Explore hundreds of active auctions across categories from electronics to rare collectibles.",
    color: "#00D4FF",
  },
  {
    step: "03",
    title: "Place Your Bid",
    desc: "Bid with confidence. Credits are only deducted when you win or outbid? They're returned instantly.",
    color: "#FFD700",
  },
  {
    step: "04",
    title: "Win & Collect",
    desc: "Highest bidder when the clock hits zero wins. Track all your wins in the history dashboard.",
    color: "#00E5A0",
  },
];

const LIVE_BIDS = [
  { user: "Rahul M.", item: "Vintage Rolex", amount: "3,200", time: "2s ago" },
  { user: "Priya S.", item: "MacBook Pro M3", amount: "1,850", time: "8s ago" },
  { user: "Arjun K.", item: "Gold Necklace", amount: "980", time: "15s ago" },
  { user: "Sneha R.", item: "Nike SB Dunk", amount: "610", time: "22s ago" },
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeBid, setActiveBid] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(isAdmin ? "/admin" : "/dashboard");
    }
  }, [isAuthenticated, isAdmin, router]);

  // Cycle through live bid feed
  useEffect(() => {
    const t = setInterval(
      () => setActiveBid((p) => (p + 1) % LIVE_BIDS.length),
      2200,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <Box bg='dark.900' minH='100vh' overflow='hidden'>
      {/* â”€â”€ Navbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
              {/* SVG Gavel logo mark */}
              <Box
                w='32px'
                h='32px'
                bg='linear-gradient(135deg,#6C63FF,#00D4FF)'
                borderRadius='8px'
                display='flex'
                alignItems='center'
                justifyContent='center'
                flexShrink={0}
              >
                <svg width='18' height='18' viewBox='0 0 64 64' fill='none'>
                  <rect
                    x='14'
                    y='12'
                    width='28'
                    height='14'
                    rx='4'
                    transform='rotate(-45 28 19)'
                    fill='white'
                  />
                  <rect
                    x='30'
                    y='34'
                    width='8'
                    height='20'
                    rx='3'
                    transform='rotate(-45 34 44)'
                    fill='rgba(255,255,255,0.7)'
                  />
                </svg>
              </Box>
              <Heading size='md' className='gradient-text'>
                BidVerse
              </Heading>
            </HStack>
            <HStack spacing={3}>
              <Button
                variant='ghost'
                size='sm'
                color='whiteAlpha.900'
                _hover={{ bg: "whiteAlpha.200", color: "white" }}
                onClick={() => router.push("/auth/login")}
              >
                Login
              </Button>
              <Button
                variant='gold'
                size='sm'
                onClick={() => router.push("/auth/register")}
                rightIcon={<ArrowForwardIcon />}
              >
                Join Free
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Box
        pt={{ base: 32, md: 40 }}
        pb={{ base: 16, md: 24 }}
        position='relative'
        overflow='hidden'
      >
        {/* Gradient orbs */}
        <Box
          position='absolute'
          top='-100px'
          left='-100px'
          w='700px'
          h='700px'
          bg='brand.500'
          opacity={0.06}
          borderRadius='full'
          filter='blur(130px)'
        />
        <Box
          position='absolute'
          bottom='-80px'
          right='-80px'
          w='600px'
          h='600px'
          bg='cyber.500'
          opacity={0.06}
          borderRadius='full'
          filter='blur(130px)'
        />
        <Box
          position='absolute'
          top='30%'
          left='50%'
          transform='translateX(-50%)'
          w='400px'
          h='400px'
          bg='gold.400'
          opacity={0.03}
          borderRadius='full'
          filter='blur(100px)'
        />

        <Container maxW='6xl' position='relative'>
          <SimpleGrid
            columns={{ base: 1, lg: 2 }}
            spacing={16}
            alignItems='center'
          >
            {/* Left: Text */}
            <MotionBox
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Badge
                bg='rgba(108,99,255,0.15)'
                color='brand.300'
                border='1px solid'
                borderColor='rgba(108,99,255,0.4)'
                px={4}
                py={1.5}
                borderRadius='full'
                fontSize='xs'
                mb={6}
                letterSpacing='widest'
                display='inline-flex'
                alignItems='center'
                gap={2}
              >
                <Box
                  w='7px'
                  h='7px'
                  bg='green.400'
                  borderRadius='full'
                  display='inline-block'
                  sx={{ animation: "pulse-glow 1.5s ease-in-out infinite" }}
                />
                LIVE AUCTIONS RUNNING NOW
              </Badge>

              <Heading
                fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                fontWeight={900}
                lineHeight={1.08}
                mb={6}
                letterSpacing='-0.02em'
              >
                Bid Smarter.
                <br />
                <Text as='span' className='gradient-text'>
                  Win Bigger.
                </Text>
              </Heading>

              <Text
                fontSize={{ base: "md", md: "lg" }}
                color='whiteAlpha.600'
                mb={8}
                lineHeight={1.9}
                maxW='480px'
              >
                The professional real-time auction platform. Place bids, track
                credits, and compete with thousands of bidders are all live, all
                transparent.
              </Text>

              <Stack
                direction={{ base: "column", sm: "row" }}
                spacing={3}
                mb={10}
              >
                <Button
                  variant='gold'
                  size='lg'
                  px={8}
                  fontSize='md'
                  rightIcon={<ArrowForwardIcon />}
                  onClick={() => router.push("/auth/register")}
                >
                  Start Bidding Free
                </Button>
                <Button
                  variant='outline'
                  size='lg'
                  px={8}
                  fontSize='md'
                  onClick={() => router.push("/auth/login")}
                >
                  Sign In
                </Button>
              </Stack>

              {/* Social proof */}
              <HStack spacing={4}>
                <AvatarGroup size='sm' max={4} spacing='-8px'>
                  {["RA", "PK", "MJ", "SV", "AT"].map((n) => (
                    <Avatar key={n} name={n} bg='brand.600' size='sm' />
                  ))}
                </AvatarGroup>
                <Box>
                  <HStack spacing={1} mb={0.5}>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} boxSize={3} color='gold.400' />
                    ))}
                  </HStack>
                  <Text fontSize='xs' color='whiteAlpha.500'>
                    Trusted by{" "}
                    <Text as='span' color='white' fontWeight={600}>
                      5,000+
                    </Text>{" "}
                    bidders
                  </Text>
                </Box>
              </HStack>
            </MotionBox>

            {/* Right: Live preview card + bid feed */}
            <MotionBox
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              display={{ base: "none", lg: "block" }}
            >
              {/* Main auction card */}
              <Box className='glass-card float-animation' p={5} mb={4}>
                <Flex justify='space-between' align='center' mb={5}>
                  <Badge
                    colorScheme='green'
                    px={3}
                    py={1}
                    borderRadius='full'
                    display='inline-flex'
                    alignItems='center'
                    gap={2}
                  >
                    <Box
                      w='6px'
                      h='6px'
                      bg='green.300'
                      borderRadius='full'
                      display='inline-block'
                      sx={{ animation: "pulse-glow 1.5s ease-in-out infinite" }}
                    />
                    LIVE
                  </Badge>
                  <HStack spacing={1}>
                    <TimeIcon boxSize={3} color='whiteAlpha.400' />
                    <Text fontSize='xs' color='whiteAlpha.400'>
                      Ends in
                    </Text>
                    <Text
                      fontSize='xs'
                      color='red.400'
                      fontWeight={700}
                      className='pulse-red'
                    >
                      04:32
                    </Text>
                  </HStack>
                </Flex>

                <HStack spacing={4} mb={5}>
                  <Box
                    w='64px'
                    h='64px'
                    flexShrink={0}
                    borderRadius='xl'
                    bg='linear-gradient(135deg,#6C63FF 0%,#00D4FF 100%)'
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                  >
                    <StarIcon boxSize={6} color='white' />
                  </Box>
                  <Box>
                    <Text fontWeight={700} mb={0.5}>
                      Vintage Diamond Ring
                    </Text>
                    <Badge variant='subtle' colorScheme='purple' fontSize='2xs'>
                      Jewellery
                    </Badge>
                  </Box>
                </HStack>

                <Flex justify='space-between' align='flex-end' mb={4}>
                  <Box>
                    <Text
                      color='whiteAlpha.400'
                      fontSize='2xs'
                      mb={1}
                      letterSpacing='wider'
                    >
                      CURRENT BID
                    </Text>
                    <Text
                      fontSize='2xl'
                      fontWeight={900}
                      className='gradient-gold'
                    >
                      2,450{" "}
                      <Text as='span' fontSize='sm' fontWeight={400}>
                        cr
                      </Text>
                    </Text>
                  </Box>
                  <Box textAlign='right'>
                    <Text
                      color='whiteAlpha.400'
                      fontSize='2xs'
                      mb={1}
                      letterSpacing='wider'
                    >
                      BIDDERS
                    </Text>
                    <Text fontSize='xl' fontWeight={700} color='brand.300'>
                      24
                    </Text>
                  </Box>
                </Flex>

                {/* Progress bar */}
                <Box
                  h='3px'
                  bg='dark.600'
                  borderRadius='full'
                  overflow='hidden'
                >
                  <MotionBox
                    h='100%'
                    bg='linear-gradient(90deg,#6C63FF,#00D4FF)'
                    borderRadius='full'
                    initial={{ width: "100%" }}
                    animate={{ width: "12%" }}
                    transition={{
                      duration: 30,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </Box>
              </Box>

              {/* Live bid feed */}
              <Box className='glass-card' p={4}>
                <HStack mb={3} spacing={2}>
                  <Box
                    w='6px'
                    h='6px'
                    bg='green.400'
                    borderRadius='full'
                    sx={{ animation: "pulse-glow 1.5s ease-in-out infinite" }}
                  />
                  <Text
                    fontSize='xs'
                    fontWeight={600}
                    color='whiteAlpha.600'
                    letterSpacing='wider'
                  >
                    LIVE BID FEED
                  </Text>
                </HStack>
                <VStack spacing={0} align='stretch'>
                  <AnimatePresence mode='popLayout'>
                    {LIVE_BIDS.map((bid, i) => (
                      <MotionBox
                        key={`${bid.user}-${i}`}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: i === activeBid ? 1 : 0.45, x: 0 }}
                        transition={{ duration: 0.35 }}
                      >
                        <HStack
                          py={2}
                          borderBottom={
                            i < LIVE_BIDS.length - 1 ? "1px solid" : "none"
                          }
                          borderColor='whiteAlpha.50'
                          bg={
                            i === activeBid
                              ? "rgba(108,99,255,0.08)"
                              : "transparent"
                          }
                          borderRadius='md'
                          px={2}
                          transition='all 0.3s'
                        >
                          <Avatar
                            name={bid.user}
                            size='xs'
                            bg='brand.500'
                            flexShrink={0}
                          />
                          <Text fontSize='xs' flex={1} noOfLines={1}>
                            <Text as='span' fontWeight={600}>
                              {bid.user}
                            </Text>{" "}
                            <Text as='span' color='whiteAlpha.500'>
                              bid on
                            </Text>{" "}
                            {bid.item}
                          </Text>
                          <VStack spacing={0} align='flex-end'>
                            <Text
                              fontSize='xs'
                              fontWeight={700}
                              color='gold.400'
                            >
                              {bid.amount} cr
                            </Text>
                            <Text fontSize='2xs' color='whiteAlpha.300'>
                              {bid.time}
                            </Text>
                          </VStack>
                        </HStack>
                      </MotionBox>
                    ))}
                  </AnimatePresence>
                </VStack>
              </Box>
            </MotionBox>
          </SimpleGrid>
        </Container>
      </Box>
      {/*  How It Works */}
      <Box py={24}>
        <Container maxW='6xl'>
          <VStack spacing={3} mb={16} textAlign='center'>
            <Text
              fontSize='xs'
              color='brand.400'
              fontWeight={700}
              letterSpacing='widest'
            >
              SIMPLE PROCESS
            </Text>
            <Heading fontSize={{ base: "3xl", md: "4xl" }} fontWeight={800}>
              How{" "}
              <Text as='span' className='gradient-text'>
                BidVerse
              </Text>{" "}
              Works
            </Heading>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {HOW_IT_WORKS.map((step, i) => (
              <MotionBox
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <Box position='relative' h='100%'>
                  {/* Connector line */}
                  {i < HOW_IT_WORKS.length - 1 && (
                    <Box
                      display={{ base: "none", lg: "block" }}
                      position='absolute'
                      top='28px'
                      right='-50%'
                      w='70%'
                      h='1px'
                      bg='linear-gradient(90deg, rgba(108,99,255,0.4), transparent)'
                      zIndex={0}
                    />
                  )}
                  <Box
                    bg='dark.700'
                    border='1px solid'
                    borderColor='whiteAlpha.100'
                    borderRadius='xl'
                    p={5}
                    h='100%'
                    _hover={{
                      borderColor: step.color,
                      transform: "translateY(-4px)",
                    }}
                    transition='all 0.3s'
                    position='relative'
                    zIndex={1}
                  >
                    <Text
                      fontSize='3xl'
                      fontWeight={900}
                      mb={3}
                      style={{
                        background: `linear-gradient(135deg, ${step.color}, transparent)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {step.step}
                    </Text>
                    <Text fontWeight={700} mb={2} fontSize='sm'>
                      {step.title}
                    </Text>
                    <Text color='whiteAlpha.500' fontSize='xs' lineHeight={1.8}>
                      {step.desc}
                    </Text>
                  </Box>
                </Box>
              </MotionBox>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/*  Features  */}
      <Box
        py={24}
        bg='dark.800'
        borderY='1px solid'
        borderColor='whiteAlpha.100'
      >
        <Container maxW='6xl'>
          <VStack spacing={3} mb={16} textAlign='center'>
            <Text
              fontSize='xs'
              color='brand.400'
              fontWeight={700}
              letterSpacing='widest'
            >
              PLATFORM FEATURES
            </Text>
            <Heading fontSize={{ base: "3xl", md: "4xl" }} fontWeight={800}>
              Everything You Need to{" "}
              <Text as='span' className='gradient-text'>
                Win Big
              </Text>
            </Heading>
            <Text
              color='whiteAlpha.500'
              maxW='480px'
              lineHeight={1.8}
              fontSize='sm'
            >
              A complete auction ecosystem with real-time updates, smart
              credits, and powerful tools for both bidders and admins.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {FEATURES.map((feature, i) => (
              <MotionBox
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Box
                  bg='dark.700'
                  border='1px solid'
                  borderColor='whiteAlpha.100'
                  borderRadius='xl'
                  p={6}
                  h='100%'
                  _hover={{ borderColor: feature.color }}
                  transition='all 0.3s'
                >
                  <Box
                    w='44px'
                    h='44px'
                    bg={feature.bg}
                    borderRadius='xl'
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    mb={4}
                  >
                    <feature.Icon boxSize={5} color={feature.color} />
                  </Box>
                  <Text fontWeight={700} mb={2} fontSize='sm'>
                    {feature.title}
                  </Text>
                  <Text color='whiteAlpha.500' fontSize='xs' lineHeight={1.8}>
                    {feature.desc}
                  </Text>
                </Box>
              </MotionBox>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Box py={28} position='relative' overflow='hidden'>
        <Box
          position='absolute'
          inset={0}
          bg='linear-gradient(135deg, rgba(108,99,255,0.12) 0%, rgba(0,212,255,0.06) 100%)'
        />
        <Box
          position='absolute'
          top='-50px'
          left='50%'
          transform='translateX(-50%)'
          w='400px'
          h='400px'
          bg='brand.500'
          opacity={0.07}
          borderRadius='full'
          filter='blur(100px)'
        />
        <Container maxW='3xl' textAlign='center' position='relative'>
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Box
              w='72px'
              h='72px'
              mx='auto'
              mb={6}
              bg='linear-gradient(135deg,#6C63FF,#00D4FF)'
              borderRadius='2xl'
              display='flex'
              alignItems='center'
              justifyContent='center'
              boxShadow='0 0 40px rgba(108,99,255,0.4)'
            >
              <svg width='36' height='36' viewBox='0 0 64 64' fill='none'>
                <rect
                  x='14'
                  y='12'
                  width='28'
                  height='14'
                  rx='4'
                  transform='rotate(-45 28 19)'
                  fill='white'
                />
                <rect
                  x='30'
                  y='34'
                  width='8'
                  height='20'
                  rx='3'
                  transform='rotate(-45 34 44)'
                  fill='rgba(255,255,255,0.7)'
                />
              </svg>
            </Box>

            <Heading
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight={800}
              mb={4}
            >
              Ready to Place Your{" "}
              <Text as='span' className='gradient-text'>
                First Bid?
              </Text>
            </Heading>
            <Text color='whiteAlpha.500' mb={8} fontSize='md' lineHeight={1.8}>
              Join thousands of bidders competing in real time. Register free
              and start winning today.
            </Text>
            <Stack
              direction={{ base: "column", sm: "row" }}
              justify='center'
              spacing={3}
            >
              <Button
                variant='gold'
                size='lg'
                px={10}
                fontSize='md'
                rightIcon={<ArrowForwardIcon />}
                onClick={() => router.push("/auth/register")}
              >
                Create Free Account
              </Button>
              <Button
                variant='outline'
                size='lg'
                px={10}
                fontSize='md'
                onClick={() => router.push("/auth/login")}
              >
                Sign In
              </Button>
            </Stack>

            {/* Trust badges */}
            <HStack justify='center' spacing={6} mt={10} flexWrap='wrap'>
              {[
                { icon: LockIcon, label: "Secure & Encrypted" },
                { icon: CheckCircleIcon, label: "No Hidden Fees" },
                { icon: RepeatClockIcon, label: "Credits Always Safe" },
              ].map(({ icon: Ic, label }) => (
                <HStack key={label} spacing={2}>
                  <Ic boxSize={3.5} color='whiteAlpha.400' />
                  <Text fontSize='xs' color='whiteAlpha.400'>
                    {label}
                  </Text>
                </HStack>
              ))}
            </HStack>
          </MotionBox>
        </Container>
      </Box>

      {/* â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Box py={8} borderTop='1px solid' borderColor='whiteAlpha.100'>
        <Container maxW='6xl'>
          <Flex justify='space-between' align='center' flexWrap='wrap' gap={4}>
            <HStack spacing={2}>
              <Box
                w='24px'
                h='24px'
                bg='linear-gradient(135deg,#6C63FF,#00D4FF)'
                borderRadius='6px'
                display='flex'
                alignItems='center'
                justifyContent='center'
                flexShrink={0}
              >
                <svg width='13' height='13' viewBox='0 0 64 64' fill='none'>
                  <rect
                    x='14'
                    y='12'
                    width='28'
                    height='14'
                    rx='4'
                    transform='rotate(-45 28 19)'
                    fill='white'
                  />
                  <rect
                    x='30'
                    y='34'
                    width='8'
                    height='20'
                    rx='3'
                    transform='rotate(-45 34 44)'
                    fill='rgba(255,255,255,0.7)'
                  />
                </svg>
              </Box>
              <Text fontWeight={700} className='gradient-text' fontSize='sm'>
                BidVerse
              </Text>
            </HStack>
            <Text color='whiteAlpha.300' fontSize='xs'>
              Â© {new Date().getFullYear()} BidVerse. Professional Real-Time
              Auction Platform.
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
