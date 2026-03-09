"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Badge,
  Divider,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";

export default function DeclareWinnerModal({
  isOpen,
  onClose,
  auction,
  onConfirm,
  isLoading,
}) {
  if (!auction) return null;

  const hasActiveBids = auction.currentBidder && auction.currentBid > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg='blackAlpha.700' backdropFilter='blur(4px)' />
      <ModalContent
        bg='dark.700'
        border='1px solid'
        borderColor='whiteAlpha.200'
      >
        <ModalHeader pb={2} color='gold.400'>
          <HStack spacing={2}>
            <StarIcon />
            <Text>Declare Winner & Close Auction</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align='stretch'>
            <Text color='whiteAlpha.700' fontSize='sm'>
              You are about to permanently close this auction. This action
              cannot be undone.
            </Text>

            <Box
              bg='dark.600'
              p={4}
              borderRadius='lg'
              border='1px solid'
              borderColor='whiteAlpha.100'
            >
              <Text fontWeight={700} mb={3}>
                {auction.title}
              </Text>
              <VStack align='stretch' spacing={2}>
                <HStack justify='space-between'>
                  <Text fontSize='sm' color='whiteAlpha.500'>
                    Status
                  </Text>
                  <Badge colorScheme='green'>{auction.status}</Badge>
                </HStack>
                <HStack justify='space-between'>
                  <Text fontSize='sm' color='whiteAlpha.500'>
                    Total Bids
                  </Text>
                  <Text fontSize='sm' fontWeight={600}>
                    {auction.totalBids}
                  </Text>
                </HStack>
                <HStack justify='space-between'>
                  <Text fontSize='sm' color='whiteAlpha.500'>
                    Winning Bid
                  </Text>
                  <Text fontSize='sm' fontWeight={700} color='gold.400'>
                    {auction.currentBid > 0
                      ? `${auction.currentBid} credits`
                      : "No bids"}
                  </Text>
                </HStack>
                {hasActiveBids && (
                  <HStack justify='space-between'>
                    <Text fontSize='sm' color='whiteAlpha.500'>
                      Winner
                    </Text>
                    <Text fontSize='sm' fontWeight={600} color='brand.300'>
                      {auction.currentBidder?.name || "Unknown"}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </Box>

            <Divider borderColor='whiteAlpha.100' />

            {hasActiveBids ? (
              <Alert
                status='info'
                borderRadius='lg'
                bg='rgba(108, 99, 255, 0.15)'
              >
                <AlertIcon color='brand.400' />
                <Text fontSize='sm'>
                  <strong>{auction.currentBidder?.name}</strong> will be
                  declared the winner. Their escrowed {auction.currentBid}{" "}
                  credits will be deducted. All other bidders will have their
                  credits returned automatically.
                </Text>
              </Alert>
            ) : (
              <Alert
                status='warning'
                borderRadius='lg'
                bg='rgba(255,215,0,0.1)'
              >
                <AlertIcon color='gold.400' />
                <Text fontSize='sm'>
                  No bids have been placed. The auction will close with no
                  winner.
                </Text>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter gap={3}>
          <Button
            variant='ghost'
            onClick={onClose}
            size='sm'
            isDisabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            colorScheme='gold'
            variant='solid'
            bg='gold.400'
            color='gray.900'
            _hover={{ bg: "gold.300" }}
            onClick={onConfirm}
            isLoading={isLoading}
            size='sm'
          >
            Close Auction & Declare Winner
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
