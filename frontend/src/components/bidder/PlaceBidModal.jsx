"use client";

import { useState, useEffect } from "react";
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
  ButtonGroup,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { bidsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function PlaceBidModal({ isOpen, onClose, auction, onSuccess }) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const minNext =
    (auction?.currentBid || auction?.minBid || 0) +
    (auction?.bidIncrement || 1);

  // Fetch smart suggestions when modal opens
  useEffect(() => {
    if (isOpen && auction?._id) {
      setAmount(minNext);
      bidsApi
        .getSuggestions(auction._id)
        .then((res) => setSuggestions(res.data.data))
        .catch(() => setSuggestions(null));
    }
  }, [isOpen, auction?._id]);

  // Sync default when number input is focused for the first time
  const handleOpen = () => {
    if (!amount) setAmount(minNext);
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
      if (data.remainingCredits !== undefined) {
        updateUser({ credits: data.remainingCredits });
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

            {/* Smart bid suggestions */}
            {suggestions && (
              <Box>
                <HStack mb={2} justify='space-between'>
                  <Text fontSize='xs' color='whiteAlpha.500'>
                    Smart Suggestions
                  </Text>
                  {suggestions.urgencyLevel === "high" && (
                    <Badge colorScheme='red' fontSize='2xs'>
                      🔥 High Competition
                    </Badge>
                  )}
                  {suggestions.urgencyLevel === "medium" && (
                    <Badge colorScheme='yellow' fontSize='2xs'>
                      ⚡ Heating Up
                    </Badge>
                  )}
                </HStack>
                <ButtonGroup
                  size='xs'
                  isAttached={false}
                  gap={2}
                  flexWrap='wrap'
                >
                  <Tooltip label='Minimum required bid' hasArrow>
                    <Button
                      variant='outline'
                      colorScheme='green'
                      onClick={() => setAmount(suggestions.safe)}
                      isDisabled={loading}
                    >
                      🟢 Safe — {suggestions.safe} cr
                    </Button>
                  </Tooltip>
                  <Tooltip label='Based on current bid pace' hasArrow>
                    <Button
                      variant='outline'
                      colorScheme='blue'
                      onClick={() => setAmount(suggestions.competitive)}
                      isDisabled={loading}
                    >
                      🔵 Compete — {suggestions.competitive} cr
                    </Button>
                  </Tooltip>
                  <Tooltip label='Strong move to deter competitors' hasArrow>
                    <Button
                      variant='outline'
                      colorScheme='red'
                      onClick={() => setAmount(suggestions.aggressive)}
                      isDisabled={loading}
                    >
                      🔴 Aggressive — {suggestions.aggressive} cr
                    </Button>
                  </Tooltip>
                </ButtonGroup>
              </Box>
            )}

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
