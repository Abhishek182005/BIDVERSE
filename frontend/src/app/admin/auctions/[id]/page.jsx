"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Heading,
  Text,
  Box,
  Button,
  HStack,
  Flex,
  Badge,
  Image,
  SimpleGrid,
  VStack,
  Spinner,
  Center,
  useToast,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tabs,
  TabList,
  Tab,
  Avatar,
  Icon,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { auctionsApi, bidsApi } from "@/lib/api";
import { format, formatDistanceToNow } from "date-fns";
import CountdownTimer from "@/components/ui/CountdownTimer";
import LiveBidMonitor from "@/components/admin/LiveBidMonitor";
import DeclareWinnerModal from "@/components/admin/DeclareWinnerModal";
import AuctionForm from "@/components/admin/AuctionForm";
import {
  StarIcon,
  TriangleUpIcon,
  CalendarIcon,
  InfoIcon,
} from "@chakra-ui/icons";

const MotionBox = motion(Box);

const STATUS_COLORS = {
  pending: "yellow",
  active: "green",
  ended: "gray",
  cancelled: "red",
};

export default function AdminAuctionDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(searchParams.get("edit") === "true");
  const [saving, setSaving] = useState(false);

  const {
    isOpen: isDeclareOpen,
    onOpen: onDeclareOpen,
    onClose: onDeclareClose,
  } = useDisclosure();

  const fetchData = async () => {
    try {
      const [auctionRes, bidsRes] = await Promise.all([
        auctionsApi.getOne(id),
        bidsApi.getAuctionBids(id),
      ]);
      setAuction(auctionRes.data.data);
      setBids(bidsRes.data.data || []);
    } catch (err) {
      toast({
        title: "Failed to load auction",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleClose = async () => {
    setClosing(true);
    try {
      await auctionsApi.close(id);
      toast({
        title: "Auction closed & winner declared!",
        status: "success",
        duration: 4000,
      });
      onDeclareClose();
      fetchData();
    } catch (err) {
      toast({
        title: "Failed to close auction",
        description: err.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 4000,
      });
    } finally {
      setClosing(false);
    }
  };

  const handleEdit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
        minBid: Number(values.minBid),
        bidIncrement: Number(values.bidIncrement),
      };
      await auctionsApi.update(id, payload);
      toast({ title: "Auction updated!", status: "success", duration: 3000 });
      setEditing(false);
      fetchData();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Compute unique participants from bid list
  const uniqueBidders = Object.values(
    bids.reduce((acc, bid) => {
      const uid = bid.bidder?._id;
      if (!uid) return acc;
      if (!acc[uid]) {
        acc[uid] = {
          ...bid.bidder,
          bidCount: 0,
          highestBid: 0,
          lastBid: bid.createdAt,
        };
      }
      acc[uid].bidCount++;
      if (bid.amount > acc[uid].highestBid) acc[uid].highestBid = bid.amount;
      if (new Date(bid.createdAt) > new Date(acc[uid].lastBid))
        acc[uid].lastBid = bid.createdAt;
      return acc;
    }, {}),
  ).sort((a, b) => b.highestBid - a.highestBid);

  if (loading) {
    return (
      <Center minH='calc(100vh - 64px)'>
        <Spinner size='xl' color='brand.500' thickness='3px' />
      </Center>
    );
  }

  if (!auction) {
    return (
      <Center minH='calc(100vh - 64px)'>
        <VStack>
          <Text fontSize='3xl'>❌</Text>
          <Text color='whiteAlpha.500'>Auction not found</Text>
          <Button size='sm' onClick={() => router.push("/admin/auctions")}>
            Go Back
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Container maxW='6xl' py={8} px={4}>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Breadcrumb mb={5} fontSize='sm' color='whiteAlpha.500'>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin'>Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/auctions'>Auctions</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink color='brand.400' noOfLines={1}>
              {auction.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Flex
          justify='space-between'
          align='start'
          mb={6}
          flexWrap='wrap'
          gap={4}
        >
          <Box>
            <HStack mb={2} flexWrap='wrap' gap={2}>
              <Heading size='lg'>{auction.title}</Heading>
              <Badge
                colorScheme={STATUS_COLORS[auction.status] || "gray"}
                px={2}
                py={1}
                fontSize='xs'
              >
                {auction.status.toUpperCase()}
              </Badge>
            </HStack>
            <Text color='whiteAlpha.400' fontSize='sm'>
              {auction.category}
            </Text>
          </Box>
          <HStack flexWrap='wrap' gap={2}>
            {auction.status !== "ended" && auction.status !== "cancelled" && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => setEditing(!editing)}
              >
                {editing ? "Cancel Edit" : "✏️ Edit"}
              </Button>
            )}
            {auction.status === "active" && !auction.winner && (
              <Button
                size='sm'
                colorScheme='yellow'
                bg='gold.400'
                color='gray.900'
                _hover={{ bg: "gold.300" }}
                onClick={onDeclareOpen}
              >
                🏆 Declare Winner
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Stats row */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
          {[
            {
              label: "Current Bid",
              value: `${auction.currentBid || auction.minBid} cr`,
              color: "gold.400",
              border: "gold.500",
              glow: "rgba(255,215,0,0.1)",
            },
            {
              label: "Min Bid",
              value: `${auction.minBid} cr`,
              color: "brand.300",
              border: "brand.500",
              glow: "rgba(108,99,255,0.1)",
            },
            {
              label: "Bid Increment",
              value: `${auction.bidIncrement} cr`,
              color: "cyber.400",
              border: "cyber.500",
              glow: "rgba(0,212,255,0.1)",
            },
            {
              label: "Total Bids",
              value: auction.totalBids,
              color: "green.400",
              border: "green.500",
              glow: "rgba(0,229,160,0.1)",
            },
          ].map((s, i) => (
            <Box
              key={i}
              bg='dark.700'
              border='1px solid'
              borderColor={s.border}
              borderRadius='xl'
              p={{ base: 3, md: 4 }}
              position='relative'
              overflow='hidden'
            >
              <Box
                position='absolute'
                top={0}
                left={0}
                right={0}
                h='2px'
                bg={`linear-gradient(90deg, transparent, ${s.border}, transparent)`}
              />
              <Text fontSize='xs' color='whiteAlpha.500' mb={1}>
                {s.label}
              </Text>
              <Text
                fontWeight={800}
                fontSize={{ base: "lg", md: "2xl" }}
                color={s.color}
              >
                {s.value}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} alignItems='start'>
          {/* Left: Image + Details */}
          <Box>
            <Box
              h='220px'
              borderRadius='xl'
              overflow='hidden'
              bg='dark.700'
              mb={4}
              border='1px solid'
              borderColor='whiteAlpha.100'
            >
              {auction.image ? (
                <Image
                  src={auction.image}
                  w='full'
                  h='full'
                  objectFit='cover'
                  alt={auction.title}
                />
              ) : (
                <Center h='full'>
                  <Text fontSize='4xl'>🔨</Text>
                </Center>
              )}
            </Box>

            <Box
              bg='dark.700'
              border='1px solid'
              borderColor='whiteAlpha.100'
              borderRadius='xl'
              p={4}
            >
              <VStack spacing={3} align='stretch'>
                <Stat>
                  <StatLabel color='whiteAlpha.500' fontSize='xs'>
                    Current Bid
                  </StatLabel>
                  <StatNumber fontSize='2xl' color='gold.400'>
                    {auction.currentBid || auction.minBid} cr
                  </StatNumber>
                  {auction.currentBidder && (
                    <StatHelpText color='brand.300'>
                      Leading: {auction.currentBidder.name}
                    </StatHelpText>
                  )}
                </Stat>

                <Divider borderColor='whiteAlpha.100' />

                <HStack justify='space-between'>
                  <Text fontSize='xs' color='whiteAlpha.500'>
                    Category
                  </Text>
                  <Badge colorScheme='purple' fontSize='xs'>
                    {auction.category}
                  </Badge>
                </HStack>
                <HStack justify='space-between'>
                  <Text fontSize='xs' color='whiteAlpha.500'>
                    Min Bid
                  </Text>
                  <Text fontSize='sm' fontWeight={600}>
                    {auction.minBid} cr
                  </Text>
                </HStack>
                <HStack justify='space-between'>
                  <Text fontSize='xs' color='whiteAlpha.500'>
                    Bid Increment
                  </Text>
                  <Text fontSize='sm' fontWeight={600}>
                    {auction.bidIncrement} cr
                  </Text>
                </HStack>
                <HStack justify='space-between'>
                  <Text fontSize='xs' color='whiteAlpha.500'>
                    Total Bids
                  </Text>
                  <Text fontSize='sm' fontWeight={600}>
                    {auction.totalBids}
                  </Text>
                </HStack>
                <HStack justify='space-between'>
                  <Text fontSize='xs' color='whiteAlpha.500'>
                    Participants
                  </Text>
                  <Text fontSize='sm' fontWeight={600}>
                    {uniqueBidders.length}
                  </Text>
                </HStack>

                <Divider borderColor='whiteAlpha.100' />

                <VStack spacing={1} align='stretch'>
                  <HStack>
                    <CalendarIcon boxSize={3} color='whiteAlpha.400' />
                    <Text fontSize='xs' color='whiteAlpha.500'>
                      Start
                    </Text>
                  </HStack>
                  <Text fontSize='xs' color='whiteAlpha.700' pl={4}>
                    {format(new Date(auction.startTime), "MMM d, yyyy HH:mm")}
                  </Text>
                  <HStack mt={1}>
                    <CalendarIcon boxSize={3} color='whiteAlpha.400' />
                    <Text fontSize='xs' color='whiteAlpha.500'>
                      End
                    </Text>
                  </HStack>
                  <Text fontSize='xs' color='whiteAlpha.700' pl={4}>
                    {format(new Date(auction.endTime), "MMM d, yyyy HH:mm")}
                  </Text>
                </VStack>

                {auction.status === "active" && (
                  <Box pt={1}>
                    <Text fontSize='xs' color='whiteAlpha.500' mb={2}>
                      Time Remaining
                    </Text>
                    <CountdownTimer
                      endTime={auction.endTime}
                      status={auction.status}
                      size='sm'
                    />
                  </Box>
                )}

                {auction.status === "ended" && auction.winner && (
                  <Box
                    bg='rgba(255, 215, 0, 0.1)'
                    p={3}
                    borderRadius='lg'
                    border='1px solid'
                    borderColor='gold.500'
                  >
                    <HStack mb={2}>
                      <StarIcon color='gold.400' boxSize={4} />
                      <Text fontSize='xs' color='gold.400' fontWeight={700}>
                        WINNER
                      </Text>
                    </HStack>
                    <Text fontSize='sm' fontWeight={700}>
                      {auction.winner.name}
                    </Text>
                    <Text fontSize='xs' color='whiteAlpha.500' mt={1}>
                      Winning bid:{" "}
                      <strong style={{ color: "#FFD700" }}>
                        {auction.winningBid} cr
                      </strong>
                    </Text>
                  </Box>
                )}

                {auction.status === "cancelled" && (
                  <Box
                    bg='rgba(255,80,80,0.1)'
                    p={3}
                    borderRadius='lg'
                    border='1px solid'
                    borderColor='red.500'
                  >
                    <Text fontSize='xs' color='red.400' fontWeight={700}>
                      AUCTION CANCELLED
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>
          </Box>

          {/* Right: Tabs */}
          <Box gridColumn={{ lg: "span 2" }}>
            <Tabs variant='line' colorScheme='brand'>
              <TabList borderColor='whiteAlpha.200'>
                <Tab fontSize='sm'>Live Bids</Tab>
                <Tab fontSize='sm'>Participants ({uniqueBidders.length})</Tab>
                <Tab fontSize='sm'>Description</Tab>
                {editing && (
                  <Tab fontSize='sm' color='brand.400'>
                    Edit
                  </Tab>
                )}
              </TabList>
              <TabPanels>
                {/* Tab 1: Live Bids */}
                <TabPanel px={0}>
                  <Box
                    bg='dark.700'
                    border='1px solid'
                    borderColor='whiteAlpha.100'
                    borderRadius='xl'
                    p={4}
                  >
                    <LiveBidMonitor auctionId={id} initialBids={bids} />
                  </Box>
                </TabPanel>

                {/* Tab 2: Participants */}
                <TabPanel px={0}>
                  <Box
                    bg='dark.700'
                    border='1px solid'
                    borderColor='whiteAlpha.100'
                    borderRadius='xl'
                    overflow='hidden'
                  >
                    {uniqueBidders.length === 0 ? (
                      <Center py={12}>
                        <VStack>
                          <Text fontSize='2xl'>👥</Text>
                          <Text color='whiteAlpha.400' fontSize='sm'>
                            No participants yet
                          </Text>
                        </VStack>
                      </Center>
                    ) : (
                      <VStack spacing={0} align='stretch'>
                        {/* Header */}
                        <HStack
                          px={5}
                          py={3}
                          bg='whiteAlpha.50'
                          borderBottom='1px solid'
                          borderColor='whiteAlpha.100'
                        >
                          <Text
                            fontSize='xs'
                            color='whiteAlpha.500'
                            flex={1}
                            fontWeight={600}
                          >
                            BIDDER
                          </Text>
                          <Text
                            fontSize='xs'
                            color='whiteAlpha.500'
                            w='80px'
                            textAlign='center'
                            fontWeight={600}
                          >
                            BIDS
                          </Text>
                          <Text
                            fontSize='xs'
                            color='whiteAlpha.500'
                            w='110px'
                            textAlign='right'
                            fontWeight={600}
                          >
                            HIGHEST BID
                          </Text>
                        </HStack>
                        {uniqueBidders.map((bidder, i) => (
                          <Box key={bidder._id}>
                            <HStack
                              px={5}
                              py={3}
                              _hover={{ bg: "whiteAlpha.50" }}
                            >
                              <HStack flex={1} spacing={3} minW={0}>
                                <Box position='relative'>
                                  <Avatar
                                    name={bidder.name}
                                    size='sm'
                                    bg='brand.500'
                                  />
                                  {i === 0 && (
                                    <Box
                                      position='absolute'
                                      top='-4px'
                                      right='-4px'
                                      bg='gold.500'
                                      borderRadius='full'
                                      w='14px'
                                      h='14px'
                                      display='flex'
                                      alignItems='center'
                                      justifyContent='center'
                                    >
                                      <Text fontSize='8px'>👑</Text>
                                    </Box>
                                  )}
                                </Box>
                                <Box minW={0}>
                                  <HStack spacing={2}>
                                    <Text
                                      fontSize='sm'
                                      fontWeight={600}
                                      noOfLines={1}
                                    >
                                      {bidder.name}
                                    </Text>
                                    {auction.currentBidder?._id ===
                                      bidder._id &&
                                      auction.status === "active" && (
                                        <Badge
                                          colorScheme='green'
                                          fontSize='2xs'
                                        >
                                          Leading
                                        </Badge>
                                      )}
                                    {auction.winner?._id === bidder._id && (
                                      <Badge
                                        colorScheme='yellow'
                                        fontSize='2xs'
                                      >
                                        Winner
                                      </Badge>
                                    )}
                                  </HStack>
                                  <Text fontSize='xs' color='whiteAlpha.400'>
                                    Last bid{" "}
                                    {formatDistanceToNow(
                                      new Date(bidder.lastBid),
                                      { addSuffix: true },
                                    )}
                                  </Text>
                                </Box>
                              </HStack>
                              <Text
                                fontSize='sm'
                                color='whiteAlpha.600'
                                w='80px'
                                textAlign='center'
                              >
                                {bidder.bidCount} bid
                                {bidder.bidCount !== 1 ? "s" : ""}
                              </Text>
                              <Text
                                fontWeight={700}
                                color={i === 0 ? "gold.400" : "whiteAlpha.700"}
                                fontSize='sm'
                                w='110px'
                                textAlign='right'
                              >
                                {bidder.highestBid} cr
                              </Text>
                            </HStack>
                            {i < uniqueBidders.length - 1 && (
                              <Divider borderColor='whiteAlpha.50' />
                            )}
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </Box>
                </TabPanel>

                {/* Tab 3: Description */}
                <TabPanel px={0}>
                  <Box
                    bg='dark.700'
                    border='1px solid'
                    borderColor='whiteAlpha.100'
                    borderRadius='xl'
                    p={5}
                  >
                    <VStack spacing={4} align='stretch'>
                      <Box>
                        <Text
                          fontSize='xs'
                          color='whiteAlpha.400'
                          mb={1}
                          fontWeight={600}
                          textTransform='uppercase'
                          letterSpacing='wider'
                        >
                          About This Auction
                        </Text>
                        <Text
                          color='whiteAlpha.700'
                          whiteSpace='pre-wrap'
                          fontSize='sm'
                          lineHeight={1.8}
                        >
                          {auction.description}
                        </Text>
                      </Box>
                      <Divider borderColor='whiteAlpha.100' />
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Box>
                          <Text
                            fontSize='xs'
                            color='whiteAlpha.400'
                            mb={2}
                            fontWeight={600}
                            textTransform='uppercase'
                            letterSpacing='wider'
                          >
                            Auction Timeline
                          </Text>
                          <VStack spacing={2} align='stretch'>
                            <HStack justify='space-between'>
                              <Text fontSize='xs' color='whiteAlpha.500'>
                                Created
                              </Text>
                              <Text fontSize='xs' color='whiteAlpha.700'>
                                {auction.createdAt
                                  ? format(
                                      new Date(auction.createdAt),
                                      "MMM d, yyyy HH:mm",
                                    )
                                  : "—"}
                              </Text>
                            </HStack>
                            <HStack justify='space-between'>
                              <Text fontSize='xs' color='whiteAlpha.500'>
                                Starts
                              </Text>
                              <Text fontSize='xs' color='whiteAlpha.700'>
                                {format(
                                  new Date(auction.startTime),
                                  "MMM d, yyyy HH:mm",
                                )}
                              </Text>
                            </HStack>
                            <HStack justify='space-between'>
                              <Text fontSize='xs' color='whiteAlpha.500'>
                                Ends
                              </Text>
                              <Text fontSize='xs' color='whiteAlpha.700'>
                                {format(
                                  new Date(auction.endTime),
                                  "MMM d, yyyy HH:mm",
                                )}
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>
                        <Box>
                          <Text
                            fontSize='xs'
                            color='whiteAlpha.400'
                            mb={2}
                            fontWeight={600}
                            textTransform='uppercase'
                            letterSpacing='wider'
                          >
                            Bid Rules
                          </Text>
                          <VStack spacing={2} align='stretch'>
                            <HStack justify='space-between'>
                              <Text fontSize='xs' color='whiteAlpha.500'>
                                Starting Bid
                              </Text>
                              <Text
                                fontSize='xs'
                                fontWeight={700}
                                color='brand.300'
                              >
                                {auction.minBid} cr
                              </Text>
                            </HStack>
                            <HStack justify='space-between'>
                              <Text fontSize='xs' color='whiteAlpha.500'>
                                Increment
                              </Text>
                              <Text
                                fontSize='xs'
                                fontWeight={700}
                                color='cyber.400'
                              >
                                +{auction.bidIncrement} cr
                              </Text>
                            </HStack>
                            <HStack justify='space-between'>
                              <Text fontSize='xs' color='whiteAlpha.500'>
                                Category
                              </Text>
                              <Badge colorScheme='purple' fontSize='2xs'>
                                {auction.category}
                              </Badge>
                            </HStack>
                          </VStack>
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </Box>
                </TabPanel>

                {editing && (
                  <TabPanel px={0}>
                    <Box
                      bg='dark.700'
                      border='1px solid'
                      borderColor='whiteAlpha.100'
                      borderRadius='xl'
                      p={5}
                    >
                      {auction.status === "active" && auction.totalBids > 0 && (
                        <Box
                          mb={4}
                          p={3}
                          bg='rgba(255,165,0,0.1)'
                          border='1px solid'
                          borderColor='orange.500'
                          borderRadius='lg'
                        >
                          <Text
                            fontSize='xs'
                            color='orange.300'
                            fontWeight={600}
                          >
                            ⚠️ Bidding is active — only Description and Image
                            can be changed.
                          </Text>
                        </Box>
                      )}
                      <AuctionForm
                        defaultValues={auction}
                        onSubmit={handleEdit}
                        isLoading={saving}
                        submitLabel='Save Changes'
                        restrictedEdit={
                          auction.status === "active" && auction.totalBids > 0
                        }
                      />
                    </Box>
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>
          </Box>
        </SimpleGrid>
      </MotionBox>

      <DeclareWinnerModal
        isOpen={isDeclareOpen}
        onClose={onDeclareClose}
        auction={auction}
        onConfirm={handleClose}
        isLoading={closing}
      />
    </Container>
  );
}
