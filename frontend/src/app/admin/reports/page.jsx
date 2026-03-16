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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Center,
  VStack,
  useToast,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";

const MotionBox = motion(Box);

const STATUS_COLORS = {
  pending: "yellow",
  active: "green",
  ended: "gray",
  cancelled: "red",
};
const BAR_COLORS = {
  active: "#6C63FF",
  ended: "#00D4FF",
  pending: "#FFD700",
  cancelled: "#FC8181",
};

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
        <Text fontSize='xs' color='whiteAlpha.600' mb={1}>
          {label}
        </Text>
        {payload.map((p) => (
          <Text key={p.dataKey} fontSize='sm' fontWeight={700} color={p.fill}>
            {p.dataKey}: {p.value}
          </Text>
        ))}
      </Box>
    );
  }
  return null;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const toast = useToast();
  const router = useRouter();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getReports({ page, limit: 10 });
      setReports(data.data);
    } catch (err) {
      toast({
        title: "Failed to load reports",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page]);

  if (loading) {
    return (
      <Center minH='calc(100vh - 64px)'>
        <Spinner size='xl' color='brand.500' thickness='3px' />
      </Center>
    );
  }

  const auctions = reports?.auctions || [];
  const totalPages = Math.ceil((reports?.total || 0) / 10);

  // Chart data: group by status
  const statusSummary = auctions.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(statusSummary).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <Container maxW='6xl' py={8} px={4}>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Flex justify='space-between' align='center' mb={6}>
          <Box>
            <Heading size='lg' mb={1}>
              Reports
            </Heading>
            <Text color='whiteAlpha.500'>Auction performance overview</Text>
          </Box>
        </Flex>

        {/* Summary Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
          {[
            {
              label: "Total Auctions",
              value: reports?.total || 0,
              color: "brand.400",
            },
            {
              label: "Total Bids",
              value: reports?.totalBids || 0,
              color: "gold.400",
            },
            {
              label: "Highest Bid",
              value: `${reports?.highestBid || 0} cr`,
              color: "cyber.400",
            },
            {
              label: "Avg Bids / Auction",
              value: reports?.avgBids?.toFixed(1) || "0.0",
              color: "green.400",
            },
          ].map((s) => (
            <Box
              key={s.label}
              bg='dark.700'
              border='1px solid'
              borderColor='whiteAlpha.100'
              borderRadius='xl'
              p={4}
            >
              <Stat>
                <StatLabel color='whiteAlpha.500' fontSize='xs'>
                  {s.label}
                </StatLabel>
                <StatNumber fontSize='xl' color={s.color}>
                  {s.value}
                </StatNumber>
              </Stat>
            </Box>
          ))}
        </SimpleGrid>

        {/* Bar chart */}
        {chartData.length > 0 && (
          <Box
            bg='dark.700'
            border='1px solid'
            borderColor='whiteAlpha.100'
            borderRadius='xl'
            p={5}
            mb={7}
          >
            <Heading size='sm' mb={5}>
              Auctions by Status
            </Heading>
            <ResponsiveContainer width='100%' height={180}>
              <BarChart data={chartData} margin={{ left: -20 }}>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='rgba(255,255,255,0.05)'
                />
                <XAxis
                  dataKey='status'
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey='count' radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={BAR_COLORS[entry.status] || "#6C63FF"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* Auctions Table */}
        <Box
          bg='dark.700'
          border='1px solid'
          borderColor='whiteAlpha.100'
          borderRadius='xl'
          overflow='hidden'
        >
          <Box p={4} borderBottom='1px solid' borderColor='whiteAlpha.100'>
            <Heading size='sm'>Auction Details</Heading>
          </Box>
          {auctions.length === 0 ? (
            <Center py={12}>
              <Text color='whiteAlpha.400'>No auctions to report</Text>
            </Center>
          ) : (
            <Box overflowX='auto'>
              <Table size='sm' variant='unstyled'>
                <Thead>
                  <Tr borderBottom='1px solid' borderColor='whiteAlpha.100'>
                    <Th color='whiteAlpha.400' fontSize='xs' p={3}>
                      AUCTION
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs' p={3}>
                      STATUS
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs' p={3} isNumeric>
                      BIDS
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs' p={3} isNumeric>
                      FINAL BID
                    </Th>
                    <Th
                      color='whiteAlpha.400'
                      fontSize='xs'
                      p={3}
                      display={{ base: "none", sm: "table-cell" }}
                    >
                      WINNER
                    </Th>
                    <Th
                      color='whiteAlpha.400'
                      fontSize='xs'
                      p={3}
                      display={{ base: "none", sm: "table-cell" }}
                    >
                      CLOSED
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {auctions.map((a) => (
                    <Tr
                      key={a._id}
                      borderBottom='1px solid'
                      borderColor='whiteAlpha.50'
                      cursor='pointer'
                      _hover={{ bg: "whiteAlpha.100" }}
                      onClick={() => router.push(`/admin/auctions/${a._id}`)}
                    >
                      <Td p={3}>
                        <Text
                          fontSize='sm'
                          fontWeight={600}
                          noOfLines={1}
                          maxW='200px'
                          color='blue.300'
                          _hover={{ textDecoration: "underline" }}
                        >
                          {a.title}
                        </Text>
                        <Text fontSize='xs' color='whiteAlpha.400'>
                          {a.category}
                        </Text>
                      </Td>
                      <Td p={3}>
                        <Badge
                          colorScheme={STATUS_COLORS[a.status] || "gray"}
                          fontSize='2xs'
                        >
                          {a.status}
                        </Badge>
                      </Td>
                      <Td p={3} isNumeric>
                        <Text fontSize='sm'>{a.totalBids}</Text>
                      </Td>
                      <Td p={3} isNumeric>
                        <Text fontSize='sm' fontWeight={700} color='gold.400'>
                          {a.winningBid || a.currentBid || a.minBid} cr
                        </Text>
                      </Td>
                      <Td p={3} display={{ base: "none", sm: "table-cell" }}>
                        <Text
                          fontSize='sm'
                          color={a.winner ? "brand.300" : "whiteAlpha.300"}
                        >
                          {a.winner?.name || "—"}
                        </Text>
                      </Td>
                      <Td p={3} display={{ base: "none", sm: "table-cell" }}>
                        <Text fontSize='xs' color='whiteAlpha.400'>
                          {a.closedAt
                            ? format(new Date(a.closedAt), "MMM d, yyyy")
                            : "—"}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>

        {/* Pagination */}
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
