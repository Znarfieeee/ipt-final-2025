import React from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { ChakraProvider } from "@chakra-ui/react"
import { AppProvider } from "./context/AppContext"
import Login from "./pages/Login"
import Main from "./pages/Main"

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Main />,
        },
        {
            path: "/employees",
            element: <Main />,
        },
        {
            path: "/departments",
            element: <Main />,
        },
        {
            path: "/login",
            element: <Login />,
        },
    ])

    return (
        <ChakraProvider>
            <AppProvider>
                <RouterProvider router={router} />
            </AppProvider>
        </ChakraProvider>
    )
}

export default App
