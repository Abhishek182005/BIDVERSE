"use client";

import {
  Box,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  VStack,
  Text,
  HStack,
  Badge,
  Button,
  Divider,
} from "@chakra-ui/react";
import {
  BellIcon,
  WarningIcon,
  StarIcon,
  SunIcon,
  TimeIcon,
  CloseIcon,
  Icon,
} from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { useNotifications } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

const MotionBox = motion(Box);

const typeColors = {
  outbid: "orange",
  won: "green",
  credits_assigned: "yellow",
  auction_started: "blue",
  auction_ended: "gray",
  lost: "red",
};

const typeIcons = {
  outbid: WarningIcon,
  won: StarIcon,
  credits_assigned: SunIcon,
  auction_started: BellIcon,
  auction_ended: TimeIcon,
  lost: CloseIcon,
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const router = useRouter();

  return (
    <Popover placement='bottom-end'>
      <PopoverTrigger>
        <Box position='relative'>
          <IconButton
            icon={<BellIcon />}
            variant='ghost'
            size='sm'
            aria-label='Notifications'
          />
          {unreadCount > 0 && (
            <MotionBox
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              position='absolute'
              top='-2px'
              right='-2px'
              bg='red.500'
              color='white'
              borderRadius='full'
              w='18px'
              h='18px'
              display='flex'
              alignItems='center'
              justifyContent='center'
              fontSize='10px'
              fontWeight={700}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </MotionBox>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent
        bg='dark.700'
        border='1px solid'
        borderColor='whiteAlpha.200'
        w='340px'
        maxH='480px'
      >
        <PopoverHeader borderColor='whiteAlpha.100'>
          <HStack justify='space-between'>
            <Text fontWeight={600}>Notifications</Text>
            {unreadCount > 0 && (
              <Button
                size='xs'
                variant='ghost'
                color='brand.400'
                onClick={markAllRead}
              >
                Mark all read
              </Button>
            )}
          </HStack>
        </PopoverHeader>
        <PopoverBody p={0} overflowY='auto' maxH='360px' className='bid-scroll'>
          {notifications.length === 0 ? (
            <Box p={6} textAlign='center'>
              <BellIcon boxSize={8} color='whiteAlpha.400' mb={2} />
              <Text color='whiteAlpha.500' fontSize='sm'>
                No notifications yet
              </Text>
            </Box>
          ) : (
            <VStack
              spacing={0}
              divider={<Divider borderColor='whiteAlpha.100' />}
            >
              {notifications.slice(0, 10).map((notif) => (
                <Box
                  key={notif._id}
                  w='100%'
                  p={4}
                  bg={notif.read ? "transparent" : "whiteAlpha.50"}
                  _hover={{ bg: "whiteAlpha.100" }}
                  cursor='pointer'
                  onClick={() =>
                    notif.auction &&
                    router.push(
                      `/auctions/${notif.auction._id || notif.auction}`,
                    )
                  }
                >
                  <HStack align='flex-start' spacing={3}>
                    <Icon
                      as={typeIcons[notif.type] || BellIcon}
                      boxSize={4}
                      color={`${typeColors[notif.type] || "gray"}.400`}
                      mt={0.5}
                      flexShrink={0}
                    />
                    <Box flex={1} minW={0}>
                      <HStack justify='space-between' mb={0.5}>
                        <Text fontSize='sm' fontWeight={600} noOfLines={1}>
                          {notif.title}
                        </Text>
                        {!notif.read && (
                          <Box
                            w='6px'
                            h='6px'
                            bg='brand.500'
                            borderRadius='full'
                            flexShrink={0}
                          />
                        )}
                      </HStack>
                      <Text fontSize='xs' color='whiteAlpha.600' noOfLines={2}>
                        {notif.message}
                      </Text>
                      <Text fontSize='xs' color='whiteAlpha.400' mt={1}>
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                        })}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </PopoverBody>
        <PopoverFooter borderColor='whiteAlpha.100'>
          <Button
            size='sm'
            variant='ghost'
            w='100%'
            onClick={() => router.push("/notifications")}
          >
            View All Notifications
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}
