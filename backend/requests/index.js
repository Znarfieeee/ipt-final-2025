const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const db = require("../_helpers/db")
const authorize = require("../_middleware/authorize")
const validateRequest = require("../_middleware/validate-request")
const Role = require("../_helpers/role")

// Validation rules
const createValidation = [
    body("type").notEmpty().withMessage("Request type is required"),
    body("requestItems")
        .isArray()
        .withMessage("Request items must be an array"),
    body("requestItems.*.name").notEmpty().withMessage("Item name is required"),
    body("requestItems.*.quantity")
        .isInt({ min: 1 })
        .withMessage("Quantity must be at least 1"),
]

const updateValidation = [
    body("type")
        .optional()
        .notEmpty()
        .withMessage("Request type cannot be empty"),
    body("status")
        .optional()
        .isIn(["Pending", "Approved", "Rejected"])
        .withMessage("Invalid status"),
    body("requestItems")
        .optional()
        .isArray()
        .withMessage("Request items must be an array"),
    body("requestItems.*.name")
        .optional()
        .notEmpty()
        .withMessage("Item name cannot be empty"),
    body("requestItems.*.quantity")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Quantity must be at least 1"),
]

// Improve the repair function to be more thorough
async function repairEmployeeAssociations() {
    try {
        // Get all requests that might have issues
        const requests = await db.Request.findAll({
            attributes: ["id", "employeeId", "EmployeeId"],
            raw: true,
        })

        // Get all employees for faster lookups
        const employees = await db.Employee.findAll({
            include: [
                {
                    model: db.User,
                    attributes: [
                        "id",
                        "email",
                        "firstName",
                        "lastName",
                        "role",
                    ],
                },
            ],
        })

        // Create a map of employees by ID for faster lookups
        const employeeMap = {}
        employees.forEach(employee => {
            employeeMap[employee.id] = employee
        })

        let repairCount = 0
        let errorCount = 0

        // Process each request
        for (const request of requests) {
            try {
                // Get employeeId from either field
                const employeeId = request.employeeId || request.EmployeeId

                // Check if the employee exists
                const employee = employeeMap[employeeId]

                // Get the actual request object from the database
                const dbRequest = await db.Request.findByPk(request.id)

                // AGGRESSIVE FIX: Force update the request with correct employee IDs
                await dbRequest.update({
                    employeeId: employee.id,
                    EmployeeId: employee.id,
                })

                // Force set the association
                await dbRequest.setEmployee(employee)

                // Double-check the association is correct
                const verifyRequest = await db.Request.findByPk(request.id, {
                    include: [
                        {
                            model: db.Employee,
                            include: [{ model: db.User }],
                        },
                    ],
                })

                if (verifyRequest.Employee && verifyRequest.Employee.User) {
                    repairCount++
                } else {
                    errorCount++
                }
            } catch (err) {
                errorCount++
            }
        }
    } catch (err) {
        console.error("Error during employee association repair:", err)
    }
}

// Start the repair process immediately
repairEmployeeAssociations()

// Track recent requests to prevent duplicates
const recentRequests = new Map()

// Routes aligned with API requirements
router.post("/", authorize(), validateRequest(createValidation), create)
router.get("/", authorize(Role.Admin), getAll)
router.get("/:id([0-9]+)", authorize(), getById)
router.get("/employee/:employeeId([0-9]+)", authorize(), getByEmployeeId)
router.put(
    "/:id([0-9]+)",
    authorize(Role.Admin),
    validateRequest(updateValidation),
    update
)
router.delete("/:id([0-9]+)", authorize(Role.Admin), _delete)

// Additional utility endpoints
router.get("/:id([0-9]+)/items", authorize(), getItemsByRequestId)
router.post("/:id([0-9]+)/repair", authorize(), repairRequestAssociation)
router.post("/deduplicate", authorize(Role.Admin), deduplicateRequests)
router.delete("/all", authorize(Role.Admin), deleteAllRequests)

