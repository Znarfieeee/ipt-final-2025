import React from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { AppProvider } from "./context/AppContext"
import Login from "./pages/Login"
import Main from "./pages/Main"
import Layout from "./components/Layout/Layout"

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Layout />,
            children: [
                {
                    index: true,
                    element: <Main />,
                },
                {
                    path: "employees",
                    element: <Main />,
                },
                {
                    path: "departments",
                    element: <Main />,
                },
                {
                    path: "workflows",
                    element: <Main />,
                },
                {
                    path: "requests",
                    element: <Main />,
                },
            ],
        },
        {
            path: "/login",
            element: <Login />,
        },
    ])

    return (
        <AppProvider>
            <RouterProvider router={router} />
        </AppProvider>
    )
}

export default App
