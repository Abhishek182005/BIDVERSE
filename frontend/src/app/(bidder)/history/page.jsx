"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Heading,
  Text,
  Box,
  VStack,
  HStack,
  Badge,
  Button,
  Spinner,
  Center,
  Flex,
  Select,
  Divider,
  Avatar,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  StarIcon,
  CloseIcon,
  TriangleUpIcon,
  RepeatClockIcon,
  SearchIcon,
} from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import { bidsApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

const MotionBox = motion(Box);

const STATUS_COLORS = {
  active: "green",
  outbid: "red",
  won: "yellow",
  returned: "gray",
};

const STATUS_LABELS = {
  active: "Leading",
  outbid: "Outbid",
  won: "Won",
  returned: "Returned",
};

export default function BidHistoryPage() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const fetchBids = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filter) params.status = filter;
      const { data } = await bidsApi.getMyBids(params);
      setBids(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load bid history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [page, filter]);

  const totalPages = Math.ceil(total / 15);

  return (
    <Container maxW='3xl' py={8} px={4}>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Flex
          justify='space-between'
          align='center'
          mb={6}
          flexWrap='wrap'
          gap={3}
        >
          <Box>
            <Heading size='lg' mb={1}>
              Bid History
            </Heading>
            <Text color='whiteAlpha.500'>{total} total bids placed</Text>
          </Box>
          <Select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            maxW='160px'
            bg='dark.700'
            border='1px solid'
            borderColor='whiteAlpha.200'
            _focus={{ borderColor: "brand.400" }}
            size='sm'
          >
            <option value=''>All Status</option>
            <option value='active'>Leading</option>
            <option value='outbid'>Outbid</option>
            <option value='won'>Won</option>
          </Select>
        </Flex>

        <Box
          bg='dark.700'
          border='1px solid'
          borderColor='whiteAlpha.100'
          borderRadius='xl'
          overflow='hidden'
        >
          {loading ? (
            <Center py={16}>
              <Spinner color='brand.500' />
            </Center>
          ) : bids.length === 0 ? (
            <Center py={16}>
              <VStack>
                <SearchIcon boxSize={8} color='whiteAlpha.300' />
                <Text color='whiteAlpha.400'>No bids found</Text>
                <Button
                  size='sm'
                  colorScheme='brand'
                  mt={2}
                  onClick={() => router.push("/auctions")}
                >
                  Browse Auctions
                </Button>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={0} align='stretch'>
              {bids.map((bid, i) => (
                <Box key={bid._id}>
                  <HStack
                    px={5}
                    py={4}
                    _hover={{ bg: "whiteAlpha.50" }}
                    cursor={bid.auction ? "pointer" : "default"}
                    onClick={() =>
                      bid.auction && router.push(`/auctions/${bid.auction._id}`)
                    }
                  >
                    {/* Status Icon */}
                    <Box w='28px' flexShrink={0}>
                      {bid.status === "won" ? (
                        <StarIcon color='gold.400' boxSize={4} />
                      ) : bid.status === "outbid" ? (
                        <CloseIcon color='red.400' boxSize={3.5} />
                      ) : bid.status === "active" ? (
                        <TriangleUpIcon color='green.400' boxSize={4} />
                      ) : (
                        <RepeatClockIcon color='whiteAlpha.400' boxSize={4} />
                      )}
                    </Box>

                    {/* Auction Info */}
                    <Box flex={1} minW={0}>
                      <Text fontSize='sm' fontWeight={600} noOfLines={1}>
                        {bid.auction?.title || "Deleted Auction"}
                      </Text>
                      <Text fontSize='xs' color='whiteAlpha.400'>
                        {formatDistanceToNow(new Date(bid.createdAt), {
                          addSuffix: true,
                        })}
                      </Text>
                    </Box>

                    {/* Amount + Status */}
                    <VStack spacing={1} align='end' flexShrink={0}>
                      <Text fontWeight={700} color='gold.400' fontSize='sm'>
                        {bid.amount} cr
                      </Text>
                      <Badge
                        colorScheme={STATUS_COLORS[bid.status] || "gray"}
                        fontSize='2xs'
                        px={2}
                      >
                        {STATUS_LABELS[bid.status] || bid.status}
                      </Badge>
                    </VStack>
                  </HStack>
                  {i < bids.length - 1 && (
                    <Divider borderColor='whiteAlpha.50' />
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        {totalPages > 1 && (
          <HStack justify='center' mt={5} spacing={2}>
            <Button
              size='sm'
              variant='ghost'
              isDisabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </Button>
            <Text fontSize='sm' color='whiteAlpha.500'>
              Page {page} of {totalPages}
            </Text>
            <Button
              size='sm'
              variant='ghost'
              isDisabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </Button>
          </HStack>
        )}
      </MotionBox>
    </Container>
  );
}
