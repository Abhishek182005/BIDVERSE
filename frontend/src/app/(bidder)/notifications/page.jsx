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
  Flex,
  Divider,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  WarningIcon,
  StarIcon,
  SunIcon,
  BellIcon,
  TimeIcon,
  CloseIcon,
  InfoIcon,
} from "@chakra-ui/icons";
import { Icon } from "@chakra-ui/react";
import { useNotifications } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";

const MotionBox = motion(Box);

const TYPE_ICONS = {
  outbid: WarningIcon,
  won: StarIcon,
  lost: CloseIcon,
  auction_started: BellIcon,
  auction_ended: TimeIcon,
  credits_assigned: SunIcon,
};

const TYPE_COLORS = {
  outbid: "red",
  won: "yellow",
  lost: "gray",
  auction_started: "green",
  auction_ended: "gray",
  credits_assigned: "yellow",
};

export default function NotificationsPage() {
  const { notifications, fetchNotifications, markAllRead, markRead } =
    useNotifications();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
  }, []);

  const unread = notifications.filter((n) => !n.read);

  return (
    <Container maxW='2xl' py={8} px={4}>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Flex justify='space-between' align='center' mb={6}>
          <Box>
            <Heading size='lg' mb={1}>
              Notifications
            </Heading>
            <Text color='whiteAlpha.500'>
              {unread.length > 0 ? `${unread.length} unread` : "All caught up!"}
            </Text>
          </Box>
          {unread.length > 0 && (
            <Button
              size='sm'
              variant='ghost'
              color='brand.400'
              onClick={markAllRead}
            >
              Mark all read
            </Button>
          )}
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
          ) : notifications.length === 0 ? (
            <Center py={16}>
              <VStack>
                <BellIcon boxSize={10} color='whiteAlpha.400' mb={3} />
                <Text color='whiteAlpha.400'>No notifications yet</Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={0} align='stretch'>
              {notifications.map((notif, i) => (
                <Box key={notif._id}>
                  <Box
                    px={5}
                    py={4}
                    bg={
                      !notif.read ? "rgba(108, 99, 255, 0.08)" : "transparent"
                    }
                    _hover={{ bg: "whiteAlpha.50" }}
                    cursor='pointer'
                    onClick={() => !notif.read && markRead([notif._id])}
                    transition='background 0.2s'
                  >
                    <HStack align='start' spacing={3}>
                      <Icon
                        as={TYPE_ICONS[notif.type] || InfoIcon}
                        boxSize={4}
                        color={`${TYPE_COLORS[notif.type] || "gray"}.400`}
                        mt={1}
                        flexShrink={0}
                      />
                      <Box flex={1}>
                        <HStack justify='space-between' mb={1}>
                          <Text
                            fontSize='sm'
                            fontWeight={!notif.read ? 700 : 500}
                          >
                            {notif.title}
                          </Text>
                          <HStack spacing={2}>
                            {!notif.read && (
                              <Box
                                w={2}
                                h={2}
                                borderRadius='full'
                                bg='brand.400'
                                flexShrink={0}
                              />
                            )}
                            <Badge
                              colorScheme={TYPE_COLORS[notif.type] || "gray"}
                              fontSize='2xs'
                            >
                              {notif.type?.replace("_", " ")}
                            </Badge>
                          </HStack>
                        </HStack>
                        <Text fontSize='sm' color='whiteAlpha.600' mb={1}>
                          {notif.message}
                        </Text>
                        <Text fontSize='xs' color='whiteAlpha.400'>
                          {formatDistanceToNow(new Date(notif.createdAt), {
                            addSuffix: true,
                          })}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                  {i < notifications.length - 1 && (
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
