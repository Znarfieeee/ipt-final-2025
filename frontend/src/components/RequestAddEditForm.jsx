import React, { useState, useEffect } from "react"
import backendConnection from "../api/BackendConnection"
import { USE_FAKE_BACKEND } from "../api/config"
import { useFakeBackend } from "../api/fakeBackend"
import { showToast } from "../util/alertHelper"

// Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ButtonWithIcon from "./ButtonWithIcon"
import { IoRemove } from "react-icons/io5"
import { IoAddSharp } from "react-icons/io5"

function RequestAddEditForm({ onSubmit, onCancel, initialData }) {
    const { fakeFetch } = useFakeBackend()
    const [employees, setEmployees] = useState([])
    const [formData, setFormData] = useState(() => {
        let initialItems = [];
        
        // If we have initial data, prioritize the items
        if (initialData) {
            console.log("Initializing form with existing request:", initialData.id);
            
            // Check which property has items and use it
            if (initialData.requestItems && initialData.requestItems.length > 0) {
                console.log(`Using ${initialData.requestItems.length} items from requestItems`);
                // Deep copy to avoid reference issues
                initialItems = JSON.parse(JSON.stringify(initialData.requestItems));
                // Ensure each item has an id property if not already present
                initialItems = initialItems.map(item => ({
                    ...item,
                    id: item.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                }));
            } else if (initialData.RequestItems && initialData.RequestItems.length > 0) {
                console.log(`Using ${initialData.RequestItems.length} items from RequestItems`);
                // Deep copy to avoid reference issues
                initialItems = JSON.parse(JSON.stringify(initialData.RequestItems));
                // Ensure each item has an id property if not already present
                initialItems = initialItems.map(item => ({
                    ...item,
                    id: item.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                }));
            }
        }
        
        // If no items were found or this is a new request, add an empty item
        if (initialItems.length === 0) {
            initialItems = [{ 
                name: "", 
                quantity: 1, 
                id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` 
            }];
        }
        
        // Return the complete form data object
        return {
            type: initialData?.type || "",
            userId: initialData?.userId || "",
            requestItems: initialItems,
            status: initialData?.status || "Pending",
            selectedEmployeeId: initialData?.selectedEmployeeId || initialData?.employeeId || initialData?.EmployeeId || "",
        };
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                let employeesData = []

                if (!USE_FAKE_BACKEND) {
                    // Use real backend
                    const [employeesResponse, usersResponse] = await Promise.all([
                        backendConnection.getEmployees(),
                        backendConnection.getUsers(),
                    ])
                    employeesData = Array.isArray(employeesResponse) ? employeesResponse : []
                    const usersData = Array.isArray(usersResponse) ? usersResponse : []

                    // Combine employee data with user info
                    employeesData = employeesData.map(employee => {
                        const user = usersData.find(user => user.id === employee.userId)
                        return {
                            ...employee,
                            userEmail: user ? user.email : "Unknown",
                        }
                    })
                } else {
                    // Use fake backend
                    const response = await fakeFetch("/employees")
                    const data = await response.json()
                    employeesData = Array.isArray(data) ? data : []
                }

                setEmployees(employeesData)
            } catch (error) {
                console.error("Error fetching employees:", error)
                showToast("error", "Failed to fetch employees")
                setEmployees([])
            }
        }
        fetchEmployees()
    }, [fakeFetch])

    const handleChange = e => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async e => {
        e.preventDefault()
        
        // Prevent double submission
        if (isSubmitting) {
            console.log("Submission already in progress, ignoring");
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Validate form data
            if (!formData.type || !formData.userId) {
                throw new Error("Please select a request type and employee")
            }

            const validItems = formData.requestItems.filter(item => item.name && item.quantity > 0)
            if (validItems.length === 0) {
                throw new Error("Please add at least one valid item with a name and quantity")
            }

            // Find the selected employee - ENHANCED EMPLOYEE LOOKUP
            let selectedEmployee;
            let errorDetails = '';
            
            // FIRST: Try by stored employee ID (most reliable)
            if (formData.selectedEmployeeId) {
                selectedEmployee = employees.find(emp => emp.id === parseInt(formData.selectedEmployeeId));
                console.log("Using stored employee ID:", formData.selectedEmployeeId, selectedEmployee ? "found" : "not found");
                if (!selectedEmployee) {
                    errorDetails += "Could not find employee by stored ID. ";
                }
            }
            
            // SECOND: Try by userId
            if (!selectedEmployee && formData.userId) {
                selectedEmployee = employees.find(emp => emp.userId.toString() === formData.userId.toString());
                console.log("Finding employee by userId:", formData.userId, selectedEmployee ? "found" : "not found");
                if (!selectedEmployee) {
                    errorDetails += "Could not find employee by user ID. ";
                }
            }
            
            // THIRD: Try initialData if provided
            if (!selectedEmployee && initialData && (initialData.employeeId || initialData.EmployeeId)) {
                const employeeId = initialData.employeeId || initialData.EmployeeId;
                selectedEmployee = employees.find(emp => emp.id === parseInt(employeeId));
                console.log("Finding employee from initialData:", employeeId, selectedEmployee ? "found" : "not found");
                if (!selectedEmployee) {
                    errorDetails += "Could not find employee from initial data. ";
                }
            }
            
            if (!selectedEmployee) {
                throw new Error(`Selected employee not found. ${errorDetails}Please try selecting the employee again.`);
            }

            console.log("Selected employee:", selectedEmployee);
            
            // Get complete user data for the employee
            let userData = null;
            try {
                // Get the latest user data to ensure we have complete information
                const usersResponse = await backendConnection.getUsers();
                const users = Array.isArray(usersResponse) ? usersResponse : [];
                userData = users.find(u => u.id === selectedEmployee.userId);
                console.log("Found user data for employee:", userData);
            } catch (err) {
                console.error("Error fetching user data:", err);
            }

            // IMPORTANT: Preserve original request items when updating
            let requestItems = validItems.map(item => ({
                name: item.name,
                quantity: parseInt(item.quantity),
            }));
            
            // For debugging purposes, log the items we found in the form
            console.log(`Processing ${requestItems.length} items from form:`, 
                requestItems.map(item => `${item.name} (${item.quantity})`).join(", ")
            );
            
            // When editing, ensure we include any existing request items that might not be in the form
            if (initialData && initialData.id) {
                if (!requestItems || requestItems.length === 0) {
                    console.log("No items in form, using original items from request");
                    // Get items from all possible sources
                    const originalItems = initialData.requestItems || initialData.RequestItems || [];
                    
                    // Make a deep copy to avoid reference issues
                    requestItems = JSON.parse(JSON.stringify(originalItems));
                    console.log(`Using ${requestItems.length} items from original request`);
                }
                
                // Add request ID to each item to ensure proper association
                requestItems = requestItems.map(item => ({
                    ...item,
                    requestId: initialData.id
                }));
                
                console.log("Final request items for edit:", requestItems);
            }

            // Prepare request data with COMPREHENSIVE employee information
            const requestData = {
                type: formData.type,
                // Use BOTH formats to ensure compatibility with backend
                EmployeeId: selectedEmployee.id, // This capitalization is critical - matches database field
                employeeId: selectedEmployee.id, // Lowercase version for consistency
                userId: formData.userId,
                employeeEmail: selectedEmployee.userEmail || "Selected Employee",
                // Include complete employee data directly for frontend display and backend reference
                Employee: {
                    id: selectedEmployee.id,
                    employeeId: selectedEmployee.employeeId,
                    position: selectedEmployee.position,
                    departmentId: selectedEmployee.departmentId,
                    userId: selectedEmployee.userId,
                    User: userData || {
                        id: parseInt(formData.userId),
                        email: selectedEmployee.userEmail
                    }
                },
                status: formData.status,
                requestItems: requestItems,
            };

            console.log("Submitting request with comprehensive data:", requestData);

            let response;
            let createdRequest;
            
            if (!USE_FAKE_BACKEND) {
                // Use real backend
                if (initialData?.id) {
                    response = await backendConnection.updateRequest(initialData.id, requestData);
                } else {
                    response = await backendConnection.createRequest(requestData);
                }
                
                // Check for duplicate detection
                if (response && response.duplicateDetected) {
                    showToast("warning", response.message || "A similar request was just created. Please wait a moment before trying again.");
                    return; // Exit but keep form open
                }
                
                // If we have a response with an ID, use it
                if (response && response.id) {
                    // Create a complete request object to return to parent
                    createdRequest = {
                        ...requestData,
                        id: response.id,
                        // Use backend response fields if available
                        Employee: response.Employee || requestData.Employee,
                        requestItems: response.RequestItems || response.requestItems || requestData.requestItems
                    };
                    
                    // Format employee email with role info if available
                    if (response.Employee && response.Employee.User) {
                        const user = response.Employee.User;
                        const userType = user.role === "Admin" ? "Admin User" : "Normal User";
                        createdRequest.employeeEmail = `${user.email} (${userType})`;
                    }
                    
                    // VERIFICATION: Double-check the response has proper employee info
                    if (!response.Employee || !response.Employee.User) {
                        console.warn("Response missing employee data - attempting repair");
                        try {
                            const repairedResponse = await backendConnection.repairRequest(response.id, {
                                employeeId: selectedEmployee.id,
                                userId: selectedEmployee.userId
                            });
                            
                            // Update with repaired data if available
                            if (repairedResponse && repairedResponse.Employee) {
                                createdRequest.Employee = repairedResponse.Employee;
                                if (repairedResponse.Employee.User) {
                                    const user = repairedResponse.Employee.User;
                                    const userType = user.role === "Admin" ? "Admin User" : "Normal User";
                                    createdRequest.employeeEmail = `${user.email} (${userType})`;
                                }
                            }
                        } catch (err) {
                            console.error("Repair attempt failed:", err);
                        }
                    }
                } else {
                    // No valid response, use the prepared request data
                    createdRequest = requestData;
                }
            } else {
                // Use fake backend
                const method = initialData ? "PUT" : "POST"
                const url = initialData ? `/requests/${initialData.id}` : "/requests"

                const fetchResponse = await fakeFetch(url, {
                    method,
                    body: JSON.stringify(requestData),
                    headers: {
                        "Content-Type": "application/json",
                    },
                })

                response = await fetchResponse.json()
                if (response.error) {
                    throw new Error(response.error)
                }
                
                // For fake backend, use the returned ID
                createdRequest = {
                    ...requestData,
                    id: response.id || Date.now()
                };
            }

            // Pass the complete request data back to the parent component
            console.log("Returning complete request to parent:", createdRequest);
            onSubmit?.(createdRequest);
            showToast("success", initialData ? "Request updated successfully!" : "Request added successfully!");
        } catch (error) {
            console.error("Error submitting request:", error)
            showToast("error", error.message || "An error occurred while submitting the request")
        } finally {
            setIsSubmitting(false);
        }
    }

    const submitButton = (
        <button
            type="submit"
            className="px-4 py-2 rounded-md bg-green-400 text-primary hover:bg-green-600 hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
        >
            {isSubmitting ? (
                <span className="flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </span>
            ) : (
                `${initialData ? "Update" : "Create"} Request`
            )}
        </button>
    )

    return (
        <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card p-6 rounded-lg shadow-lg max-w-[40%] w-full">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <header className="text-2xl font-bold text-foreground mb-6">
                            {initialData ? "Edit" : "Add"} Request
                        </header>
                        <div className="space-y-4">
                            <div className="item">
                                <label htmlFor="type" className="block text-sm font-medium text-foreground mb-1">
                                    Type
                                </label>
                                <Select
                                    onValueChange={value => handleChange({ target: { name: "type", value } })}
                                    value={formData.type}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select request type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Equipment">Equipment</SelectItem>
                                        <SelectItem value="Leave">Leave</SelectItem>
                                        <SelectItem value="Resources">Resources</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label htmlFor="userId" className="block text-sm font-medium text-foreground mb-1">
                                    Employee
                                </label>
                                <Select
                                    onValueChange={value => {
                                        console.log("Selected employee value:", value);
                                        // The value should be the user's ID
                                        handleChange({ target: { name: "userId", value } });
                                        
                                        // Find the selected employee for additional info
                                        const employee = employees.find(emp => emp.userId.toString() === value);
                                        if (employee) {
                                            console.log("Found employee:", employee);
                                            // Store the employee ID for later retrieval
                                            handleChange({ 
                                                target: { 
                                                    name: "selectedEmployeeId", 
                                                    value: employee.id 
                                                } 
                                            });
                                        }
                                    }}
                                    value={formData.userId}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(employee => (
                                            <SelectItem key={employee.id} value={employee.userId.toString()}>
                                                {employee.employeeId} - {employee.position} ({employee.userEmail})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
                                    Status
                                </label>
                                <Select
                                    onValueChange={value => handleChange({ target: { name: "status", value } })}
                                    value={formData.status}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Denied">Denied</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <div>
                                    <div className="flex gap-px justify-between items-center">
                                        <label
                                            htmlFor="type"
                                            className="block text-sm font-medium text-foreground mb-1"
                                        >
                                            Items
                                        </label>{" "}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // Create a new item with a unique temporary ID
                                                const newItem = { 
                                                    name: "", 
                                                    quantity: 1,
                                                    id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                                                };
                                                // Use a deep copy to avoid reference issues
                                                const updatedItems = JSON.parse(JSON.stringify(formData.requestItems || []));
                                                updatedItems.push(newItem);
                                                
                                                setFormData(prev => ({
                                                    ...prev,
                                                    requestItems: updatedItems,
                                                }));
                                                console.log(`Added new item, now have ${updatedItems.length} items`);
                                            }}
                                            className="flex gap-px items-center text-md hover:text-blue-400 cursor-pointer"
                                        >
                                            <IoAddSharp /> Add Item
                                        </button>
                                    </div>
                                    {(Array.isArray(formData.requestItems) ? formData.requestItems : []).map(
                                        (item, index) => (
                                            <div key={index} className="border-1 flex gap-4 p-2 mb-2">
                                                <div className="w-full">
                                                    <label
                                                        htmlFor={`name-${index}`}
                                                        className="block text-sm font-medium text-foreground mb-1"
                                                    >
                                                        Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id={`name-${index}`}
                                                        value={item.name}
                                                        onChange={e => {
                                                            // Create a deep copy of the items array
                                                            const newItems = JSON.parse(JSON.stringify(formData.requestItems));
                                                            newItems[index].name = e.target.value;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                requestItems: newItems,
                                                            }));
                                                        }}
                                                        className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                                        required
                                                    />
                                                </div>
                                                <div className="w-full">
                                                    <label
                                                        htmlFor={`quantity-${index}`}
                                                        className="block text-sm font-medium text-foreground mb-1"
                                                    >
                                                        Quantity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        id={`quantity-${index}`}
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={e => {
                                                            // Create a deep copy of the items array
                                                            const newItems = JSON.parse(JSON.stringify(formData.requestItems));
                                                            newItems[index].quantity = parseInt(e.target.value) || 1;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                requestItems: newItems,
                                                            }));
                                                        }}
                                                        className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            console.log(`Removing item at index ${index}: ${item.name}`);
                                                            // Create a deep copy of the existing array to prevent reference issues
                                                            const newItems = JSON.parse(JSON.stringify(formData.requestItems));
                                                            // Remove only the item at the specified index
                                                            newItems.splice(index, 1);
                                                            console.log(`Items after removal: ${newItems.length}`);
                                                            // Update the form data with the new array
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                requestItems: newItems.length > 0 ? newItems : [{ name: "", quantity: 1 }],
                                                            }));
                                                        }}
                                                        className="flex gap-px justify-center items-center text-sm py-2 hover:text-red-400 cursor-pointer"
                                                    >
                                                        <IoRemove />
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-4 py-2 rounded-md bg-red-400 text-secondary-foreground hover:bg-red-600 hover:text-background transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                {submitButton}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

export default RequestAddEditForm
