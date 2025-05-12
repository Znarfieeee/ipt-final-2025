import React from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { AppProvider } from "./context/AppContext"
// import Login from "./pages/Login"
import Accounts from "./pages/Accounts"
import Layout from "./components/Layout/Layout"
import Department from "./pages/Department"
import Employees from "./pages/Employees"
import Requests from "./pages/Requests"

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Layout />,
            children: [
                {
                    index: true,
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
        // {
        //     path: "/login",
        //     element: <Login />,
        // },
    ])

    return (
        <AppProvider>
            <RouterProvider router={router} />
        </AppProvider>
    )
}

export default App
