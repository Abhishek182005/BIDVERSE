"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
} from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

export default function StatCard({
  label,
  value,
  helpText,
  icon,
  color = "brand",
  index = 0,
}) {
  const colorMap = {
    brand: {
      bg: "rgba(108,99,255,0.1)",
      border: "brand.500",
      text: "brand.300",
      glow: "#6C63FF",
    },
    gold: {
      bg: "rgba(255,215,0,0.1)",
      border: "gold.500",
      text: "gold.400",
      glow: "#FFD700",
    },
    cyber: {
      bg: "rgba(0,212,255,0.1)",
      border: "cyber.500",
      text: "cyber.400",
      glow: "#00D4FF",
    },
    green: {
      bg: "rgba(0,229,160,0.1)",
      border: "green.500",
      text: "green.400",
      glow: "#00E5A0",
    },
    red: {
      bg: "rgba(255,107,107,0.1)",
      border: "red.500",
      text: "red.400",
      glow: "#FF6B6B",
    },
  };

  const c = colorMap[color] || colorMap.brand;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4, boxShadow: `0 12px 40px ${c.glow}33` }}
    >
      <Box
        bg='dark.700'
        border='1px solid'
        borderColor={c.border}
        borderRadius='xl'
        p={5}
        transition='all 0.3s'
        position='relative'
        overflow='hidden'
      >
        {/* Subtle top gradient */}
        <Box
          position='absolute'
          top={0}
          left={0}
          right={0}
          h='3px'
          bg={`linear-gradient(90deg, transparent, ${c.glow}, transparent)`}
        />

        <HStack justify='flex-end' mb={3}>
          <Box bg={c.bg} p={2} borderRadius='lg'>
            {icon}
          </Box>
        </HStack>

        <Stat>
          <StatLabel color='whiteAlpha.600' fontSize='sm'>
            {label}
          </StatLabel>
          <StatNumber fontSize='2xl' fontWeight={800} color={c.text} mt={1}>
            {value}
          </StatNumber>
          {helpText && (
            <StatHelpText color='whiteAlpha.400' fontSize='xs' mt={1}>
              {helpText}
            </StatHelpText>
          )}
        </Stat>
      </Box>
    </MotionBox>
  );
}
