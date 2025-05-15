import React from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { AppProvider } from "./context/AppContext"
import Login from "./pages/Login"
import Accounts from "./pages/Accounts"
import Layout from "./components/Layout/Layout"
import Department from "./pages/Department"
import Employees from "./pages/Employees"
import Requests from "./pages/Requests"
import NotFound from "./pages/NotFound"
import Home from "./pages/Home"

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Layout />,
            children: [
                {
                    index: true,
                    element: <Home />,
                },
                {
                    path: "accounts",
                    element: <Accounts />,
                },
                {
                    path: "employees",
                    element: <Employees />,
                },
                {
                    path: "departments",
                    element: <Department />,
                },
                {
                    path: "requests",
                    element: <Requests />,
                },
            ],
        },
        {
            path: "/login",
            element: <Login />,
        },
        {
            path: "*",
            element: <NotFound />,
        },
    ])

    return (
        <AppProvider>
            <RouterProvider router={router} />
        </AppProvider>
    )
}

export default App
