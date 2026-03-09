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
  Avatar,
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
  Switch,
  useDisclosure,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { adminApi } from "@/lib/api";
import UserCreditsModal from "@/components/admin/UserCreditsModal";

const MotionBox = motion(Box);

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      const { data } = await adminApi.getUsers(params);
      setUsers(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast({ title: "Failed to load users", status: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setPage(1);
      fetchUsers();
    }
  };

  const openCredits = (user) => {
    setSelected(user);
    onOpen();
  };

  const handleToggleStatus = async (user) => {
    setTogglingId(user._id);
    try {
      await adminApi.toggleUserStatus(user._id);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isActive: !u.isActive } : u,
        ),
      );
      toast({
        title: `User ${user.isActive ? "deactivated" : "activated"}`,
        status: "success",
        duration: 2000,
      });
    } catch (err) {
      toast({ title: "Status update failed", status: "error", duration: 3000 });
    } finally {
      setTogglingId(null);
    }
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <Container maxW='6xl' py={8} px={4}>
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
              Users
            </Heading>
            <Text color='whiteAlpha.500'>{total} registered bidders</Text>
          </Box>
        </Flex>

        {/* Search */}
        <InputGroup maxW='300px' mb={5}>
          <InputLeftElement pointerEvents='none'>
            <Text color='whiteAlpha.400' fontSize='sm'>
              🔍
            </Text>
          </InputLeftElement>
          <Input
            placeholder='Search by name or email...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            bg='dark.700'
            border='1px solid'
            borderColor='whiteAlpha.200'
            _focus={{ borderColor: "brand.400" }}
          />
        </InputGroup>

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
          ) : users.length === 0 ? (
            <Center py={16}>
              <VStack>
                <Text fontSize='3xl'>👥</Text>
                <Text color='whiteAlpha.400'>No users found</Text>
              </VStack>
            </Center>
          ) : (
            <Box overflowX='auto'>
              <Table variant='unstyled'>
                <Thead>
                  <Tr borderBottom='1px solid' borderColor='whiteAlpha.100'>
                    <Th color='whiteAlpha.400' fontSize='xs'>
                      USER
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs' isNumeric>
                      CREDITS
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs'>
                      STATUS
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs'>
                      JOINED
                    </Th>
                    <Th color='whiteAlpha.400' fontSize='xs'>
                      ACTIONS
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {users.map((user) => (
                    <Tr
                      key={user._id}
                      borderBottom='1px solid'
                      borderColor='whiteAlpha.50'
                      _hover={{ bg: "whiteAlpha.50" }}
                    >
                      <Td py={3}>
                        <HStack spacing={3}>
                          <Avatar name={user.name} size='sm' bg='brand.500' />
                          <Box>
                            <Text fontSize='sm' fontWeight={600}>
                              {user.name}
                            </Text>
                            <Text fontSize='xs' color='whiteAlpha.400'>
                              {user.email}
                            </Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td py={3} isNumeric>
                        <Text fontWeight={700} color='gold.400'>
                          {(user.credits || 0).toLocaleString()}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <Badge colorScheme={user.isActive ? "green" : "red"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </Td>
                      <Td py={3}>
                        <Text fontSize='xs' color='whiteAlpha.400'>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <HStack spacing={3}>
                          <Button
                            size='xs'
                            colorScheme='yellow'
                            variant='outline'
                            onClick={() => openCredits(user)}
                          >
                            Credits
                          </Button>
                          <Switch
                            isChecked={user.isActive}
                            onChange={() => handleToggleStatus(user)}
                            isDisabled={togglingId === user._id}
                            colorScheme='green'
                            size='sm'
                          />
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

      <UserCreditsModal
        isOpen={isOpen}
        onClose={onClose}
        user={selected}
        onSuccess={fetchUsers}
      />
    </Container>
  );
}
