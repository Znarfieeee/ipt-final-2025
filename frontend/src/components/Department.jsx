import React from "react"
import {
    Box,
    Heading,
    SimpleGrid,
    Card,
    CardHeader,
    CardBody,
    Text,
    Skeleton,
    Alert,
    AlertIcon,
    Button,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    VStack,
} from "@chakra-ui/react"
import { useApp } from "../context/AppContext"

function Department() {
    const { departments, employees, loading, error } = useApp()
    const { isOpen, onOpen, onClose } = useDisclosure()

    if (loading) {
        return (
            <Box p={6}>
                <Skeleton height="40px" mb={6} />
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} height="200px" />
                    ))}
                </SimpleGrid>
            </Box>
        )
    }

    if (error) {
        return (
            <Box p={6}>
                <Alert status="error">
                    <AlertIcon />
                    {error}
                </Alert>
            </Box>
        )
    }

    const getEmployeeCount = (departmentId) => {
        return employees.filter((emp) => emp.departmentId === departmentId)
            .length
    }

    return (
        <Box p={6}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={6}
            >
                <Heading size="lg">Departments</Heading>
                <Button colorScheme="blue" onClick={onOpen}>
                    Add Department
                </Button>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {departments.map((department) => (
                    <Card key={department.id}>
                        <CardHeader>
                            <Heading size="md">{department.name}</Heading>
                        </CardHeader>
                        <CardBody>
                            <Text>{department.description}</Text>
                            <Text mt={2}>
                                Employee Count:{" "}
                                {getEmployeeCount(department.id)}
                            </Text>
                        </CardBody>
                    </Card>
                ))}
            </SimpleGrid>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add New Department</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Department Name</FormLabel>
                                <Input placeholder="Department name" />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Textarea placeholder="Department description" />
                            </FormControl>
                            <Button colorScheme="blue" width="full">
                                Add Department
                            </Button>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    )
}

export default Department
