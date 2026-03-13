"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Badge,
  Text,
  HStack,
  VStack,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/context/SocketContext";
import { bidsApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

const MotionTr = motion(Tr);

export default function LiveBidMonitor({ auctionId, initialBids = [] }) {
  const [bids, setBids] = useState(initialBids);
  const [flash, setFlash] = useState(null);
  const { on, joinAuction, leaveAuction } = useSocket();

  useEffect(() => {
    if (!auctionId) return;
    joinAuction(auctionId);

    const cleanup = on("new_bid", (data) => {
      if (data.auctionId !== auctionId) return;
      const newBid = {
        _id: Date.now().toString(),
        bidder: { name: data.bidderName },
        amount: data.amount,
        createdAt: new Date().toISOString(),
        status: "active",
        isNew: true,
      };
      setFlash(newBid._id);
      setBids((prev) => [newBid, ...prev.slice(0, 29)]);
      setTimeout(() => setFlash(null), 1500);
    });

    return () => {
      leaveAuction(auctionId);
      cleanup?.();
    };
  }, [auctionId]);

  return (
    <Box>
      <HStack mb={4} justify='space-between'>
        <Heading size='sm'>Live Bid Monitor</Heading>
        <HStack>
          <Box
            w={2}
            h={2}
            borderRadius='full'
            bg='green.400'
            sx={{ animation: "pulse 1.5s infinite" }}
          />
          <Text fontSize='xs' color='green.400'>
            Live
          </Text>
        </HStack>
      </HStack>

      {bids.length === 0 ? (
        <Center py={8}>
          <VStack>
            <SearchIcon boxSize={8} color='whiteAlpha.300' />
            <Text color='whiteAlpha.400' fontSize='sm'>
              Waiting for bids...
            </Text>
          </VStack>
        </Center>
      ) : (
        <Box overflowX='auto' maxH='560px' overflowY='auto'>
          <Table size='sm' variant='unstyled'>
            <Thead position='sticky' top={0} bg='dark.700' zIndex={1}>
              <Tr>
                <Th color='whiteAlpha.400' fontSize='xs' pb={2}>
                  #
                </Th>
                <Th color='whiteAlpha.400' fontSize='xs' pb={2}>
                  BIDDER
                </Th>
                <Th color='whiteAlpha.400' fontSize='xs' pb={2} isNumeric>
                  AMOUNT
                </Th>
                <Th color='whiteAlpha.400' fontSize='xs' pb={2}>
                  STATUS
                </Th>
                <Th color='whiteAlpha.400' fontSize='xs' pb={2}>
                  TIME
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              <AnimatePresence mode='popLayout'>
                {bids.map((bid, i) => (
                  <MotionTr
                    key={bid._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      backgroundColor:
                        flash === bid._id
                          ? "rgba(108,99,255,0.2)"
                          : "transparent",
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Td py={2}>
                      <Text fontSize='xs' color='whiteAlpha.400'>
                        {i + 1}
                      </Text>
                    </Td>
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
                    <Td py={2} isNumeric>
                      <Text
                        fontWeight={700}
                        color={i === 0 ? "gold.400" : "whiteAlpha.700"}
                        fontSize='sm'
                      >
                        {bid.amount} cr
                      </Text>
                    </Td>
                    <Td py={2}>
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
                        {bid.status || (i === 0 ? "leading" : "outbid")}
                      </Badge>
                    </Td>
                    <Td py={2}>
                      <Text fontSize='xs' color='whiteAlpha.400'>
                        {formatDistanceToNow(new Date(bid.createdAt), {
                          addSuffix: true,
                        })}
                      </Text>
                    </Td>
                  </MotionTr>
                ))}
              </AnimatePresence>
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