async function create(req, res, next) {
    try {
        // First check if we have a direct employeeId provided
        let employeeId = req.body.EmployeeId || req.body.employeeId

        // If not, find the employee by userId
        if (!employeeId && req.body.userId) {
            const employee = await db.Employee.findOne({
                where: { userId: req.body.userId },
            })
            if (!employee) {
                throw new Error("Employee not found for the selected user")
            }
            employeeId = employee.id
        }

        if (!employeeId) {
            throw new Error("Employee ID is required")
        }

        // Check for potential duplicate requests (same type and employee in last 5 seconds)
        const requestKey = `${req.body.type}_${employeeId}`
        if (recentRequests.has(requestKey)) {
            const timeSince = Date.now() - recentRequests.get(requestKey)

            // If a similar request was created in the last 5 seconds, consider it a duplicate
            if (timeSince < 5000) {
                console.warn(
                    `Potential duplicate request detected: ${requestKey}, age: ${timeSince}ms`
                )
                return res.status(409).json({
                    message:
                        "A similar request was just created. Please wait a moment before submitting again.",
                    duplicateDetected: true,
                })
            }
        }

        // Get the full employee data to ensure it's valid
        const employee = await db.Employee.findByPk(employeeId, {
            include: [
                {
                    model: db.User,
                    attributes: [
                        "id",
                        "email",
                        "firstName",
                        "lastName",
                        "role",
                    ],
                },
            ],
        })

        if (!employee) {
            throw new Error(`Employee with ID ${employeeId} not found`)
        }

        // Get items from either field name for flexibility
        const requestItems =
            req.body.requestItems || req.body.RequestItems || []

        // Use a single transaction for ALL database operations
        const transaction = await db.sequelize.transaction()

        try {
            // Prepare the request data WITHOUT items first
            const requestData = {
                type: req.body.type,
                employeeId: employeeId,
                EmployeeId: employeeId,
                status: req.body.status || "Pending",
            }

            // Create the request within the transaction
            const request = await db.Request.create(requestData, {
                transaction,
            })

            // Format items for creation with explicit requestId
            if (requestItems && requestItems.length > 0) {
                const formattedItems = requestItems.map(item => ({
                    name: item.name,
                    quantity: parseInt(item.quantity) || 1,
                    requestId: request.id,
                }))

                // Create all items at once within transaction
                const createdItems = await db.RequestItem.bulkCreate(
                    formattedItems,
                    {
                        transaction,
                        validate: true,
                        returning: true,
                    }
                )
            }

            // Commit the transaction ONLY if both request and items succeed
            await transaction.commit()

            // Fetch the complete request with ALL associations to return to client
            const completeRequest = await db.Request.findByPk(request.id, {
                include: [
                    { model: db.RequestItem },
                    {
                        model: db.Employee,
                        include: [
                            {
                                model: db.User,
                                attributes: [
                                    "id",
                                    "email",
                                    "firstName",
                                    "lastName",
                                    "role",
                                ],
                            },
                        ],
                    },
                ],
            })

            // Double-verify that we have items by doing a separate query
            const itemCount = await db.RequestItem.count({
                where: { requestId: request.id },
            })

            // Get the plain object to modify if needed
            const plainRequest = completeRequest.get({ plain: true })

            // Ensure items are included with consistent format and corrected references
            if (
                (!plainRequest.requestItems ||
                    plainRequest.requestItems.length === 0) &&
                itemCount > 0
            ) {
                const finalItems = await db.RequestItem.findAll({
                    where: { requestId: request.id },
                    raw: true,
                })

                plainRequest.requestItems = finalItems
                plainRequest.RequestItems = finalItems
            }

            // Store this request in the recent requests map to prevent duplicates
            recentRequests.set(requestKey, Date.now())

            // Clean up old entries from the recentRequests map periodically
            if (recentRequests.size > 100) {
                const now = Date.now()
                for (const [key, timestamp] of recentRequests.entries()) {
                    if (now - timestamp > 60000) {
                        // Remove entries older than 1 minute
                        recentRequests.delete(key)
                    }
                }
            }

            // Verify the employee association was successful
            if (!plainRequest.Employee || !plainRequest.Employee.User) {
                console.error(
                    "Warning: Employee association failed for request",
                    request.id
                )

                // Add employee data manually
                plainRequest.Employee = employee.get({ plain: true })
            }

            res.status(201).json(plainRequest)
        } catch (error) {
            // Rollback transaction if anything fails
            await transaction.rollback()
            console.error("Error creating request or items:", error)
            throw error // Re-throw to be caught by outer catch
        }
    } catch (err) {
        console.error("Error creating request:", err)
        next(err)
    }
}

