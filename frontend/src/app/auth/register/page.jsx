"use client";

import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  HStack,
  Divider,
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";

const MotionBox = motion(Box);

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const password = watch("password");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success(`Welcome to BidVerse, ${res.user.name}! 🎉`);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH='100vh'
      bg='dark.900'
      display='flex'
      alignItems='center'
      justifyContent='center'
      position='relative'
      overflow='hidden'
      p={4}
    >
      <Box
        position='absolute'
        top='-100px'
        right='-100px'
        w='500px'
        h='500px'
        bg='brand.500'
        opacity={0.04}
        borderRadius='full'
        filter='blur(100px)'
      />
      <Box
        position='absolute'
        bottom='-100px'
        left='-100px'
        w='400px'
        h='400px'
        bg='gold.500'
        opacity={0.04}
        borderRadius='full'
        filter='blur(100px)'
      />

      <MotionBox
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        w='100%'
        maxW='440px'
      >
        <VStack mb={8} spacing={2}>
          <Link href='/' style={{ textDecoration: "none" }}>
            <HStack>
              <Text fontSize='3xl'>🔨</Text>
              <Heading size='lg' className='gradient-text'>
                BidVerse
              </Heading>
            </HStack>
          </Link>
          <Text color='whiteAlpha.500' fontSize='sm'>
            Create your bidder account
          </Text>
        </VStack>

        <Box className='glass-card' p={8}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={5}>
              <FormControl isInvalid={!!errors.name}>
                <FormLabel fontSize='sm' color='whiteAlpha.700'>
                  Full Name
                </FormLabel>
                <Input
                  placeholder='John Doe'
                  size='lg'
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                    maxLength: { value: 60, message: "Name too long" },
                  })}
                />
                <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <FormLabel fontSize='sm' color='whiteAlpha.700'>
                  Email Address
                </FormLabel>
                <Input
                  placeholder='you@example.com'
                  type='email'
                  size='lg'
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Invalid email",
                    },
                  })}
                />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel fontSize='sm' color='whiteAlpha.700'>
                  Password
                </FormLabel>
                <InputGroup size='lg'>
                  <Input
                    placeholder='Min. 6 characters'
                    type={showPass ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  <InputRightElement>
                    <IconButton
                      variant='ghost'
                      size='sm'
                      icon={showPass ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPass(!showPass)}
                      aria-label='Toggle password'
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel fontSize='sm' color='whiteAlpha.700'>
                  Confirm Password
                </FormLabel>
                <Input
                  placeholder='Repeat password'
                  type='password'
                  size='lg'
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (val) =>
                      val === password || "Passwords do not match",
                  })}
                />
                <FormErrorMessage>
                  {errors.confirmPassword?.message}
                </FormErrorMessage>
              </FormControl>

              <Button
                type='submit'
                variant='gold'
                size='lg'
                w='100%'
                isLoading={loading}
                loadingText='Creating account...'
                mt={2}
              >
                Create Account
              </Button>
            </VStack>
          </form>

          <Divider my={6} borderColor='whiteAlpha.100' />

          <Text textAlign='center' color='whiteAlpha.600' fontSize='sm'>
            Already have an account?{" "}
            <Link
              href='/auth/login'
              style={{ color: "#6C63FF", fontWeight: 600 }}
            >
              Sign in
            </Link>
          </Text>
        </Box>
      </MotionBox>
    </Box>
  );
}
