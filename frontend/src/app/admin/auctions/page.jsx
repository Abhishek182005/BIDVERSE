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

const MotionBox = motion(Box);

const STATUS_COLORS = {
  pending: "yellow",
  active: "green",
  ended: "gray",
  cancelled: "red",
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
        <HStack mb={5} gap={3} flexWrap='wrap'>
          <InputGroup maxW='260px'>
            <InputLeftElement pointerEvents='none'>
              <Text color='whiteAlpha.400' fontSize='sm'>
                🔍
              </Text>
            </InputLeftElement>
            <Input
              placeholder='Search auctions...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              bg='dark.700'
              border='1px solid'
              borderColor='whiteAlpha.200'
              _focus={{ borderColor: "brand.400" }}
            />
          </InputGroup>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            maxW='160px'
            bg='dark.700'
            border='1px solid'
            borderColor='whiteAlpha.200'
            _focus={{ borderColor: "brand.400" }}
          >
            <option value=''>All Statuses</option>
            <option value='pending'>Pending</option>
            <option value='active'>Active</option>
            <option value='ended'>Ended</option>
            <option value='cancelled'>Cancelled</option>
          </Select>
        </HStack>

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
                  <Tr borderBottom='1px solid' borderColor='whiteAlpha.100'>
                    <Th color='whiteAlpha.400' fontSize='xs'>
                      AUCTION
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs'>
                      CATEGORY
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs'>
                      STATUS
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs' isNumeric>
                      CURRENT BID
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs' isNumeric>
                      BIDS
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs'>
                      END TIME
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs'>
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
                      _hover={{ bg: "whiteAlpha.50" }}
                    >
                      <Td py={3}>
                        <HStack spacing={3}>
                          <Box
                            w='40px'
                            h='40px'
                            borderRadius='md'
                            overflow='hidden'
                            flexShrink={0}
                            bg='dark.600'
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
                                <Text>🔨</Text>
                              </Center>
                            )}
                          </Box>
                          <Box>
                            <Text
                              fontSize='sm'
                              fontWeight={600}
                              noOfLines={1}
                              maxW='180px'
                            >
                              {auction.title}
                            </Text>
                            <Text fontSize='xs' color='whiteAlpha.400'>
                              {format(
                                new Date(auction.startTime),
                                "MMM d, yyyy",
                              )}
                            </Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td py={3}>
                        <Badge
                          variant='outline'
                          colorScheme='purple'
                          fontSize='2xs'
                        >
                          {auction.category}
                        </Badge>
                      </Td>
                      <Td py={3}>
                        <Badge
                          colorScheme={STATUS_COLORS[auction.status] || "gray"}
                        >
                          {auction.status}
                        </Badge>
                      </Td>
                      <Td py={3} isNumeric>
                        <Text fontWeight={700} color='gold.400' fontSize='sm'>
                          {auction.currentBid || auction.minBid} cr
                        </Text>
                      </Td>
                      <Td py={3} isNumeric>
                        <Text fontSize='sm'>{auction.totalBids}</Text>
                      </Td>
                      <Td py={3}>
                        <Text fontSize='xs' color='whiteAlpha.500'>
                          {format(new Date(auction.endTime), "MMM d, HH:mm")}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <HStack spacing={1}>
                          <Tooltip label='View/Monitor'>
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
                          {auction.status === "pending" && (
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
