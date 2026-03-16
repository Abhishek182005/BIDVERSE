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
  Avatar,
  Button,
  Spinner,
  Center,
  Flex,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { bidsApi } from "@/lib/api";
import AuctionCard from "@/components/ui/AuctionCard";
import StatCard from "@/components/ui/StatCard";
import {
  StarIcon,
  TriangleUpIcon,
  TriangleDownIcon,
  SearchIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";
import { formatDistanceToNow, format } from "date-fns";

const MotionBox = motion(Box);

export default function BidderDashboard() {
  const { user, updateUser } = useAuth();
  const { on } = useSocket();
  const router = useRouter();
  const toast = useToast();

  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = async () => {
    try {
      const { data } = await bidsApi.getMyBids({ limit: 10 });
      setBids(data.data || []);
    } catch (err) {
      console.error("Failed to load bids");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  // Listen for outbid / win notifications to refresh credits
  useEffect(() => {
    const cleanup = on("notification", (notif) => {
      if (notif.type === "outbid" || notif.type === "won") {
        fetchBids();
      }
    });
    return cleanup;
  }, [on]);

  const activeBids = bids.filter((b) => b.status === "active");
  const wonBids = bids.filter((b) => b.status === "won");
  const outbidBids = bids.filter((b) => b.status === "outbid");

  return (
    <Container maxW='7xl' py={8} px={4}>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <Flex
          justify='space-between'
          align='center'
          mb={8}
          flexWrap='wrap'
          gap={4}
        >
          <HStack spacing={4}>
            <Avatar
              name={user?.name}
              size={{ base: "md", md: "lg" }}
              bg='brand.500'
            />
            <Box>
              <Heading size='lg'>
                Welcome back, {user?.name?.split(" ")[0]}!
              </Heading>
              <Text color='whiteAlpha.500'>Here's your auction activity</Text>
            </Box>
          </HStack>
          <Button
            colorScheme='brand'
            onClick={() => router.push("/auctions")}
            w={{ base: "100%", sm: "auto" }}
          >
            Browse Auctions →
          </Button>
        </Flex>

        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
          <StatCard
            label='Your Credits'
            value={(user?.credits || 0).toLocaleString()}
            icon={<StarIcon boxSize={5} color='gold.400' />}
            color='gold'
            index={0}
            helpText='Available balance'
          />
          <StatCard
            label='Active Bids'
            value={activeBids.length}
            icon={<TriangleUpIcon boxSize={5} color='brand.300' />}
            color='brand'
            index={1}
            helpText='Currently leading'
          />
          <StatCard
            label='Auctions Won'
            value={wonBids.length}
            icon={<StarIcon boxSize={5} color='cyan.400' />}
            color='cyber'
            index={2}
          />
          <StatCard
            label='Times Outbid'
            value={outbidBids.length}
            icon={<TriangleDownIcon boxSize={5} color='red.400' />}
            color='red'
            index={3}
          />
        </SimpleGrid>

        {/* Won Auctions */}
        {wonBids.length > 0 && (
          <Box mb={8}>
            <HStack justify='space-between' mb={4}>
              <HStack spacing={2}>
                <StarIcon color='gold.400' boxSize={4} />
                <Heading size='md'>Auctions You Won</Heading>
              </HStack>
              <Button
                size='sm'
                variant='ghost'
                color='gold.400'
                onClick={() => router.push("/history")}
              >
                View All →
              </Button>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {wonBids.map((bid) => (
                <Box
                  key={bid._id}
                  bg='dark.700'
                  border='1px solid'
                  borderColor='gold.600'
                  borderRadius='xl'
                  p={4}
                  cursor='pointer'
                  onClick={() =>
                    bid.auction?._id &&
                    router.push(`/auctions/${bid.auction._id}`)
                  }
                  _hover={{
                    borderColor: "gold.400",
                    transform: "translateY(-2px)",
                  }}
                  transition='all 0.2s'
                  position='relative'
                  overflow='hidden'
                >
                  <Box
                    position='absolute'
                    top={0}
                    left={0}
                    right={0}
                    h='3px'
                    bg='linear-gradient(90deg, transparent, #FFD700, transparent)'
                  />
                  <HStack justify='space-between' mb={3}>
                    <Badge colorScheme='yellow' fontSize='2xs' px={2} py={0.5}>
                      🏆 WON
                    </Badge>
                    <Text fontSize='xs' color='whiteAlpha.400'>
                      {formatDistanceToNow(new Date(bid.createdAt), {
                        addSuffix: true,
                      })}
                    </Text>
                  </HStack>
                  <Text
                    fontWeight={700}
                    fontSize='sm'
                    noOfLines={2}
                    mb={3}
                    lineHeight={1.4}
                  >
                    {bid.auction?.title || "Auction"}
                  </Text>
                  <HStack justify='space-between' align='flex-end'>
                    <Box>
                      <Text fontSize='10px' color='whiteAlpha.400' mb={0.5}>
                        WINNING BID
                      </Text>
                      <HStack spacing={1} align='baseline'>
                        <Text fontWeight={800} color='gold.400' fontSize='2xl'>
                          {bid.amount}
                        </Text>
                        <Text fontSize='xs' color='whiteAlpha.400'>
                          cr
                        </Text>
                      </HStack>
                    </Box>
                    {bid.auction?.category && (
                      <Badge
                        colorScheme='purple'
                        fontSize='2xs'
                        variant='subtle'
                      >
                        {bid.auction.category}
                      </Badge>
                    )}
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Active Bids */}
        {activeBids.length > 0 && (
          <Box mb={8}>
            <HStack justify='space-between' mb={4}>
              <Heading size='md'>Your Active Bids</Heading>
              <Button
                size='sm'
                variant='ghost'
                color='brand.400'
                onClick={() => router.push("/history")}
              >
                View All →
              </Button>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {activeBids.slice(0, 3).map((bid) => (
                <AuctionCard
                  key={bid._id}
                  auction={bid.auction}
                  isMyLead={true}
                  onBidClick={() =>
                    router.push(`/auctions/${bid.auction?._id}`)
                  }
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Recent Bid History */}
        <Box
          bg='dark.700'
          border='1px solid'
          borderColor='whiteAlpha.100'
          borderRadius='xl'
          p={5}
        >
          <Flex justify='space-between' align='center' mb={4}>
            <Heading size='sm'>Recent Bid History</Heading>
            <Button
              size='xs'
              variant='ghost'
              color='brand.400'
              onClick={() => router.push("/history")}
            >
              View All →
            </Button>
          </Flex>

          {loading ? (
            <Center py={8}>
              <Spinner color='brand.500' />
            </Center>
          ) : bids.length === 0 ? (
            <Center py={10}>
              <VStack>
                <SearchIcon boxSize={8} color='whiteAlpha.300' />
                <Text color='whiteAlpha.400' textAlign='center'>
                  No bids yet
                </Text>
                <Button
                  size='sm'
                  colorScheme='brand'
                  mt={2}
                  onClick={() => router.push("/auctions")}
                >
                  Place Your First Bid
                </Button>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={0} align='stretch'>
              {bids.slice(0, 8).map((bid, i) => (
                <Box key={bid._id}>
                  <HStack
                    py={3}
                    px={1}
                    _hover={{ bg: "whiteAlpha.50" }}
                    borderRadius='lg'
                  >
                    <Box flex={1} minW={0}>
                      <Text fontSize='sm' fontWeight={600} noOfLines={1}>
                        {bid.auction?.title || "Auction Ended"}
                      </Text>
                      <Text fontSize='xs' color='whiteAlpha.400'>
                        {formatDistanceToNow(new Date(bid.createdAt), {
                          addSuffix: true,
                        })}
                      </Text>
                    </Box>
                    <VStack spacing={1} align='end'>
                      <Text fontWeight={700} color='gold.400' fontSize='sm'>
                        {bid.amount} cr
                      </Text>
                      <Badge
                        colorScheme={
                          bid.status === "active"
                            ? "green"
                            : bid.status === "won"
                              ? "yellow"
                              : bid.status === "outbid"
                                ? "red"
                                : "gray"
                        }
                        fontSize='2xs'
                      >
                        {bid.status}
                      </Badge>
                    </VStack>
                  </HStack>
                  {i < bids.slice(0, 8).length - 1 && (
                    <Divider borderColor='whiteAlpha.50' />
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </MotionBox>
    </Container>
  );
}
