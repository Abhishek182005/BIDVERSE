"use client";

import {
  Box,
  Image,
  Badge,
  Text,
  Heading,
  HStack,
  VStack,
  Button,
  Flex,
  Icon,
} from "@chakra-ui/react";
import {
  StarIcon,
  TimeIcon,
  CheckCircleIcon,
  NotAllowedIcon,
  EditIcon,
} from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import CountdownTimer from "./CountdownTimer";

const MotionBox = motion(Box);

const statusConfig = {
  active: { label: "LIVE", color: "green", icon: CheckCircleIcon },
  pending: { label: "UPCOMING", color: "yellow", icon: TimeIcon },
  ended: { label: "ENDED", color: "gray", icon: CheckCircleIcon },
  cancelled: { label: "CANCELLED", color: "red", icon: NotAllowedIcon },
};

export default function AuctionCard({ auction, index = 0, showBidBtn = true }) {
  const router = useRouter();
  const status = statusConfig[auction.status] || statusConfig.ended;

  const handleClick = () => {
    router.push(`/auctions/${auction._id}`);
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -6 }}
    >
      <Box
        bg='dark.700'
        border='1px solid'
        borderColor='whiteAlpha.100'
        borderRadius='xl'
        overflow='hidden'
        transition='all 0.3s'
        _hover={{
          borderColor: "brand.500",
          boxShadow: "0 12px 40px rgba(108,99,255,0.15)",
        }}
        cursor='pointer'
        onClick={handleClick}
        h='100%'
        display='flex'
        flexDirection='column'
      >
        {/* Image */}
        <Box
          position='relative'
          h={{ base: "180px", md: "200px" }}
          overflow='hidden'
          bg='dark.800'
        >
          <Image
            src={
              auction.image ||
              "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600"
            }
            alt={auction.title}
            w='100%'
            h='100%'
            objectFit='cover'
            transition='transform 0.4s'
            _groupHover={{ transform: "scale(1.05)" }}
            fallback={
              <Box
                w='100%'
                h='100%'
                bg='dark.600'
                display='flex'
                alignItems='center'
                justifyContent='center'
              >
                <EditIcon boxSize={10} color='whiteAlpha.300' />
              </Box>
            }
          />
          <Box position='absolute' top={3} left={3}>
            <Badge
              colorScheme={status.color}
              px={2}
              py={1}
              borderRadius='full'
              fontSize='xs'
              fontWeight={700}
            >
              <HStack spacing={1} display='inline-flex' align='center'>
                <Icon as={status.icon} boxSize={2.5} />
                <Text as='span'>{status.label}</Text>
              </HStack>
            </Badge>
          </Box>
          <Box position='absolute' top={3} right={3}>
            <Badge
              bg='dark.900'
              color='whiteAlpha.700'
              px={2}
              py={1}
              borderRadius='full'
              fontSize='xs'
              border='1px solid'
              borderColor='whiteAlpha.200'
            >
              {auction.category}
            </Badge>
          </Box>
        </Box>

        {/* Content */}
        <VStack align='stretch' p={4} spacing={3} flex={1}>
          <Heading size='sm' noOfLines={2} lineHeight={1.4}>
            {auction.title}
          </Heading>

          <Text color='whiteAlpha.500' fontSize='xs' noOfLines={2}>
            {auction.description}
          </Text>

          {/* Bid info */}
          <Flex justify='space-between' align='flex-end' mt='auto'>
            <Box>
              <Text fontSize='xs' color='whiteAlpha.500' mb={0.5}>
                {auction.currentBid > 0 ? "CURRENT BID" : "STARTING BID"}
              </Text>
              <Text fontSize='xl' fontWeight={800} className='gradient-gold'>
                {(auction.currentBid || auction.minBid).toLocaleString()}
                <Text
                  as='span'
                  fontSize='xs'
                  fontWeight={400}
                  color='whiteAlpha.500'
                  ml={1}
                >
                  cr
                </Text>
              </Text>
            </Box>
            <Box textAlign='right'>
              <Text fontSize='xs' color='whiteAlpha.400'>
                {auction.totalBids || 0} bid
                {(auction.totalBids || 0) !== 1 ? "s" : ""}
              </Text>
            </Box>
          </Flex>

          {/* Timer */}
          {(auction.status === "active" || auction.status === "pending") && (
            <Box>
              <CountdownTimer
                endTime={auction.endTime}
                startTime={auction.startTime}
                status={auction.status}
                showLabel={true}
              />
            </Box>
          )}

          {auction.status === "ended" && auction.winner && (
            <HStack
              bg='rgba(0,229,160,0.1)'
              p={2}
              borderRadius='lg'
              border='1px solid'
              borderColor='green.500'
            >
              <HStack spacing={1.5}>
                <StarIcon color='gold.400' boxSize={3} />
                <Text fontSize='xs' color='green.400'>
                  Won by {auction.winner?.name || "Someone"}
                </Text>
              </HStack>
            </HStack>
          )}

          {/* Action */}
          {showBidBtn && auction.status === "active" && (
            <Button
              variant='solid'
              colorScheme='brand'
              size='sm'
              w='100%'
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/auctions/${auction._id}`);
              }}
            >
              Place Bid →
            </Button>
          )}
        </VStack>
      </Box>
    </MotionBox>
  );
}
