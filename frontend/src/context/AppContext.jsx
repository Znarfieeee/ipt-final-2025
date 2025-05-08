import React, { createContext, useContext, useState, useEffect } from "react"
import { useFakeBackend } from "../api/fakeBackend"

const AppContext = createContext()

export function AppProvider({ children }) {
    const { fakeFetch } = useFakeBackend()
    const [employees, setEmployees] = useState([])
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [employeesRes, departmentsRes] = await Promise.all([
                    fakeFetch("/employees"),
                    fakeFetch("/departments"),
                ])

                const employeesData = await employeesRes.json()
                const departmentsData = await departmentsRes.json()

                setEmployees(employeesData)
                setDepartments(departmentsData)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [fakeFetch])

    const value = {
        employees,
        departments,
        loading,
        error,
        setEmployees,
        setDepartments,
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error("useApp must be used within an AppProvider")
    }
    return context
}
