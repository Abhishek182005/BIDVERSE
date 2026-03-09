"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Badge,
  Spinner,
  Center,
  Flex,
  Button,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { adminApi } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import StatCard from "@/components/ui/StatCard";
import {
  EditIcon,
  TriangleUpIcon,
  AtSignIcon,
  ViewIcon,
} from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

const MotionBox = motion(Box);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        bg='dark.700'
        p={3}
        borderRadius='lg'
        border='1px solid'
        borderColor='brand.500'
      >
        <Text fontSize='xs' color='whiteAlpha.600'>
          {label}
        </Text>
        <Text fontWeight={700} color='brand.300'>
          {payload[0]?.value} bids
        </Text>
      </Box>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { on } = useSocket();
  const router = useRouter();

  const fetchStats = async () => {
    try {
      const { data } = await adminApi.getStats();
      setStats(data.data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Refresh stats on new bids
  useEffect(() => {
    const cleanup = on("live_bid_update", () => {
      fetchStats();
    });
    return cleanup;
  }, [on]);

  if (loading) {
    return (
      <Center minH='calc(100vh - 64px)'>
        <VStack>
          <Spinner size='xl' color='brand.500' thickness='3px' />
          <Text color='whiteAlpha.500'>Loading dashboard...</Text>
        </VStack>
      </Center>
    );
  }

  const chartData =
    stats?.bidsPerDay?.map((d) => ({
      date: d._id,
      bids: d.count,
    })) || [];

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
          <Box>
            <Heading size='lg' mb={1}>
              Admin Dashboard
            </Heading>
            <Text color='whiteAlpha.500'>
              Real-time overview of all auction activity
            </Text>
          </Box>
          <HStack>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.push("/admin/auctions/create")}
            >
              + New Auction
            </Button>
            <Button
              colorScheme='brand'
              variant='solid'
              size='sm'
              onClick={fetchStats}
            >
              Refresh
            </Button>
          </HStack>
        </Flex>

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
          <StatCard
            label='Total Auctions'
            value={stats?.auctions?.total || 0}
            icon={<EditIcon boxSize={5} color='brand.300' />}
            color='brand'
            index={0}
            helpText={`${stats?.auctions?.active || 0} live now`}
          />
          <StatCard
            label='Active Now'
            value={stats?.auctions?.active || 0}
            icon={<TriangleUpIcon boxSize={5} color='green.400' />}
            color='green'
            index={1}
            helpText={`${stats?.auctions?.pending || 0} pending`}
          />
          <StatCard
            label='Total Bidders'
            value={stats?.bidders?.total || 0}
            icon={<AtSignIcon boxSize={5} color='cyan.400' />}
            color='cyber'
            index={2}
            helpText={`${(stats?.bidders?.totalCreditsInCirculation || 0).toLocaleString()} credits`}
          />
          <StatCard
            label='Total Bids'
            value={stats?.bids?.total || 0}
            icon={<ViewIcon boxSize={5} color='gold.400' />}
            color='gold'
            index={3}
          />
        </SimpleGrid>

        {/* Charts + Recent Bids */}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={8}>
          {/* Bids Chart */}
          <Box
            bg='dark.700'
            border='1px solid'
            borderColor='whiteAlpha.100'
            borderRadius='xl'
            p={5}
            gridColumn={{ lg: "span 2" }}
          >
            <Heading size='sm' mb={5}>
              Bids in Last 7 Days
            </Heading>
            {chartData.length > 0 ? (
              <ResponsiveContainer width='100%' height={220}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id='bidGradient'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='5%' stopColor='#6C63FF' stopOpacity={0.3} />
                      <stop offset='95%' stopColor='#6C63FF' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='rgba(255,255,255,0.05)'
                  />
                  <XAxis
                    dataKey='date'
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type='monotone'
                    dataKey='bids'
                    stroke='#6C63FF'
                    strokeWidth={2}
                    fill='url(#bidGradient)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Center h='220px'>
                <Text color='whiteAlpha.400' fontSize='sm'>
                  No bid data yet
                </Text>
              </Center>
            )}
          </Box>

          {/* Top Auctions */}
          <Box
            bg='dark.700'
            border='1px solid'
            borderColor='whiteAlpha.100'
            borderRadius='xl'
            p={5}
          >
            <Heading size='sm' mb={4}>
              Top Auctions
            </Heading>
            <VStack spacing={3} align='stretch'>
              {(stats?.topAuctions || []).slice(0, 5).map((a, i) => (
                <HStack
                  key={a._id}
                  p={2}
                  borderRadius='lg'
                  _hover={{ bg: "whiteAlpha.100" }}
                  cursor='pointer'
                  onClick={() => router.push(`/admin/auctions/${a._id}`)}
                >
                  <Text fontSize='lg' w='24px'>
                    {["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}
                  </Text>
                  <Box flex={1} minW={0}>
                    <Text fontSize='sm' fontWeight={600} noOfLines={1}>
                      {a.title}
                    </Text>
                    <Text fontSize='xs' color='whiteAlpha.400'>
                      {a.totalBids} bids
                    </Text>
                  </Box>
                  <Badge
                    colorScheme={a.status === "active" ? "green" : "gray"}
                    fontSize='xs'
                  >
                    {a.status}
                  </Badge>
                </HStack>
              ))}
              {(!stats?.topAuctions || stats.topAuctions.length === 0) && (
                <Text
                  color='whiteAlpha.400'
                  fontSize='sm'
                  textAlign='center'
                  py={4}
                >
                  No auctions yet
                </Text>
              )}
            </VStack>
          </Box>
        </SimpleGrid>

        {/* Recent Bids */}
        <Box
          bg='dark.700'
          border='1px solid'
          borderColor='whiteAlpha.100'
          borderRadius='xl'
          p={5}
        >
          <Flex justify='space-between' align='center' mb={4}>
            <Heading size='sm'>Recent Bids</Heading>
            <Button
              size='xs'
              variant='ghost'
              color='brand.400'
              onClick={() => router.push("/admin/reports")}
            >
              View All Reports →
            </Button>
          </Flex>

          {(stats?.recentBids || []).length === 0 ? (
            <Center py={8}>
              <Text color='whiteAlpha.400' fontSize='sm'>
                No bids placed yet
              </Text>
            </Center>
          ) : (
            <Box overflowX='auto'>
              <Table size='sm' variant='unstyled'>
                <Thead>
                  <Tr>
                    <Th color='whiteAlpha.400' fontSize='xs' pb={3}>
                      BIDDER
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs' pb={3}>
                      AUCTION
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs' pb={3} isNumeric>
                      AMOUNT
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs' pb={3}>
                      TIME
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {(stats.recentBids || []).map((bid) => (
                    <Tr
                      key={bid._id}
                      _hover={{ bg: "whiteAlpha.50" }}
                      borderRadius='lg'
                    >
                      <Td py={2}>
                        <HStack>
                          <Avatar
                            name={bid.bidder?.name}
                            size='xs'
                            bg='brand.500'
                          />
                          <Text fontSize='sm'>{bid.bidder?.name}</Text>
                        </HStack>
                      </Td>
                      <Td py={2}>
                        <Text
                          fontSize='sm'
                          color='whiteAlpha.700'
                          noOfLines={1}
                          maxW='150px'
                        >
                          {bid.auction?.title}
                        </Text>
                      </Td>
                      <Td py={2} isNumeric>
                        <Text fontWeight={700} color='gold.400' fontSize='sm'>
                          {bid.amount} cr
                        </Text>
                      </Td>
                      <Td py={2}>
                        <Text fontSize='xs' color='whiteAlpha.400'>
                          {formatDistanceToNow(new Date(bid.createdAt), {
                            addSuffix: true,
                          })}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
      </MotionBox>
    </Container>
  );
}
