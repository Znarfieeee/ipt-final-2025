import React, { useState, useEffect } from "react"
import { useFakeBackend } from "../api/fakeBackend"

// UI Components
import { BiArrowBack } from "react-icons/bi"

function WorkflowsForm({ initialData, onCancel }) {
    const { fakeFetch } = useFakeBackend()
    const [workflows, setWorkflows] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchWorkflows = async () => {
            try {
                const response = await fakeFetch(`/workflows/employee/${initialData.id}`)
                const data = await response.json()
                setWorkflows(data)
            } catch (err) {
                console.error("Error fetching workflows:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchWorkflows()
    }, [fakeFetch, initialData.id])

    const handleStatusChange = async (workflowId, newStatus) => {
        try {
            await fakeFetch(`/workflows/${workflowId}`, {
                method: "PUT",
                body: { status: newStatus },
            })
            setWorkflows(prev => prev.map(w => (w.id === workflowId ? { ...w, status: newStatus } : w)))
        } catch (err) {
            console.error("Error updating workflow status:", err)
        }
    }

    function handleStatus(status) {
        const statusStyles = {
            Approved: "bg-green-400",
            Rejected: "bg-red-400",
            Pending: "bg-yellow-400",
        }

        return (
            <span className={`px-3 py-1 rounded-full text-md font-medium text-white ${statusStyles[status]}`}>
                {status}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card p-6 rounded-lg shadow-lg">Loading workflows...</div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card p-6 rounded-lg shadow-lg max-w-[80%] w-full">
                <div className="space-y-4">
                    <header className="text-2xl font-bold text-foreground mb-6">
                        Workflows for Employee: {initialData.employeeId}
                    </header>
                    <div className="space-y-4">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                        Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {workflows.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            No workflows found
                                        </td>
                                    </tr>
                                ) : (
                                    workflows.map(workflow => (
                                        <tr key={workflow.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {workflow.type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {workflow.details.task}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {handleStatus(workflow.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <select
                                                    value={workflow.status}
                                                    onChange={e => handleStatusChange(workflow.id, e.target.value)}
                                                    className="rounded-md border border-gray-300 px-2 py-1"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Approved">Approved</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex gap-2 items-center justify-center px-4 py-2 rounded-md bg-green-400 text-primary hover:bg-green-600 hover:text-background transition-colors"
                            >
                                <BiArrowBack /> to Employees
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WorkflowsForm
