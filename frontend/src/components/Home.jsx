import React from "react"
import {
    Box,
    Heading,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Card,
    CardBody,
    Text,
    Skeleton,
    Alert,
    AlertIcon,
} from "@chakra-ui/react"
import { useApp } from "../context/AppContext"

function Home() {
    const { employees, departments, loading, error } = useApp()

    if (loading) {
        return (
            <Box p={6}>
                <Skeleton height="40px" mb={6} />
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} height="100px" />
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

    const activeEmployees = employees.filter(
        (emp) => emp.status === "Active"
    ).length
    const totalDepartments = departments.length

    return (
        <Box p={6}>
            <Heading size="lg" mb={6}>
                Dashboard
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Total Employees</StatLabel>
                            <StatNumber>{employees.length}</StatNumber>
                            <StatHelpText>
                                {activeEmployees} Active
                            </StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Total Departments</StatLabel>
                            <StatNumber>{totalDepartments}</StatNumber>
                            <StatHelpText>
                                {departments
                                    .map((dept) => dept.name)
                                    .join(", ")}
                            </StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>
                                Average Employees per Department
                            </StatLabel>
                            <StatNumber>
                                {(employees.length / totalDepartments).toFixed(
                                    1
                                )}
                            </StatNumber>
                            <StatHelpText>
                                Based on current distribution
                            </StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>
            </SimpleGrid>

            <Card>
                <CardBody>
                    <Heading size="md" mb={4}>
                        Recent Activity
                    </Heading>
                    <Text>No recent activity to display</Text>
                </CardBody>
            </Card>
        </Box>
    )
}

export default Home
