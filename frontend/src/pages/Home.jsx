import React, { useState, useEffect } from "react"
import { useFakeBackend } from "../api/fakeBackend"
import { Link } from "react-router-dom"
import { IoMdPeople } from "react-icons/io"
import { IoBusinessSharp } from "react-icons/io5"
import { MdAssignment } from "react-icons/md"

function Home() {
    const { fakeFetch } = useFakeBackend()
    const [stats, setStats] = useState({
        departments: 0,
        employees: 0,
        requests: {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
        },
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch departments count
                const deptsResponse = await fakeFetch("/departments")
                const deptsData = await deptsResponse.json()

                // Fetch employees count
                const empsResponse = await fakeFetch("/employees")
                const empsData = await empsResponse.json()

                // Fetch requests
                const reqsResponse = await fakeFetch("/requests")
                const reqsData = await reqsResponse.json()

                // Calculate stats
                const requestStats = {
                    total: reqsData.length,
                    pending: reqsData.filter(r => r.status === "Pending").length,
                    approved: reqsData.filter(r => r.status === "Approved").length,
                    rejected: reqsData.filter(r => r.status === "Rejected").length,
                }

                setStats({
                    departments: deptsData.length,
                    employees: empsData.length,
                    requests: requestStats,
                })
                setError(null)
            } catch (err) {
                console.error("Error fetching statistics:", err)
                setError("Failed to load dashboard statistics")
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [fakeFetch])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 animate-pulse">
                <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce200"></div>
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce400"></div>
                </div>
                <div className="text-center text-gray-500">Loading dashboard...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-red-500">Error: {error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                    Welcome to the Management System with a Sample Datas
                </h1>
                <p className="text-muted-foreground">Monitor your organization's key metrics and activities</p>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/departments" className="block">
                    <div className="bg-card hover:bg-accent/50 transition-colors p-6 rounded-lg shadow-md border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <IoBusinessSharp className="text-3xl text-blue-500" />
                            <span className="text-2xl font-bold">{stats.departments}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Departments</h3>
                        <p className="text-muted-foreground">Total departments in the organization</p>
                    </div>
                </Link>

                <Link to="/employees" className="block">
                    <div className="bg-card hover:bg-accent/50 transition-colors p-6 rounded-lg shadow-md border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <IoMdPeople className="text-3xl text-green-500" />
                            <span className="text-2xl font-bold">{stats.employees}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Employees</h3>
                        <p className="text-muted-foreground">Total active employees</p>
                    </div>
                </Link>

                <Link to="/requests" className="block">
                    <div className="bg-card hover:bg-accent/50 transition-colors p-6 rounded-lg shadow-md border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <MdAssignment className="text-3xl text-yellow-500" />
                            <span className="text-2xl font-bold">{stats.requests.total}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Requests</h3>
                        <p className="text-muted-foreground">Total requests submitted</p>
                    </div>
                </Link>
            </div>

            {/* Request Status Breakdown */}
            <div className="bg-card p-6 rounded-lg shadow-md border border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4">Request Status Overview</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-yellow-100 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-700">{stats.requests.pending}</div>
                        <div className="text-sm text-yellow-600">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-green-100 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">{stats.requests.approved}</div>
                        <div className="text-sm text-green-600">Approved</div>
                    </div>
                    <div className="text-center p-4 bg-red-100 rounded-lg">
                        <div className="text-2xl font-bold text-red-700">{stats.requests.rejected}</div>
                        <div className="text-sm text-red-600">Rejected</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home
