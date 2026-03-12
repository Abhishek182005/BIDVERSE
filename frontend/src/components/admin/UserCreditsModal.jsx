"use client";

import { useEffect, useState } from "react";
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
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  Text,
  HStack,
  Avatar,
  Badge,
  Box,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { adminApi } from "@/lib/api";

export default function UserCreditsModal({ isOpen, onClose, user, onSuccess }) {
  const [operation, setOperation] = useState("add");
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setOperation("add");
      setAmount(100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!amount || amount <= 0) return;
    setLoading(true);
    try {
      await adminApi.assignCredits(user._id, {
        operation,
        credits: Number(amount),
      });
      toast({
        title: "Credits updated",
        description: `${operation === "add" ? "Added" : operation === "subtract" ? "Removed" : "Set to"} ${amount} credits for ${user.name}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast({
        title: "Failed to update credits",
        description: err.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const projectedCredits = () => {
    const current = user.credits || 0;
    if (operation === "add") return current + Number(amount);
    if (operation === "subtract") return Math.max(0, current - Number(amount));
    return Number(amount);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg='blackAlpha.700' backdropFilter='blur(4px)' />
      <ModalContent
        bg='dark.700'
        border='1px solid'
        borderColor='whiteAlpha.200'
      >
        <ModalHeader pb={2}>Assign Credits</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={5} align='stretch'>
            {/* User Info */}
            <HStack spacing={3} bg='dark.600' p={3} borderRadius='lg'>
              <Avatar name={user.name} size='sm' bg='brand.500' />
              <Box>
                <Text fontWeight={600} fontSize='sm'>
                  {user.name}
                </Text>
                <Text color='whiteAlpha.500' fontSize='xs'>
                  {user.email}
                </Text>
              </Box>
              <Badge colorScheme='yellow' ml='auto'>
                {user.credits || 0} credits
              </Badge>
            </HStack>

            <Divider borderColor='whiteAlpha.100' />

            <FormControl>
              <FormLabel fontSize='sm'>Operation</FormLabel>
              <Select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                bg='dark.600'
                border='1px solid'
                borderColor='whiteAlpha.200'
                _focus={{ borderColor: "brand.400" }}
              >
                <option value='add'>Add Credits</option>
                <option value='subtract'>Subtract Credits</option>
                <option value='set'>Set to Exact Amount</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize='sm'>Amount</FormLabel>
              <NumberInput
                value={amount}
                onChange={(_, val) => setAmount(val)}
                min={1}
                max={100000}
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
            </FormControl>

            {/* Preview */}
            <HStack
              bg='whiteAlpha.50'
              p={3}
              borderRadius='lg'
              justify='space-between'
            >
              <Text fontSize='sm' color='whiteAlpha.600'>
                Credits after operation:
              </Text>
              <Text fontWeight={700} color='gold.400' fontSize='lg'>
                {projectedCredits().toLocaleString()}
              </Text>
            </HStack>
          </VStack>
        </ModalBody>

        <ModalFooter gap={3}>
          <Button variant='ghost' onClick={onClose} size='sm'>
            Cancel
          </Button>
          <Button
            colorScheme='brand'
            onClick={handleSubmit}
            isLoading={loading}
            size='sm'
          >
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
