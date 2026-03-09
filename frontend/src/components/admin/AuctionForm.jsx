"use client";

import { useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Textarea,
  VStack,
  SimpleGrid,
  Text,
  HStack,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { format, addDays } from "date-fns";

const CATEGORIES = [
  "Electronics",
  "Art",
  "Collectibles",
  "Clothing",
  "Sports",
  "Jewellery",
  "Vehicles",
  "Other",
];

const toDatetimeLocal = (date) => {
  const d = date ? new Date(date) : new Date();
  return format(d, "yyyy-MM-dd'T'HH:mm");
};

export default function AuctionForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Create Auction",
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues || {
      title: "",
      description: "",
      image: "",
      category: "Electronics",
      startTime: toDatetimeLocal(new Date()),
      endTime: toDatetimeLocal(addDays(new Date(), 1)),
      minBid: 10,
      bidIncrement: 5,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        ...defaultValues,
        startTime: defaultValues.startTime
          ? toDatetimeLocal(defaultValues.startTime)
          : "",
        endTime: defaultValues.endTime
          ? toDatetimeLocal(defaultValues.endTime)
          : "",
      });
    }
  }, [defaultValues]);

  const inputProps = {
    bg: "dark.600",
    border: "1px solid",
    borderColor: "whiteAlpha.200",
    _focus: {
      borderColor: "brand.400",
      boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)",
    },
    _hover: { borderColor: "whiteAlpha.400" },
  };

  return (
    <Box as='form' onSubmit={handleSubmit(onSubmit)}>
      <VStack spacing={5} align='stretch'>
        <FormControl isInvalid={!!errors.title}>
          <FormLabel fontSize='sm'>Auction Title *</FormLabel>
          <Input
            placeholder='e.g. Vintage Rolex Submariner 1967'
            {...inputProps}
            {...register("title", {
              required: "Title is required",
              minLength: { value: 5, message: "Minimum 5 characters" },
              maxLength: { value: 100, message: "Maximum 100 characters" },
            })}
          />
          <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.description}>
          <FormLabel fontSize='sm'>Description *</FormLabel>
          <Textarea
            placeholder='Describe the item condition, specifications, and any notable details...'
            rows={4}
            resize='vertical'
            {...inputProps}
            {...register("description", {
              required: "Description is required",
              minLength: { value: 20, message: "Minimum 20 characters" },
            })}
          />
          <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
        </FormControl>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isInvalid={!!errors.category}>
            <FormLabel fontSize='sm'>Category *</FormLabel>
            <Select
              {...inputProps}
              {...register("category", { required: "Category is required" })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ background: "#1a1a2e" }}>
                  {c}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.category?.message}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel fontSize='sm'>Image URL</FormLabel>
            <Input
              placeholder='https://...'
              type='url'
              {...inputProps}
              {...register("image")}
            />
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isInvalid={!!errors.startTime}>
            <FormLabel fontSize='sm'>Start Time *</FormLabel>
            <Input
              type='datetime-local'
              {...inputProps}
              {...register("startTime", { required: "Start time is required" })}
            />
            <FormErrorMessage>{errors.startTime?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.endTime}>
            <FormLabel fontSize='sm'>End Time *</FormLabel>
            <Input
              type='datetime-local'
              {...inputProps}
              {...register("endTime", { required: "End time is required" })}
            />
            <FormErrorMessage>{errors.endTime?.message}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Controller
            name='minBid'
            control={control}
            rules={{
              required: "Minimum bid is required",
              min: { value: 1, message: "Minimum 1 credit" },
            }}
            render={({ field: { onChange, value }, fieldState }) => (
              <FormControl isInvalid={!!fieldState.error}>
                <FormLabel fontSize='sm'>Minimum Bid (credits) *</FormLabel>
                <NumberInput
                  value={value}
                  onChange={(_, val) => onChange(val)}
                  min={1}
                  max={1000000}
                >
                  <NumberInputField {...inputProps} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
              </FormControl>
            )}
          />

          <Controller
            name='bidIncrement'
            control={control}
            rules={{
              required: "Bid increment is required",
              min: { value: 1, message: "Minimum 1 credit" },
            }}
            render={({ field: { onChange, value }, fieldState }) => (
              <FormControl isInvalid={!!fieldState.error}>
                <FormLabel fontSize='sm'>Bid Increment (credits) *</FormLabel>
                <NumberInput
                  value={value}
                  onChange={(_, val) => onChange(val)}
                  min={1}
                  max={100000}
                >
                  <NumberInputField {...inputProps} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
              </FormControl>
            )}
          />
        </SimpleGrid>

        <Box pt={2}>
          <Button
            type='submit'
            colorScheme='brand'
            size='md'
            isLoading={isLoading}
            loadingText='Saving...'
            w='full'
          >
            {submitLabel}
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}
