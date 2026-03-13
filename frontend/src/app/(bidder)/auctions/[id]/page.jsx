"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Heading,
  Text,
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Badge,
  Button,
  Spinner,
  Center,
  Flex,
  Image,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  useDisclosure,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Avatar,
} from "@chakra-ui/react";
import {
  StarIcon,
  TriangleUpIcon,
  EditIcon,
  RepeatClockIcon,
} from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { auctionsApi, bidsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import CountdownTimer from "@/components/ui/CountdownTimer";
import PlaceBidModal from "@/components/bidder/PlaceBidModal";
import AutoBidModal from "@/components/bidder/AutoBidModal";
import { formatDistanceToNow, format } from "date-fns";

const MotionBox = motion(Box);

const STATUS_COLORS = {
  pending: "yellow",
  active: "green",
  ended: "gray",
  cancelled: "red",
};

export default function AuctionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { on, joinAuction, leaveAuction } = useSocket();
  const toast = useToast();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMyLead, setIsMyLead] = useState(false);
  const [autoBidActive, setAutoBidActive] = useState(false);
  const [cancellingAutoBid, setCancellingAutoBid] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isAutoBidOpen,
    onOpen: onAutoBidOpen,
    onClose: onAutoBidClose,
  } = useDisclosure();

  const fetchData = async () => {
    try {
      const [auctionRes, bidsRes] = await Promise.all([
        auctionsApi.getOne(id),
        bidsApi.getAuctionBids(id),
      ]);
      const a = auctionRes.data.data;
      setAuction(a);
      setBids(bidsRes.data.data || []);
      setIsMyLead(
        a.currentBidder?._id === user?._id || a.currentBidder === user?._id,
      );
      // Check if user has an active auto-bid
      bidsApi
        .getAutoBid(id)
        .then((res) => setAutoBidActive(!!res.data.data?.isActive))
        .catch(() => setAutoBidActive(false));
    } catch (err) {
      toast({ title: "Auction not found", status: "error", duration: 3000 });
      router.push("/auctions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    joinAuction(id);
    return () => leaveAuction(id);
  }, [id]);

  // Real-time new bid
  useEffect(() => {
    const cleanup = on("new_bid", (data) => {
      if (data.auctionId !== id) return;

      const newBid = {
        _id: Date.now().toString(),
        bidder: { name: data.bidderName, _id: data.bidderId },
        amount: data.amount,
        createdAt: new Date().toISOString(),
        status: "active",
      };

      setBids((prev) => [newBid, ...prev]);
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              currentBid: data.amount,
              currentBidder: { _id: data.bidderId, name: data.bidderName },
              totalBids: (prev.totalBids || 0) + 1,
            }
          : prev,
      );

      setIsMyLead(data.bidderId === user?._id);

      if (data.bidderId !== user?._id) {
        toast({
          title: "New bid placed!",
          description: `${data.bidderName} bid ${data.amount} credits`,
          status: "info",
          duration: 3000,
        });
      }
    });

    const cleanupEnded = on("auction_ended", (data) => {
      if (data.auctionId !== id) return;
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              status: "ended",
              winner: data.winner,
              winningBid: data.winningBid,
            }
          : prev,
      );
      toast({
        title: "Auction ended!",
        description: data.winner ? `Winner: ${data.winner.name}` : "No winner",
        status: "warning",
        duration: 6000,
      });
    });

    return () => {
      cleanup?.();
      cleanupEnded?.();
    };
  }, [on, id, user]);

  const handleBidSuccess = () => {
    fetchData();
  };

  if (loading) {
    return (
      <Center minH='calc(100vh - 64px)'>
        <Spinner size='xl' color='brand.500' thickness='3px' />
      </Center>
    );
  }

  if (!auction) return null;

  const minNext = (auction.currentBid || auction.minBid) + auction.bidIncrement;
  const canBid =
    auction.status === "active" && user?.credits >= minNext && !isMyLead;

  return (
    <Container maxW='6xl' py={8} px={4}>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant='ghost' size='sm' mb={5} onClick={() => router.back()}>
          ← Back
        </Button>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Left: Image */}
          <Box>
            <Box
              h={{ base: "260px", md: "380px" }}
              borderRadius='2xl'
              overflow='hidden'
              bg='dark.700'
              border='1px solid'
              borderColor='whiteAlpha.100'
              mb={4}
              position='relative'
            >
              {auction.image ? (
                <Image
                  src={auction.image}
                  w='full'
                  h='full'
                  objectFit='cover'
                  alt={auction.title}
                  fallback={
                    <Box
                      w='full'
                      h='full'
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                      bg='dark.600'
                    >
                      <EditIcon boxSize={12} color='whiteAlpha.300' />
                    </Box>
                  }
                />
              ) : (
                <Center h='full'>
                  <EditIcon boxSize={12} color='whiteAlpha.300' />
                </Center>
              )}
              <Badge
                position='absolute'
                top={3}
                right={3}
                colorScheme={STATUS_COLORS[auction.status] || "gray"}
                px={2}
                py={1}
                fontSize='xs'
              >
                {auction.status.toUpperCase()}
              </Badge>
            </Box>

            {/* Bid list */}
            <Box
              bg='dark.700'
              border='1px solid'
              borderColor='whiteAlpha.100'
              borderRadius='xl'
              p={4}
              maxH='300px'
              overflowY='auto'
            >
              <HStack justify='space-between' mb={3}>
                <Heading size='sm'>Bid History</Heading>
                <Text fontSize='xs' color='whiteAlpha.400'>
                  {auction.totalBids} total
                </Text>
              </HStack>
              {bids.length === 0 ? (
                <Center py={6}>
                  <Text color='whiteAlpha.400' fontSize='sm'>
                    No bids yet. Be the first!
                  </Text>
                </Center>
              ) : (
                <VStack spacing={0} align='stretch'>
                  <AnimatePresence>
                    {bids.slice(0, 15).map((bid, i) => (
                      <MotionBox
                        key={bid._id}
                        initial={{
                          opacity: 0,
                          x: -20,
                          backgroundColor: "rgba(108,99,255,0.2)",
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          backgroundColor: "transparent",
                        }}
                        transition={{ duration: 0.4 }}
                      >
                        <HStack
                          py={2.5}
                          px={1}
                          borderBottom='1px solid'
                          borderColor='whiteAlpha.50'
                        >
                          <Avatar
                            name={bid.bidder?.name}
                            size='xs'
                            bg='brand.500'
                            flexShrink={0}
                          />
                          <Text fontSize='sm' flex={1} noOfLines={1}>
                            {bid.bidder?.name}
                          </Text>
                          {i === 0 && (
                            <Badge colorScheme='green' fontSize='2xs'>
                              Leading
                            </Badge>
                          )}
                          <Text
                            fontWeight={700}
                            color={i === 0 ? "gold.400" : "whiteAlpha.600"}
                            fontSize='sm'
                          >
                            {bid.amount} cr
                          </Text>
                        </HStack>
                      </MotionBox>
                    ))}
                  </AnimatePresence>
                </VStack>
              )}
            </Box>
          </Box>

          {/* Right: Details */}
          <Box>
            <HStack mb={2} flexWrap='wrap' gap={2}>
              <Badge variant='outline' colorScheme='purple' fontSize='xs'>
                {auction.category}
              </Badge>
            </HStack>
            <Heading size='xl' mb={3} lineHeight={1.3}>
              {auction.title}
            </Heading>

            <Text color='whiteAlpha.600' fontSize='sm' mb={5} lineHeight={1.8}>
              {auction.description}
            </Text>

            <Divider borderColor='whiteAlpha.100' mb={5} />

            {/* Bid Stats */}
            <SimpleGrid columns={2} spacing={4} mb={5}>
              <Box
                bg='dark.700'
                p={4}
                borderRadius='xl'
                border='1px solid'
                borderColor='whiteAlpha.100'
              >
                <Stat>
                  <StatLabel color='whiteAlpha.500' fontSize='xs'>
                    Current Bid
                  </StatLabel>
                  <StatNumber fontSize='2xl' color='gold.400'>
                    {auction.currentBid || auction.minBid} cr
                  </StatNumber>
                  {auction.currentBidder && (
                    <StatHelpText color='brand.300' fontSize='xs'>
                      by {auction.currentBidder.name}
                    </StatHelpText>
                  )}
                </Stat>
              </Box>
              <Box
                bg='dark.700'
                p={4}
                borderRadius='xl'
                border='1px solid'
                borderColor='whiteAlpha.100'
              >
                <Stat>
                  <StatLabel color='whiteAlpha.500' fontSize='xs'>
                    Min Next Bid
                  </StatLabel>
                  <StatNumber fontSize='2xl' color='brand.300'>
                    {minNext} cr
                  </StatNumber>
                  <StatHelpText color='whiteAlpha.400' fontSize='xs'>
                    +{auction.bidIncrement} increment
                  </StatHelpText>
                </Stat>
              </Box>
            </SimpleGrid>

            {/* Timer */}
            {auction.status === "active" && (
              <Box mb={5}>
                <Text fontSize='xs' color='whiteAlpha.500' mb={2}>
                  Time Remaining
                </Text>
                <CountdownTimer
                  endTime={auction.endTime}
                  status={auction.status}
                  size='lg'
                />
              </Box>
            )}

            {auction.status === "ended" && auction.winner && (
              <Box
                bg='rgba(255,215,0,0.1)'
                p={4}
                borderRadius='xl'
                mb={5}
                border='1px solid'
                borderColor='gold.400'
              >
                <HStack>
                  <StarIcon color='gold.400' boxSize={6} />
                  <Box>
                    <Text fontWeight={700} color='gold.400'>
                      Auction Ended
                    </Text>
                    <Text fontSize='sm'>
                      Won by <strong>{auction.winner.name}</strong> for{" "}
                      <strong>{auction.winningBid} credits</strong>
                    </Text>
                  </Box>
                </HStack>
              </Box>
            )}

            {/* My lead indicator */}
            {isMyLead && auction.status === "active" && (
              <Box
                bg='rgba(0,212,255,0.1)'
                p={3}
                borderRadius='xl'
                mb={4}
                border='1px solid'
                borderColor='cyber.400'
              >
                <HStack>
                  <TriangleUpIcon color='cyber.400' boxSize={3.5} />
                  <Text fontSize='sm' color='cyber.400' fontWeight={600}>
                    You are currently the highest bidder!
                  </Text>
                </HStack>
              </Box>
            )}

            {/* Bid Button */}
            {auction.status === "active" && (
              <Box mb={4}>
                {isMyLead ? (
                  <Button
                    w='full'
                    size='lg'
                    colorScheme='green'
                    variant='outline'
                    isDisabled
                  >
                    ✓ You're Leading — Await outcome
                  </Button>
                ) : (user?.credits || 0) < minNext ? (
                  <Box>
                    <Button w='full' size='lg' isDisabled colorScheme='brand'>
                      Insufficient Credits
                    </Button>
                    <Text
                      fontSize='xs'
                      color='whiteAlpha.400'
                      textAlign='center'
                      mt={2}
                    >
                      You need {minNext} credits. You have {user?.credits || 0}.
                    </Text>
                  </Box>
                ) : (
                  <Button
                    w='full'
                    size='lg'
                    colorScheme='brand'
                    leftIcon={<TriangleUpIcon />}
                    onClick={onOpen}
                  >
                    Place Bid ({minNext}+ cr)
                  </Button>
                )}
              </Box>
            )}

            {/* Auto-bid button — shown when auction is active and user is not leading */}
            {auction.status === "active" &&
              !isMyLead &&
              (user?.credits || 0) >= minNext && (
                <HStack mb={2} spacing={2}>
                  <Button
                    flex={1}
                    size='md'
                    variant='outline'
                    colorScheme='purple'
                    onClick={onAutoBidOpen}
                    leftIcon={<RepeatClockIcon />}
                  >
                    {autoBidActive ? "Manage Auto-Bid" : "Set Auto-Bid"}
                  </Button>
                  {autoBidActive && (
                    <Button
                      size='md'
                      colorScheme='red'
                      variant='ghost'
                      isLoading={cancellingAutoBid}
                      onClick={async () => {
                        setCancellingAutoBid(true);
                        try {
                          await bidsApi.cancelAutoBid(id);
                          setAutoBidActive(false);
                          toast({
                            title: "Auto-bid cancelled",
                            status: "info",
                            duration: 3000,
                          });
                        } catch {
                          toast({
                            title: "Failed to cancel",
                            status: "error",
                            duration: 3000,
                          });
                        } finally {
                          setCancellingAutoBid(false);
                        }
                      }}
                    >
                      Opt Out
                    </Button>
                  )}
                </HStack>
              )}

            <HStack
              justify='space-between'
              fontSize='xs'
              color='whiteAlpha.400'
              flexWrap='wrap'
              gap={2}
            >
              <Text>
                Start:{" "}
                {format(new Date(auction.startTime), "MMM d, yyyy HH:mm")}
              </Text>
              <Text>
                End: {format(new Date(auction.endTime), "MMM d, yyyy HH:mm")}
              </Text>
            </HStack>

            {/* Auction Details Card */}
            <Box
              bg='dark.700'
              border='1px solid'
              borderColor='whiteAlpha.100'
              borderRadius='xl'
              p={4}
              mt={4}
            >
              <Text
                fontSize='xs'
                color='whiteAlpha.400'
                fontWeight={600}
                textTransform='uppercase'
                letterSpacing='wider'
                mb={3}
              >
                Auction Details
              </Text>
              <SimpleGrid columns={2} spacing={3}>
                <Box>
                  <Text fontSize='xs' color='whiteAlpha.500'>
                    Category
                  </Text>
                  <Badge colorScheme='purple' fontSize='xs' mt={1}>
                    {auction.category}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize='xs' color='whiteAlpha.500'>
                    Total Bids
                  </Text>
                  <Text fontSize='sm' fontWeight={700} mt={1}>
                    {auction.totalBids}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize='xs' color='whiteAlpha.500'>
                    Starting Bid
                  </Text>
                  <Text fontSize='sm' fontWeight={700} color='brand.300' mt={1}>
                    {auction.minBid} cr
                  </Text>
                </Box>
                <Box>
                  <Text fontSize='xs' color='whiteAlpha.500'>
                    Bid Increment
                  </Text>
                  <Text fontSize='sm' fontWeight={700} color='cyber.400' mt={1}>
                    +{auction.bidIncrement} cr
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>
          </Box>
        </SimpleGrid>
      </MotionBox>

      <PlaceBidModal
        isOpen={isOpen}
        onClose={onClose}
        auction={auction}
        onSuccess={handleBidSuccess}
      />
      <AutoBidModal
        isOpen={isAutoBidOpen}
        onClose={onAutoBidClose}
        auction={auction}
        onSuccess={(isActive) => setAutoBidActive(isActive)}
      />
    </Container>
  );
}
