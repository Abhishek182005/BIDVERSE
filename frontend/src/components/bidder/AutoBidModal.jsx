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
  Badge,
  Alert,
  AlertIcon,
  Divider,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { RepeatClockIcon } from "@chakra-ui/icons";
import { bidsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AutoBidModal({ isOpen, onClose, auction }) {
  const { user } = useAuth();
  const toast = useToast();
  const [maxAmount, setMaxAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [existingAutoBid, setExistingAutoBid] = useState(null);
  const [fetching, setFetching] = useState(false);

  const minNext =
    (auction?.currentBid || auction?.minBid || 0) +
    (auction?.bidIncrement || 1);

  useEffect(() => {
    if (isOpen && auction?._id) {
      setFetching(true);
      bidsApi
        .getAutoBid(auction._id)
        .then((res) => {
          const existing = res.data.data;
          setExistingAutoBid(existing);
          setMaxAmount(existing?.maxAmount || minNext);
        })
        .catch(() => {
          setMaxAmount(minNext);
        })
        .finally(() => setFetching(false));
    }
  }, [isOpen, auction?._id]);

  const handleSet = async () => {
    if (!maxAmount || Number(maxAmount) < minNext) return;
    setLoading(true);
    try {
      const res = await bidsApi.setAutoBid({
        auctionId: auction._id,
        maxAmount: Number(maxAmount),
      });
      setExistingAutoBid(res.data.data);
      toast({
        title: existingAutoBid ? "Auto-bid updated!" : "Auto-bid activated!",
        description: `The system will bid on your behalf up to ${maxAmount} credits.`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      onClose();
    } catch (err) {
      toast({
        title: "Failed",
        description: err.response?.data?.message || "Could not set auto-bid",
        status: "error",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await bidsApi.cancelAutoBid(auction._id);
      setExistingAutoBid(null);
      toast({
        title: "Auto-bid cancelled",
        status: "info",
        duration: 3000,
      });
      onClose();
    } catch (err) {
      toast({ title: "Failed to cancel", status: "error", duration: 3000 });
    } finally {
      setCancelling(false);
    }
  };

  if (!auction) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg='blackAlpha.700' backdropFilter='blur(4px)' />
      <ModalContent
        bg='dark.700'
        border='1px solid'
        borderColor='whiteAlpha.200'
      >
        <ModalHeader pb={2}>
          <HStack>
            <RepeatClockIcon color='brand.400' />
            <Text>Auto-Bid</Text>
          </HStack>
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
        <ModalCloseButton isDisabled={loading || cancelling} />

        <ModalBody>
          {fetching ? (
            <HStack justify='center' py={6}>
              <Spinner color='brand.400' />
            </HStack>
          ) : (
            <VStack spacing={4} align='stretch'>
              {/* Explanation */}
              <Box bg='dark.600' p={3} borderRadius='lg'>
                <Text
                  fontSize='xs'
                  color='whiteAlpha.500'
                  mb={1}
                  fontWeight={600}
                >
                  How auto-bid works
                </Text>
                <Text fontSize='sm' color='whiteAlpha.700' lineHeight={1.7}>
                  Set a maximum budget. Whenever you get outbid, the system
                  automatically places the minimum required bid on your behalf —
                  up to your limit. Your credits are only deducted when a bid
                  fires.
                </Text>
              </Box>

              {/* Existing auto-bid indicator */}
              {existingAutoBid && (
                <Alert
                  status='info'
                  borderRadius='lg'
                  bg='rgba(99,179,237,0.1)'
                  border='1px solid'
                  borderColor='blue.500'
                >
                  <AlertIcon color='blue.400' />
                  <Box>
                    <Text fontSize='sm' fontWeight={600}>
                      Auto-bid active
                    </Text>
                    <Text fontSize='xs' color='whiteAlpha.600'>
                      Current max budget:{" "}
                      <Badge colorScheme='blue'>
                        {existingAutoBid.maxAmount} cr
                      </Badge>
                    </Text>
                  </Box>
                </Alert>
              )}

              <Divider borderColor='whiteAlpha.100' />

              <FormControl>
                <FormLabel fontSize='sm'>Maximum Budget (credits)</FormLabel>
                <NumberInput
                  value={maxAmount}
                  onChange={(_, val) => setMaxAmount(val)}
                  min={minNext}
                  max={user?.credits || 0}
                  step={auction?.bidIncrement || 1}
                >
                  <NumberInputField
                    bg='dark.600'
                    border='1px solid'
                    borderColor='whiteAlpha.200'
                    _focus={{ borderColor: "brand.400" }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <HStack justify='space-between' mt={1}>
                  <Text fontSize='xs' color='whiteAlpha.400'>
                    Min: {minNext} cr
                  </Text>
                  <Text fontSize='xs' color='whiteAlpha.400'>
                    Your balance: {(user?.credits || 0).toLocaleString()} cr
                  </Text>
                </HStack>
              </FormControl>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter gap={3}>
          {existingAutoBid && (
            <Button
              variant='ghost'
              colorScheme='red'
              size='sm'
              onClick={handleCancel}
              isLoading={cancelling}
              isDisabled={loading}
            >
              Cancel Auto-Bid
            </Button>
          )}
          <Button
            variant='ghost'
            onClick={onClose}
            size='sm'
            isDisabled={loading || cancelling}
          >
            Close
          </Button>
          <Button
            colorScheme='brand'
            onClick={handleSet}
            isLoading={loading}
            isDisabled={
              fetching ||
              !maxAmount ||
              Number(maxAmount) < minNext ||
              cancelling
            }
            size='sm'
          >
            {existingAutoBid ? "Update" : "Activate"} Auto-Bid
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
