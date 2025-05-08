import React from "react"
import {
    Box,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
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
    Select,
    VStack,
} from "@chakra-ui/react"
import { useApp } from "../context/AppContext"

function Employees() {
    const { employees, departments, loading, error } = useApp()
    const { isOpen, onOpen, onClose } = useDisclosure()

    if (loading) {
        return (
            <Box p={6}>
                <Skeleton height="40px" mb={6} />
                <Skeleton height="200px" />
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

    const getDepartmentName = (departmentId) => {
        const department = departments.find((d) => d.id === departmentId)
        return department ? department.name : "Unknown"
    }

    return (
        <Box p={6}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={6}
            >
                <Heading size="lg">Employees</Heading>
                <Button colorScheme="blue" onClick={onOpen}>
                    Add Employee
                </Button>
            </Box>

            <Box overflowX="auto">
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Employee ID</Th>
                            <Th>Position</Th>
                            <Th>Department</Th>
                            <Th>Hire Date</Th>
                            <Th>Status</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {employees.map((employee) => (
                            <Tr key={employee.id}>
                                <Td>{employee.employeeId}</Td>
                                <Td>{employee.position}</Td>
                                <Td>
                                    {getDepartmentName(employee.departmentId)}
                                </Td>
                                <Td>
                                    {new Date(
                                        employee.hireDate
                                    ).toLocaleDateString()}
                                </Td>
                                <Td>{employee.status}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add New Employee</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Position</FormLabel>
                                <Input placeholder="Position" />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Department</FormLabel>
                                <Select placeholder="Select department">
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button colorScheme="blue" width="full">
                                Add Employee
                            </Button>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    )
}

export default Employees
