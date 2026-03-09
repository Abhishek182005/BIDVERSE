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
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { auctionsApi, bidsApi } from "@/lib/api";
import { format } from "date-fns";
import CountdownTimer from "@/components/ui/CountdownTimer";
import LiveBidMonitor from "@/components/admin/LiveBidMonitor";
import DeclareWinnerModal from "@/components/admin/DeclareWinnerModal";
import AuctionForm from "@/components/admin/AuctionForm";

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
            {auction.status === "pending" && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => setEditing(!editing)}
              >
                {editing ? "Cancel Edit" : "✏️ Edit"}
              </Button>
            )}
            {auction.status === "active" && (
              <Button
                size='sm'
                colorScheme='gold'
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

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
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
                      by {auction.currentBidder.name}
                    </StatHelpText>
                  )}
                </Stat>

                <Divider borderColor='whiteAlpha.100' />

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

                <Divider borderColor='whiteAlpha.100' />

                <Text fontSize='xs' color='whiteAlpha.400'>
                  Start:{" "}
                  {format(new Date(auction.startTime), "MMM d, yyyy HH:mm")}
                </Text>
                <Text fontSize='xs' color='whiteAlpha.400'>
                  End: {format(new Date(auction.endTime), "MMM d, yyyy HH:mm")}
                </Text>

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
                  <Box bg='rgba(255, 215, 0, 0.1)' p={3} borderRadius='lg'>
                    <Text
                      fontSize='xs'
                      color='gold.400'
                      fontWeight={700}
                      mb={1}
                    >
                      🏆 WINNER
                    </Text>
                    <Text fontSize='sm' fontWeight={600}>
                      {auction.winner.name}
                    </Text>
                    <Text fontSize='xs' color='whiteAlpha.500'>
                      Winning bid: {auction.winningBid} cr
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
                <Tab fontSize='sm'>Description</Tab>
                {editing && (
                  <Tab fontSize='sm' color='brand.400'>
                    Edit
                  </Tab>
                )}
              </TabList>
              <TabPanels>
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
                <TabPanel px={0}>
                  <Box
                    bg='dark.700'
                    border='1px solid'
                    borderColor='whiteAlpha.100'
                    borderRadius='xl'
                    p={5}
                  >
                    <Text
                      color='whiteAlpha.700'
                      whiteSpace='pre-wrap'
                      fontSize='sm'
                      lineHeight={1.8}
                    >
                      {auction.description}
                    </Text>
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
                      <AuctionForm
                        defaultValues={auction}
                        onSubmit={handleEdit}
                        isLoading={saving}
                        submitLabel='Save Changes'
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