async function getAll(req, res, next) {
    try {
        // First, get all requests with their employee data
        const requests = await db.Request.findAll({
            include: [
                {
                    model: db.RequestItem,
                    required: false, // Use left join to include requests even without items
                },
                {
                    model: db.Employee,
                    include: [
                        {
                            model: db.User,
                            attributes: [
                                "id",
                                "email",
                                "firstName",
                                "lastName",
                                "role",
                            ],
                        },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
        })

        // Create a deep copy to avoid sequelize issues with plain objects
        const enhancedRequests = []

        // Process each request to ensure it has its items
        for (const request of requests) {
            // Convert to plain object to work with
            const plainRequest = request.get({ plain: true })

            // Check if the request has items through the association
            const hasItems =
                plainRequest.RequestItems &&
                plainRequest.RequestItems.length > 0

            // If no associated items, try direct fetch
            if (!hasItems) {
                // Try to directly fetch items for this request
                const items = await db.RequestItem.findAll({
                    where: { requestId: plainRequest.id },
                    raw: true,
                })

                if (items && items.length > 0) {
                    plainRequest.requestItems = items
                    plainRequest.RequestItems = items
                } else {
                    plainRequest.requestItems = []
                    plainRequest.RequestItems = []
                }
            } else {
                // Make sure both formats exist
                plainRequest.requestItems = plainRequest.RequestItems
            }

            // Check for employee association and repair if needed
            if (!plainRequest.Employee || !plainRequest.Employee.User) {
                if (plainRequest.employeeId || plainRequest.EmployeeId) {
                    const employeeId =
                        plainRequest.employeeId || plainRequest.EmployeeId

                    const employee = await db.Employee.findByPk(employeeId, {
                        include: [
                            {
                                model: db.User,
                                attributes: [
                                    "id",
                                    "email",
                                    "firstName",
                                    "lastName",
                                    "role",
                                ],
                            },
                        ],
                    })

                    if (employee) {
                        plainRequest.Employee = employee.get({ plain: true })

                        // Update the database to fix the association for future requests
                        try {
                            const dbRequest = await db.Request.findByPk(
                                plainRequest.id
                            )
                            if (dbRequest) {
                                await dbRequest.setEmployee(employee)
                            }
                        } catch (associationErr) {
                            console.error(
                                `Failed to update association in DB: ${associationErr.message}`
                            )
                        }
                    }
                }
            }

            enhancedRequests.push(plainRequest)
        }

        res.json(enhancedRequests)
    } catch (err) {
        console.error("Error in getAll requests:", err)
        next(err)
    }
}

async function getById(req, res, next) {
    try {
        const request = await db.Request.findByPk(req.params.id, {
            include: [
                {
                    model: db.RequestItem,
                    required: false, // Use left join to include the request even without items
                },
                {
                    model: db.Employee,
                    include: [
                        {
                            model: db.User,
                            attributes: [
                                "id",
                                "email",
                                "firstName",
                                "lastName",
                                "role",
                            ],
                        },
                    ],
                },
            ],
        })

        if (!request) throw new Error("Request not found")

        // Authorization check
        if (
            req.user.role !== Role.Admin &&
            request.employeeId !== req.user.employeeId
        ) {
            throw new Error("Unauthorized")
        }

        // Convert to plain object for potential enhancement
        const plainRequest = request.get({ plain: true })

        // If items are missing, try to fetch them explicitly
        if (
            (!plainRequest.requestItems ||
                plainRequest.requestItems.length === 0) &&
            (!plainRequest.RequestItems ||
                plainRequest.RequestItems.length === 0)
        ) {
            // Direct query for items with this request ID
            const items = await db.RequestItem.findAll({
                where: { requestId: plainRequest.id },
            })

            if (items && items.length > 0) {
                plainRequest.requestItems = items.map(item =>
                    item.get({ plain: true })
                )
                plainRequest.RequestItems = plainRequest.requestItems // Set both formats for consistency
            }
        }

        // Make sure both requestItems and RequestItems are set for consistency
        if (plainRequest.requestItems && plainRequest.requestItems.length > 0) {
            if (
                !plainRequest.RequestItems ||
                plainRequest.RequestItems.length === 0
            ) {
                plainRequest.RequestItems = [...plainRequest.requestItems]
            }
        } else if (
            plainRequest.RequestItems &&
            plainRequest.RequestItems.length > 0
        ) {
            if (
                !plainRequest.requestItems ||
                plainRequest.requestItems.length === 0
            ) {
                plainRequest.requestItems = [...plainRequest.RequestItems]
            }
        }

        // If employee data is missing, try to find it
        if (!plainRequest.Employee || !plainRequest.Employee.User) {
            const employeeId =
                plainRequest.employeeId || plainRequest.EmployeeId
            if (employeeId) {
                const employee = await db.Employee.findByPk(employeeId, {
                    include: [
                        {
                            model: db.User,
                            attributes: [
                                "id",
                                "email",
                                "firstName",
                                "lastName",
                                "role",
                            ],
                        },
                    ],
                })

                if (employee) {
                    plainRequest.Employee = employee.get({ plain: true })

                    // Also update the database to fix the association for future requests
                    try {
                        const dbRequest = await db.Request.findByPk(
                            plainRequest.id
                        )
                        if (dbRequest) {
                            await dbRequest.setEmployee(employee)
                        }
                    } catch (associationErr) {
                        console.error(
                            `Failed to update association in DB: ${associationErr.message}`
                        )
                    }
                } else {
                    console.error(
                        `Could not find employee with ID ${employeeId} for request ${plainRequest.id}`
                    )
                }
            } else {
                console.error(`Request ${plainRequest.id} has no employeeId`)
            }
        }

        res.json(plainRequest)
    } catch (err) {
        next(err)
    }
}

async function getByEmployeeId(req, res, next) {
    try {
        const requests = await db.Request.findAll({
            where: { employeeId: req.params.employeeId },
            include: [
                { model: db.RequestItem },
                {
                    model: db.Employee,
                    include: [
                        {
                            model: db.User,
                            attributes: [
                                "id",
                                "email",
                                "firstName",
                                "lastName",
                                "role",
                            ],
                        },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
        })

        // Get information about the employee once for all requests
        const employee = await db.Employee.findByPk(req.params.employeeId, {
            include: [
                {
                    model: db.User,
                    attributes: [
                        "id",
                        "email",
                        "firstName",
                        "lastName",
                        "role",
                    ],
                },
            ],
        })

        // Convert to plain objects and ensure employee data is attached
        const enhancedRequests = requests.map(request => {
            const plainRequest = request.get({ plain: true })

            // If employee data is missing, add it from our separate query
            if (
                (!plainRequest.Employee || !plainRequest.Employee.User) &&
                employee
            ) {
                plainRequest.Employee = employee.get({ plain: true })
            }

            return plainRequest
        })

        res.json(enhancedRequests)
    } catch (err) {
        console.error("Error in getByEmployeeId:", err)
        next(err)
    }
}

async function update(req, res, next) {
    try {
        const request = await db.Request.findByPk(req.params.id)
        if (!request) throw new Error("Request not found")

        // Handle employee relationship properly
        const updateData = { ...req.body }

        // If employeeId is provided in any format, ensure it's set correctly
        if (updateData.EmployeeId || updateData.employeeId) {
            const employeeId = updateData.EmployeeId || updateData.employeeId
            updateData.employeeId = employeeId
            updateData.EmployeeId = employeeId

            // Get the actual employee to ensure it exists and set the association
            const employee = await db.Employee.findByPk(employeeId, {
                include: [
                    {
                        model: db.User,
                        attributes: [
                            "id",
                            "email",
                            "firstName",
                            "lastName",
                            "role",
                        ],
                    },
                ],
            })

            if (employee) {
                // Update the association directly
                await request.setEmployee(employee)
            } else {
                console.error(
                    `Employee with ID ${employeeId} not found for request update`
                )
            }
        }

        // Save the requested items before removing them from the update data
        const items = req.body.requestItems || req.body.RequestItems || []

        // Remove items from the update data - we'll handle them separately
        delete updateData.requestItems
        delete updateData.RequestItems

        // Update the request basic info
        await request.update(updateData)

        // Handle request items if provided
        if (items.length > 0) {
            try {
                // Get all existing items for this request
                const existingItems = await db.RequestItem.findAll({
                    where: { requestId: request.id },
                    raw: true,
                })

                // Format and clean the incoming items
                const processedItems = items.map(item => ({
                    name: item.name,
                    quantity: parseInt(item.quantity) || 1,
                    requestId: request.id,
                    // Only keep real database IDs
                    ...(item.id && typeof item.id === "number"
                        ? { id: item.id }
                        : {}),
                }))

                // 1. HANDLE NEW ITEMS: Items without IDs
                const newItems = processedItems.filter(item => !item.id)

                if (newItems.length > 0) {
                    // Create all new items at once
                    const createdItems = await db.RequestItem.bulkCreate(
                        newItems
                    )

                    // Force check that all new items have the correct requestId
                    for (const item of createdItems) {
                        if (!item.requestId || item.requestId !== request.id) {
                            await item.update({ requestId: request.id })
                        }
                    }
                }

                // 2. HANDLE UPDATES: Items with existing IDs that need to be updated
                const existingIds = existingItems.map(item => item.id)
                const itemsToUpdate = processedItems.filter(
                    item => item.id && existingIds.includes(item.id)
                )

                for (const item of itemsToUpdate) {
                    await db.RequestItem.update(
                        {
                            name: item.name,
                            quantity: item.quantity,
                            requestId: request.id,
                        },
                        { where: { id: item.id } }
                    )
                }

                // 3. HANDLE DELETIONS: Delete items that are in DB but not in the update request
                const updatedIds = processedItems
                    .filter(item => item.id)
                    .map(item => item.id)

                const idsToDelete = existingIds.filter(
                    id => !updatedIds.includes(id)
                )

                if (idsToDelete.length > 0) {
                    const deleteResult = await db.RequestItem.destroy({
                        where: { id: idsToDelete, requestId: request.id },
                    })
                } else {
                    console.log("No items needed to be deleted")
                }
            } catch (itemError) {
                console.error("Error updating request items:", itemError)
                // Continue processing request - don't fail the whole update if items have issues
            }
        } else {
            console.log(`No items provided in update for request ${request.id}`)
        }

        // Return the complete updated request with employee data and items
        const updatedRequest = await db.Request.findByPk(req.params.id, {
            include: [
                { model: db.RequestItem },
                {
                    model: db.Employee,
                    include: [{ model: db.User }],
                },
            ],
        })

        // Double-check for items - if none found through association, try direct query
        const plainRequest = updatedRequest.get({ plain: true })

        const hasItems =
            plainRequest.RequestItems && plainRequest.RequestItems.length > 0
        if (!hasItems) {
            // Try to get the items directly
            const directItems = await db.RequestItem.findAll({
                where: { requestId: request.id },
                raw: true,
            })

            if (directItems.length > 0) {
                plainRequest.requestItems = directItems
                plainRequest.RequestItems = directItems
            }
        } else {
            // Make sure both formats exist
            plainRequest.requestItems = plainRequest.RequestItems
        }

        // If employee data is still missing, try to find it explicitly
        if (!plainRequest.Employee || !plainRequest.Employee.User) {
            if (updateData.employeeId || updateData.EmployeeId) {
                const employeeId =
                    updateData.employeeId || updateData.EmployeeId
                const employee = await db.Employee.findByPk(employeeId, {
                    include: [{ model: db.User }],
                })

                if (employee) {
                    plainRequest.Employee = employee.get({ plain: true })
                }
            }
        }

        res.json(plainRequest)
    } catch (err) {
        next(err)
    }
}

async function _delete(req, res, next) {
    try {
        const request = await db.Request.findByPk(req.params.id)
        if (!request) throw new Error("Request not found")
        await request.destroy()
        res.json({ message: "Request deleted" })
    } catch (err) {
        next(err)
    }
}

async function repairRequestAssociation(req, res, next) {
    try {
        const requestId = req.params.id
        const request = await db.Request.findByPk(requestId)

        if (!request) {
            throw new Error("Request not found")
        }

        // Get the employeeId from various sources
        let employeeId =
            req.body.employeeId ||
            req.body.EmployeeId ||
            request.employeeId ||
            request.EmployeeId

        // If no employeeId is provided or found, try to find by userId
        if (!employeeId && req.body.userId) {
            const employee = await db.Employee.findOne({
                where: { userId: req.body.userId },
            })

            if (employee) {
                employeeId = employee.id
            }
        }

        if (!employeeId) {
            throw new Error("Cannot repair request: No employee ID found")
        }

        // Find the employee
        const employee = await db.Employee.findByPk(employeeId, {
            include: [
                {
                    model: db.User,
                    attributes: [
                        "id",
                        "email",
                        "firstName",
                        "lastName",
                        "role",
                    ],
                },
            ],
        })

        if (!employee) {
            throw new Error(`Employee with ID ${employeeId} not found`)
        }

        // Update the request with the correct employeeId and association
        await request.update({
            employeeId: employee.id,
            EmployeeId: employee.id,
        })

        // Set the association directly
        await request.setEmployee(employee)

        // Return the fully repaired request
        const repairedRequest = await db.Request.findByPk(requestId, {
            include: [
                { model: db.RequestItem },
                {
                    model: db.Employee,
                    include: [
                        {
                            model: db.User,
                            attributes: [
                                "id",
                                "email",
                                "firstName",
                                "lastName",
                                "role",
                            ],
                        },
                    ],
                },
            ],
        })

        res.json(repairedRequest)
    } catch (err) {
        console.error("Error repairing request:", err)
        next(err)
    }
}

// Function to deduplicate requests
async function deduplicateRequests(req, res, next) {
    try {
        // Get all requests
        const requests = await db.Request.findAll({
            attributes: ["id", "type", "status", "employeeId", "createdAt"],
            raw: true,
        })

        // Group by type+employeeId+status (likely duplicates)
        const grouped = {}
        requests.forEach(req => {
            const key = `${req.type}_${req.employeeId}_${req.status}`
            if (!grouped[key]) {
                grouped[key] = []
            }
            grouped[key].push(req)
        })

        // Find groups with more than one request (duplicates)
        let removedCount = 0
        const removedIds = []

        for (const [key, group] of Object.entries(grouped)) {
            if (group.length > 1) {
                // Sort by creation date, keep the newest one
                group.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                )

                // Keep the first one (newest), delete the rest
                for (let i = 1; i < group.length; i++) {
                    await db.Request.destroy({ where: { id: group[i].id } })
                    removedIds.push(group[i].id)
                    removedCount++
                }
            }
        }

        if (removedCount > 0) {
            res.json({
                success: true,
                message: `Removed ${removedCount} duplicate requests`,
                removedIds,
                totalAfter: requests.length - removedCount,
            })
        } else {
            res.json({ success: true, message: "No duplicate requests found" })
        }
    } catch (err) {
        console.error("Error deduplicating requests:", err)
        next(err)
    }
}

// Function to delete ALL requests in the database
async function deleteAllRequests(req, res, next) {
    try {
        // First delete all request items (to handle foreign key constraints)
        await db.RequestItem.destroy({ where: {} })

        // Then delete all requests
        const count = await db.Request.destroy({ where: {} })

        res.json({
            success: true,
            message: `Successfully deleted ${count} requests from the database`,
            deletedCount: count,
        })
    } catch (err) {
        console.error("Error deleting all requests:", err)
        next(err)
    }
}

// Enhanced function to get items for a specific request with multiple retrieval methods
async function getItemsByRequestId(req, res, next) {
    try {
        const requestId = req.params.id

        let items = []
        let foundItems = false

        // Method 1: Direct query with requestId - most reliable
        try {
            const directItems = await db.RequestItem.findAll({
                where: { requestId: requestId },
                order: [["id", "ASC"]],
            })

            if (directItems && directItems.length > 0) {
                items = directItems
                foundItems = true
            }
        } catch (e) {
            console.error("Error in direct query method:", e)
        }

        // Method 2: Through association - if direct method found nothing
        if (!foundItems) {
            try {
                const request = await db.Request.findByPk(requestId, {
                    include: [{ model: db.RequestItem }],
                })

                if (
                    request &&
                    request.RequestItems &&
                    request.RequestItems.length > 0
                ) {
                    items = request.RequestItems.map(item =>
                        item.get({ plain: true })
                    )
                    foundItems = true
                }
            } catch (e) {
                console.error("Error in association method:", e)
            }
        }

        // Method 3: Raw query as last resort - bypasses all ORM limitations
        if (!foundItems) {
            try {
                const [rawItems] = await db.sequelize.query(
                    `SELECT * FROM RequestItems WHERE requestId = ? ORDER BY id ASC`,
                    {
                        replacements: [requestId],
                        type: db.Sequelize.QueryTypes.SELECT,
                    }
                )

                if (rawItems && rawItems.length > 0) {
                    items = rawItems
                    foundItems = true
                }
            } catch (e) {
                console.error("Error in raw query method:", e)
            }
        }

        // Return whatever items we found (could be empty array)
        res.json(items)
    } catch (err) {
        console.error(`Error fetching items for request ${req.params.id}:`, err)
        next(err)
    }
}

module.exports = router
