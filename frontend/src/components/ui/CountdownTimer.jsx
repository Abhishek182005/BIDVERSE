"use client";

import { Box, Text, HStack, VStack } from "@chakra-ui/react";
import {
  CheckCircleIcon,
  CloseIcon,
  TimeIcon,
  WarningIcon,
} from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useCountdown } from "@/hooks/useCountdown";

const MotionBox = motion(Box);

function TimeUnit({ value, label, urgent }) {
  return (
    <VStack spacing={0} minW='36px'>
      <MotionBox
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        bg={urgent ? "red.500" : "dark.600"}
        borderRadius='md'
        px={2}
        py={1}
        minW='100%'
        textAlign='center'
        border='1px solid'
        borderColor={urgent ? "red.400" : "whiteAlpha.200"}
      >
        <Text
          fontFamily='mono'
          fontWeight={800}
          fontSize={{ base: "sm", md: "md" }}
          color={urgent ? "white" : "whiteAlpha.900"}
        >
          {String(value).padStart(2, "0")}
        </Text>
      </MotionBox>
      <Text
        fontSize='9px'
        color='whiteAlpha.400'
        fontWeight={500}
        letterSpacing='wider'
        mt={0.5}
      >
        {label}
      </Text>
    </VStack>
  );
}

export default function CountdownTimer({
  endTime,
  startTime,
  status,
  showLabel = true,
}) {
  const { days, hours, minutes, seconds, isExpired, isUrgent } =
    useCountdown(endTime);

  if (status === "ended" || status === "cancelled") {
    return (
      <Box
        bg='whiteAlpha.100'
        borderRadius='lg'
        px={3}
        py={2}
        border='1px solid'
        borderColor='whiteAlpha.200'
      >
        <HStack spacing={1.5}>
          {status === "ended" ? (
            <CheckCircleIcon color='green.400' boxSize={3.5} />
          ) : (
            <CloseIcon color='red.400' boxSize={3} />
          )}
          <Text
            fontSize='sm'
            color={status === "ended" ? "green.400" : "red.400"}
            fontWeight={600}
          >
            {status === "ended" ? "Ended" : "Cancelled"}
          </Text>
        </HStack>
      </Box>
    );
  }

  if (status === "pending") {
    return (
      <Box
        bg='rgba(255,215,0,0.1)'
        borderRadius='lg'
        px={3}
        py={2}
        border='1px solid'
        borderColor='gold.500'
      >
        <HStack spacing={1.5}>
          <TimeIcon color='gold.400' boxSize={3.5} />
          <Text fontSize='sm' color='gold.400' fontWeight={600}>
            Not started yet
          </Text>
        </HStack>
      </Box>
    );
  }

  if (isExpired) {
    return (
      <Box
        bg='rgba(255,107,107,0.1)'
        borderRadius='lg'
        px={3}
        py={2}
        border='1px solid'
        borderColor='red.500'
      >
        <HStack spacing={1.5}>
          <WarningIcon color='red.400' boxSize={3.5} />
          <Text fontSize='sm' color='red.400' fontWeight={600}>
            Expired
          </Text>
        </HStack>
      </Box>
    );
  }

  return (
    <Box className={isUrgent ? "pulse-red" : ""}>
      {showLabel && (
        <HStack spacing={1} mb={1}>
          {isUrgent ? (
            <WarningIcon color='red.400' boxSize={3} />
          ) : (
            <TimeIcon color='whiteAlpha.500' boxSize={3} />
          )}
          <Text
            fontSize='xs'
            color={isUrgent ? "red.400" : "whiteAlpha.500"}
            fontWeight={600}
            letterSpacing='wider'
          >
            {isUrgent ? "ENDING SOON" : "TIME LEFT"}
          </Text>
        </HStack>
      )}
      <HStack spacing={1}>
        {days > 0 && <TimeUnit value={days} label='DAYS' urgent={isUrgent} />}
        {days > 0 && (
          <Text color='whiteAlpha.400' fontWeight={700} mb={3}>
            :
          </Text>
        )}
        <TimeUnit value={hours} label='HRS' urgent={isUrgent} />
        <Text color='whiteAlpha.400' fontWeight={700} mb={3}>
          :
        </Text>
        <TimeUnit value={minutes} label='MIN' urgent={isUrgent} />
        <Text color='whiteAlpha.400' fontWeight={700} mb={3}>
          :
        </Text>
        <TimeUnit value={seconds} label='SEC' urgent={isUrgent} />
      </HStack>
    </Box>
  );
}
