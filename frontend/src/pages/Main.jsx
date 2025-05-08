import React, { useState } from "react"
import { useNavigate } from "react-router-dom"

// UI components
import {
    Box,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Flex,
} from "@chakra-ui/react"
import { GoHome } from "react-icons/go"
import { PiLegoDuotone } from "react-icons/pi"
import { GrUserWorker } from "react-icons/gr"

// Components
import Home from "../components/Home"
import Employees from "../components/Employees"
import Department from "../components/Department"

const Main = () => {
    const navigate = useNavigate()
    const [tabIndex, setTabIndex] = useState(0)

    const handleTabChange = (index) => {
        setTabIndex(index)
        const routes = ["/", "/employees", "/departments"]
        navigate(routes[index])
    }

    return (
        <Box minH="100vh" bg="gray.50">
            <Flex direction="column" h="100vh">
                <Tabs
                    index={tabIndex}
                    onChange={handleTabChange}
                    variant="enclosed"
                    colorScheme="blue"
                    isFitted
                >
                    <TabList
                        bg="white"
                        shadow="sm"
                        position="sticky"
                        top={0}
                        zIndex={1}
                    >
                        <Tab>
                            <Flex align="center" gap={2}>
                                <GoHome />
                                Home
                            </Flex>
                        </Tab>
                        <Tab>
                            <Flex align="center" gap={2}>
                                <GrUserWorker />
                                Employees
                            </Flex>
                        </Tab>
                        <Tab>
                            <Flex align="center" gap={2}>
                                <PiLegoDuotone />
                                Departments
                            </Flex>
                        </Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <Home name="test" />
                        </TabPanel>
                        <TabPanel>
                            <Employees />
                        </TabPanel>
                        <TabPanel>
                            <Department />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Flex>
        </Box>
    )
}

export default Main
