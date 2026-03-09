"use client";

import { useState } from "react";
import {
  Container,
  Heading,
  Text,
  Box,
  Button,
  HStack,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { auctionsApi } from "@/lib/api";
import AuctionForm from "@/components/admin/AuctionForm";

const MotionBox = motion(Box);

export default function CreateAuctionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
        minBid: Number(values.minBid),
        bidIncrement: Number(values.bidIncrement),
      };

      if (new Date(payload.startTime) >= new Date(payload.endTime)) {
        toast({
          title: "End time must be after start time",
          status: "warning",
          duration: 3000,
        });
        setIsLoading(false);
        return;
      }

      await auctionsApi.create(payload);
      toast({
        title: "Auction created successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/auctions");
    } catch (err) {
      toast({
        title: "Failed to create auction",
        description: err.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW='2xl' py={8} px={4}>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Breadcrumb mb={5} fontSize='sm' color='whiteAlpha.500'>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin'>Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/auctions'>Auctions</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink color='brand.400'>Create</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <HStack justify='space-between' mb={6}>
          <Box>
            <Heading size='lg' mb={1}>
              Create Auction
            </Heading>
            <Text color='whiteAlpha.500'>
              Fill in the details to list a new auction
            </Text>
          </Box>
          <Button variant='ghost' size='sm' onClick={() => router.back()}>
            ← Back
          </Button>
        </HStack>

        <Box
          bg='dark.700'
          border='1px solid'
          borderColor='whiteAlpha.100'
          borderRadius='xl'
          p={6}
        >
          <AuctionForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel='Create Auction'
          />
        </Box>
      </MotionBox>
    </Container>
  );
}
