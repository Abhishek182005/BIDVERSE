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
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Image,
  Spinner,
  Center,
  VStack,
  useToast,
  IconButton,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { auctionsApi } from "@/lib/api";
import { format } from "date-fns";
import { useRef } from "react";
import { StarIcon } from "@chakra-ui/icons";

const MotionBox = motion(Box);

const STATUS_COLORS = {
  pending: "yellow",
  active: "green",
  ended: "gray",
  cancelled: "red",
};

const STATUS_BAR = {
  pending: "#FFD700",
  active: "#22c55e",
  ended: "#6b7280",
  cancelled: "#ef4444",
};

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const router = useRouter();
  const toast = useToast();

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await auctionsApi.getAll(params);
      setAuctions(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast({
        title: "Failed to load auctions",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, [statusFilter, page]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") fetchAuctions();
  };

  const confirmDelete = (auction) => {
    setDeleteTarget(auction);
    onOpen();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await auctionsApi.delete(deleteTarget._id);
      toast({ title: "Auction deleted", status: "success", duration: 3000 });
      fetchAuctions();
    } catch (err) {
      toast({
        title: "Delete failed",
        description:
          err.response?.data?.message || "Cannot delete active/ended auctions",
        status: "error",
        duration: 4000,
      });
    } finally {
      setDeleting(false);
      onClose();
    }
  };

  const totalPages = Math.ceil(total / 10);

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
              Auctions
            </Heading>
            <Text color='whiteAlpha.500'>{total} total auctions</Text>
          </Box>
          <Button
            colorScheme='brand'
            onClick={() => router.push("/admin/auctions/create")}
          >
            + Create Auction
          </Button>
        </Flex>

        {/* Filters */}
        <Flex
          mb={5}
          gap={3}
          flexWrap='wrap'
          direction={{ base: "column", sm: "row" }}
          align={{ base: "stretch", sm: "center" }}
        >
          <InputGroup
            w={{ base: "100%", sm: "auto" }}
            maxW={{ base: "100%", sm: "300px" }}
            flex={{ sm: 1 }}
          >
            <InputLeftElement pointerEvents='none' pl={1}>
              <Text color='whiteAlpha.400' fontSize='sm'>
                🔍
              </Text>
            </InputLeftElement>
            <Input
              placeholder='Search auctions…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              bg='dark.700'
              border='1px solid'
              borderColor='whiteAlpha.200'
              _focus={{
                borderColor: "brand.400",
                boxShadow: "0 0 0 1px #1D72F5",
              }}
              borderRadius='lg'
            />
          </InputGroup>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            w={{ base: "100%", sm: "170px" }}
            maxW='170px'
            bg='dark.700'
            border='1px solid'
            borderColor='whiteAlpha.200'
            borderRadius='lg'
            _focus={{ borderColor: "brand.400" }}
          >
            <option value=''>All Statuses</option>
            <option value='pending'>Pending</option>
            <option value='active'>Active</option>
            <option value='ended'>Ended</option>
            <option value='cancelled'>Cancelled</option>
          </Select>
        </Flex>

        {/* Table */}
        <Box
          bg='dark.700'
          border='1px solid'
          borderColor='whiteAlpha.100'
          borderRadius='xl'
          overflow='hidden'
        >
          {loading ? (
            <Center py={16}>
              <Spinner size='lg' color='brand.500' />
            </Center>
          ) : auctions.length === 0 ? (
            <Center py={16}>
              <VStack>
                <Text fontSize='3xl'>🔨</Text>
                <Text color='whiteAlpha.400'>No auctions found</Text>
                <Button
                  size='sm'
                  colorScheme='brand'
                  mt={2}
                  onClick={() => router.push("/admin/auctions/create")}
                >
                  Create First Auction
                </Button>
              </VStack>
            </Center>
          ) : (
            <Box overflowX='auto'>
              <Table variant='unstyled'>
                <Thead>
                  <Tr
                    bg='whiteAlpha.50'
                    borderBottom='1px solid'
                    borderColor='whiteAlpha.100'
                  >
                    <Th color='whiteAlpha.500' fontSize='xs' py={3} pl={5}>
                      AUCTION
                    </Th>
                    <Th
                      color='whiteAlpha.500'
                      fontSize='xs'
                      py={3}
                      display={{ base: "none", md: "table-cell" }}
                    >
                      CATEGORY
                    </Th>
                    <Th color='whiteAlpha.500' fontSize='xs' py={3}>
                      STATUS
                    </Th>
                    <Th color='whiteAlpha.500' fontSize='xs' py={3} isNumeric>
                      CURRENT BID
                    </Th>
                    <Th color='whiteAlpha.500' fontSize='xs' py={3} isNumeric>
                      BIDS
                    </Th>
                    <Th
                      color='whiteAlpha.500'
                      fontSize='xs'
                      py={3}
                      display={{ base: "none", md: "table-cell" }}
                    >
                      WINNER
                    </Th>
                    <Th
                      color='whiteAlpha.500'
                      fontSize='xs'
                      py={3}
                      display={{ base: "none", sm: "table-cell" }}
                    >
                      END TIME
                    </Th>
                    <Th color='whiteAlpha.500' fontSize='xs' py={3}>
                      ACTIONS
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {auctions.map((auction) => (
                    <Tr
                      key={auction._id}
                      borderBottom='1px solid'
                      borderColor='whiteAlpha.50'
                      position='relative'
                      _hover={{ bg: "whiteAlpha.50" }}
                      transition='background 0.15s'
                    >
                      {/* Status stripe */}
                      <Td py={0} px={0} w='3px' verticalAlign='middle'>
                        <Box
                          h='60px'
                          w='3px'
                          bg={STATUS_BAR[auction.status] || "transparent"}
                          borderRadius='full'
                        />
                      </Td>
                      <Td py={3} pl={4}>
                        <HStack spacing={3}>
                          <Box
                            w='42px'
                            h='42px'
                            borderRadius='lg'
                            overflow='hidden'
                            flexShrink={0}
                            bg='dark.600'
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
                              <Center w='full' h='full'>
                                <Text fontSize='lg'>🔨</Text>
                              </Center>
                            )}
                          </Box>
                          <Box>
                            <Text
                              fontSize='sm'
                              fontWeight={700}
                              noOfLines={1}
                              maxW='200px'
                              cursor='pointer'
                              _hover={{ color: "brand.300" }}
                              onClick={() =>
                                router.push(`/admin/auctions/${auction._id}`)
                              }
                            >
                              {auction.title}
                            </Text>
                            <Text fontSize='xs' color='whiteAlpha.400' mt={0.5}>
                              {format(
                                new Date(auction.startTime),
                                "MMM d, yyyy",
                              )}
                            </Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td py={3} display={{ base: "none", md: "table-cell" }}>
                        <Badge
                          variant='subtle'
                          colorScheme='blue'
                          fontSize='2xs'
                          px={2}
                          py={0.5}
                          borderRadius='full'
                        >
                          {auction.category}
                        </Badge>
                      </Td>
                      <Td py={3}>
                        <Badge
                          colorScheme={STATUS_COLORS[auction.status] || "gray"}
                          px={2}
                          py={0.5}
                          borderRadius='full'
                          fontSize='2xs'
                          fontWeight={700}
                        >
                          {auction.status.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td py={3} isNumeric>
                        <Text fontWeight={800} color='gold.400' fontSize='sm'>
                          {auction.currentBid || auction.minBid} cr
                        </Text>
                      </Td>
                      <Td py={3} isNumeric>
                        <Text fontSize='sm' fontWeight={600}>
                          {auction.totalBids}
                        </Text>
                      </Td>
                      <Td py={3} display={{ base: "none", md: "table-cell" }}>
                        {auction.winner ? (
                          <HStack spacing={1}>
                            <StarIcon color='gold.400' boxSize={3} />
                            <Text
                              fontSize='sm'
                              color='gold.300'
                              fontWeight={600}
                            >
                              {auction.winner.name || "—"}
                            </Text>
                          </HStack>
                        ) : (
                          <Text fontSize='xs' color='whiteAlpha.300'>
                            —
                          </Text>
                        )}
                      </Td>
                      <Td py={3} display={{ base: "none", sm: "table-cell" }}>
                        <Text fontSize='xs' color='whiteAlpha.500'>
                          {format(new Date(auction.endTime), "MMM d, HH:mm")}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <HStack spacing={1}>
                          <Tooltip label='View Details'>
                            <IconButton
                              icon={<Text fontSize='sm'>👁</Text>}
                              size='xs'
                              variant='ghost'
                              onClick={() =>
                                router.push(`/admin/auctions/${auction._id}`)
                              }
                              aria-label='View auction'
                            />
                          </Tooltip>
                          {auction.status !== "ended" &&
                            auction.status !== "cancelled" && (
                              <Tooltip label='Edit'>
                                <IconButton
                                  icon={<Text fontSize='sm'>✏️</Text>}
                                  size='xs'
                                  variant='ghost'
                                  onClick={() =>
                                    router.push(
                                      `/admin/auctions/${auction._id}?edit=true`,
                                    )
                                  }
                                  aria-label='Edit auction'
                                />
                              </Tooltip>
                            )}
                          {(auction.status === "pending" ||
                            auction.status === "cancelled") && (
                            <Tooltip label='Delete'>
                              <IconButton
                                icon={<Text fontSize='sm'>🗑</Text>}
                                size='xs'
                                variant='ghost'
                                colorScheme='red'
                                onClick={() => confirmDelete(auction)}
                                aria-label='Delete auction'
                              />
                            </Tooltip>
                          )}
                        </HStack>
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

      {/* Delete Confirm Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay bg='blackAlpha.700' backdropFilter='blur(4px)'>
          <AlertDialogContent
            bg='dark.700'
            border='1px solid'
            borderColor='whiteAlpha.200'
          >
            <AlertDialogHeader>Delete Auction</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.title}</strong>? This action cannot be
              undone.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button
                ref={cancelRef}
                variant='ghost'
                size='sm'
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                colorScheme='red'
                size='sm'
                onClick={handleDelete}
                isLoading={deleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}
