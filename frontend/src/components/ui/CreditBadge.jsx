"use client";

import { HStack, Text, Box } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

export default function CreditBadge({ credits = 0, size = "md" }) {
  return (
    <MotionBox
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <HStack
        spacing={1.5}
        bg='whiteAlpha.100'
        border='1px solid'
        borderColor='gold.500'
        borderRadius='full'
        px={size === "sm" ? 2 : 3}
        py={size === "sm" ? 0.5 : 1}
      >
        <Text fontSize={size === "sm" ? "xs" : "sm"}>💰</Text>
        <Text
          fontSize={size === "sm" ? "xs" : "sm"}
          fontWeight={700}
          color='gold.400'
        >
          {credits.toLocaleString()}
        </Text>
        <Text
          fontSize={size === "sm" ? "2xs" : "xs"}
          color='whiteAlpha.500'
          fontWeight={400}
        >
          credits
        </Text>
      </HStack>
    </MotionBox>
  );
}
