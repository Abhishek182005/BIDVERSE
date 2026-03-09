"use client";

import { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  Text,
  HStack,
  Box,
  Divider,
  Alert,
  AlertIcon,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { bidsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function PlaceBidModal({ isOpen, onClose, auction, onSuccess }) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const minNext =
    (auction?.currentBid || auction?.minBid || 0) +
    (auction?.bidIncrement || 1);

  // Sync default when modal opens
  const handleOpen = () => {
    setAmount(minNext);
  };

  const affordable = (user?.credits || 0) >= amount;
  const validAmount = amount >= minNext;

  const handleSubmit = async () => {
    if (!validAmount || !affordable) return;
    setLoading(true);
    try {
      const { data } = await bidsApi.place({
        auctionId: auction._id,
        amount: Number(amount),
      });
      // Update local user credits
      if (data.data?.creditsRemaining !== undefined) {
        updateUser({ credits: data.data.creditsRemaining });
      }
      toast({
        title: "🎉 Bid placed!",
        description: `You bid ${amount} credits on "${auction.title}"`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast({
        title: "Bid failed",
        description: err.response?.data?.message || "Could not place your bid",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!auction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      onOverlayClick={!loading ? onClose : undefined}
    >
      <ModalOverlay bg='blackAlpha.700' backdropFilter='blur(4px)' />
      <ModalContent
        bg='dark.700'
        border='1px solid'
        borderColor='whiteAlpha.200'
      >
        <ModalHeader pb={2}>
          Place Bid
          <Text
            fontSize='sm'
            fontWeight={400}
            color='whiteAlpha.500'
            mt={1}
            noOfLines={1}
          >
            {auction.title}
          </Text>
        </ModalHeader>
        <ModalCloseButton isDisabled={loading} />
        <ModalBody>
          <VStack spacing={4} align='stretch'>
            {/* Auction Info */}
            <Box bg='dark.600' p={3} borderRadius='lg'>
              <HStack justify='space-between' mb={2}>
                <Text fontSize='xs' color='whiteAlpha.500'>
                  Current Bid
                </Text>
                <Text fontWeight={700} color='gold.400'>
                  {auction.currentBid || auction.minBid} cr
                </Text>
              </HStack>
              <HStack justify='space-between' mb={2}>
                <Text fontSize='xs' color='whiteAlpha.500'>
                  Minimum Next Bid
                </Text>
                <Text fontWeight={700} color='brand.300'>
                  {minNext} cr
                </Text>
              </HStack>
              <HStack justify='space-between'>
                <Text fontSize='xs' color='whiteAlpha.500'>
                  Your Credits
                </Text>
                <Badge colorScheme='yellow' px={2}>
                  {(user?.credits || 0).toLocaleString()} cr
                </Badge>
              </HStack>
            </Box>

            <Divider borderColor='whiteAlpha.100' />

            <FormControl>
              <FormLabel fontSize='sm'>Your Bid Amount *</FormLabel>
              <NumberInput
                value={amount}
                onChange={(_, val) => setAmount(val)}
                min={minNext}
                max={user?.credits || 0}
                step={auction?.bidIncrement || 1}
                onFocus={handleOpen}
              >
                <NumberInputField
                  bg='dark.600'
                  border='1px solid'
                  borderColor={
                    !validAmount && amount > 0 ? "red.400" : "whiteAlpha.200"
                  }
                  _focus={{ borderColor: "brand.400" }}
                  placeholder={`Min ${minNext} credits`}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              {amount > 0 && !validAmount && (
                <Text fontSize='xs' color='red.400' mt={1}>
                  Minimum bid is {minNext} credits
                </Text>
              )}
            </FormControl>

            {amount > 0 && validAmount && (
              <Box bg='whiteAlpha.50' p={3} borderRadius='lg'>
                <HStack justify='space-between' mb={1}>
                  <Text fontSize='sm' color='whiteAlpha.600'>
                    Credits after bid:
                  </Text>
                  <Text
                    fontWeight={700}
                    color={affordable ? "green.400" : "red.400"}
                    fontSize='md'
                  >
                    {((user?.credits || 0) - amount).toLocaleString()} cr
                  </Text>
                </HStack>
                <Text fontSize='xs' color='whiteAlpha.400'>
                  Your {amount} credits will be held in escrow. Returned
                  immediately if outbid.
                </Text>
              </Box>
            )}

            {!affordable && amount > 0 && (
              <Alert
                status='error'
                borderRadius='lg'
                bg='rgba(252,129,129,0.1)'
              >
                <AlertIcon color='red.400' />
                <Text fontSize='sm'>
                  Insufficient credits. You need {amount - (user?.credits || 0)}{" "}
                  more credits.
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
            isDisabled={loading}
          >
            Cancel
          </Button>
          <Button
            colorScheme='brand'
            onClick={handleSubmit}
            isLoading={loading}
            isDisabled={!validAmount || !affordable || !amount}
            size='sm'
          >
            Confirm Bid — {amount} cr
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
