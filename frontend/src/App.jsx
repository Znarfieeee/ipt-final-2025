import React from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Landing from "./pages/Login"

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Login />,
        },
    ])

    return <RouterProvider router={router} />
}

export default App
