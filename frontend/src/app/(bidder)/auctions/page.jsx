"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Heading,
  Text,
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Center,
  Button,
  Flex,
  Badge,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { auctionsApi } from "@/lib/api";
import AuctionCard from "@/components/ui/AuctionCard";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";

const MotionBox = motion(Box);
const CATEGORIES = [
  "",
  "Electronics",
  "Art",
  "Collectibles",
  "Clothing",
  "Sports",
  "Jewellery",
  "Vehicles",
  "Other",
];

export default function BidderAuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();
  const { on } = useSocket();

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, status };
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await auctionsApi.getAll(params);
      setAuctions(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load auctions");
    } finally {
      setLoading(false);
    }
  }, [page, status, category]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Refresh when new bids come in (update current bid on cards)
  useEffect(() => {
    const cleanup = on("new_bid", (data) => {
      setAuctions((prev) =>
        prev.map((a) =>
          a._id === data.auctionId
            ? {
                ...a,
                currentBid: data.amount,
                currentBidder: { name: data.bidderName },
                totalBids: (a.totalBids || 0) + 1,
              }
            : a,
        ),
      );
    });
    return cleanup;
  }, [on]);

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setPage(1);
      fetchAuctions();
    }
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <Container maxW='7xl' py={8} px={4}>
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
              Browse Auctions
            </Heading>
            <Text color='whiteAlpha.500'>{total} auctions found</Text>
          </Box>
        </Flex>

        {/* Filters */}
        <Flex
          mb={6}
          gap={3}
          flexWrap='wrap'
          direction={{ base: "column", sm: "row" }}
          align={{ base: "stretch", sm: "center" }}
        >
          <InputGroup w={{ base: "100%", sm: "260px" }}>
            <InputLeftElement pointerEvents='none'>
              <Text color='whiteAlpha.400' fontSize='sm'>
                🔍
              </Text>
            </InputLeftElement>
            <Input
              placeholder='Search auctions...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              bg='dark.700'
              border='1px solid'
              borderColor='whiteAlpha.200'
              _focus={{ borderColor: "brand.400" }}
            />
          </InputGroup>

          {/* Status Tabs */}
          <HStack spacing={1} flexWrap='wrap'>
            {[
              { label: "Live", value: "active" },
              { label: "Upcoming", value: "pending" },
              { label: "Ended", value: "ended" },
            ].map((s) => (
              <Button
                key={s.value}
                size='sm'
                variant={status === s.value ? "solid" : "ghost"}
                colorScheme={status === s.value ? "brand" : undefined}
                onClick={() => {
                  setStatus(s.value);
                  setPage(1);
                }}
              >
                {s.label}
              </Button>
            ))}
          </HStack>

          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            w={{ base: "100%", sm: "160px" }}
            maxW='160px'
            bg='dark.700'
            border='1px solid'
            borderColor='whiteAlpha.200'
            _focus={{ borderColor: "brand.400" }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ background: "#1a1a2e" }}>
                {c || "All Categories"}
              </option>
            ))}
          </Select>
        </Flex>

        {loading ? (
          <Center py={20}>
            <Spinner size='xl' color='brand.500' thickness='3px' />
          </Center>
        ) : auctions.length === 0 ? (
          <Center py={20}>
            <VStack>
              <Text fontSize='4xl'>🔨</Text>
              <Text color='whiteAlpha.400' fontWeight={600} fontSize='lg'>
                No auctions found
              </Text>
              <Text color='whiteAlpha.300' fontSize='sm'>
                Try adjusting filters or check back later
              </Text>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
            {auctions.map((auction, i) => (
              <MotionBox
                key={auction._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <AuctionCard
                  auction={auction}
                  onBidClick={() => router.push(`/auctions/${auction._id}`)}
                />
              </MotionBox>
            ))}
          </SimpleGrid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <HStack justify='center' mt={8} spacing={2}>
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
