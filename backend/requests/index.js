const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const db = require("../_helpers/db");
const authorize = require("../_middleware/authorize");
const validateRequest = require("../_middleware/validate-request");
const Role = require("../_helpers/role");

// Validation rules
const createValidation = [
  body("type").notEmpty().withMessage("Request type is required"),
  body("requestItems").isArray().withMessage("Request items must be an array"),
  body("requestItems.*.name").notEmpty().withMessage("Item name is required"),
  body("requestItems.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
];

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
];

// Improve the repair function to be more thorough
async function repairEmployeeAssociations() {
  try {
    console.log("Starting repair of employee associations for requests...");

    // Get all requests that might have issues
    const requests = await db.Request.findAll({
      attributes: ["id", "employeeId", "EmployeeId"],
      raw: true,
    });

    // Get all employees for faster lookups
    const employees = await db.Employee.findAll({
      include: [
        {
          model: db.User,
          attributes: ["id", "email", "firstName", "lastName", "role"],
        },
      ],
    });

    // Create a map of employees by ID for faster lookups
    const employeeMap = {};
    employees.forEach((employee) => {
      employeeMap[employee.id] = employee;
    });

    console.log(`Found ${requests.length} requests to check for repairs`);
    console.log(
      `Found ${employees.length} employees available for association`
    );

    let repairCount = 0;
    let errorCount = 0;

    // Process each request
    for (const request of requests) {
      try {
        // Get employeeId from either field
        const employeeId = request.employeeId || request.EmployeeId;
        if (!employeeId) {
          console.log(`Request ${request.id} has no employeeId, skipping`);
          continue;
        }

        // Check if the employee exists
        const employee = employeeMap[employeeId];
        if (!employee) {
          console.log(
            `Cannot find employee with ID ${employeeId} for request ${request.id}, skipping`
          );
          continue;
        }

        // Get the actual request object from the database
        const dbRequest = await db.Request.findByPk(request.id);
        if (!dbRequest) {
          console.log(`Cannot find request with ID ${request.id}, skipping`);
          continue;
        }

        // AGGRESSIVE FIX: Force update the request with correct employee IDs
        await dbRequest.update({
          employeeId: employee.id,
          EmployeeId: employee.id,
        });

        // Force set the association
        await dbRequest.setEmployee(employee);

        // Double-check the association is correct
        const verifyRequest = await db.Request.findByPk(request.id, {
          include: [
            {
              model: db.Employee,
              include: [{ model: db.User }],
            },
          ],
        });

        if (verifyRequest.Employee && verifyRequest.Employee.User) {
          console.log(
            `Successfully repaired request ${request.id} -> Employee: ${verifyRequest.Employee.User.email}`
          );
          repairCount++;
        } else {
          console.log(`Failed to verify repair for request ${request.id}`);
          errorCount++;
        }
      } catch (err) {
        console.error(`Error repairing request ${request.id}:`, err.message);
        errorCount++;
      }
    }

    console.log(
      `Completed repairs. Fixed ${repairCount} requests. Errors: ${errorCount}.`
    );
  } catch (err) {
    console.error("Error during employee association repair:", err);
  }
}

// Start the repair process immediately
repairEmployeeAssociations();

// Track recent requests to prevent duplicates
const recentRequests = new Map();

// Routes
router.post("/", authorize(), validateRequest(createValidation), create);
router.get("/", authorize(Role.Admin), getAll);
router.get("/:id([0-9]+)", authorize(), getById);
router.get("/employee/:employeeId([0-9]+)", authorize(), getByEmployeeId);
router.put(
  "/:id([0-9]+)",
  authorize(Role.Admin),
  validateRequest(updateValidation),
  update
);
router.delete("/:id([0-9]+)", authorize(Role.Admin), _delete);
router.post("/:id([0-9]+)/repair", authorize(), repairRequestAssociation);
router.post("/deduplicate", authorize(Role.Admin), deduplicateRequests);
router.delete("/all", authorize(Role.Admin), deleteAllRequests);

async function create(req, res, next) {
  try {
    // First check if we have a direct employeeId provided
    let employeeId = req.body.EmployeeId || req.body.employeeId;

    // If not, find the employee by userId
    if (!employeeId && req.body.userId) {
      const employee = await db.Employee.findOne({
        where: { userId: req.body.userId },
      });
      if (!employee) {
        throw new Error("Employee not found for the selected user");
      }
      employeeId = employee.id;
    }

    if (!employeeId) {
      throw new Error("Employee ID is required");
    }

    // Check for potential duplicate requests (same type and employee in last 5 seconds)
    const requestKey = `${req.body.type}_${employeeId}`;
    if (recentRequests.has(requestKey)) {
      const timeSince = Date.now() - recentRequests.get(requestKey);

      // If a similar request was created in the last 5 seconds, consider it a duplicate
      if (timeSince < 5000) {
        console.warn(
          `Potential duplicate request detected: ${requestKey}, age: ${timeSince}ms`
        );
        return res.status(409).json({
          message:
            "A similar request was just created. Please wait a moment before submitting again.",
          duplicateDetected: true,
        });
      }
    }

    console.log(`Creating request with employeeId: ${employeeId}`);

    // Get the full employee data to ensure it's valid
    const employee = await db.Employee.findByPk(employeeId, {
      include: [
        {
          model: db.User,
          attributes: ["id", "email", "firstName", "lastName", "role"],
        },
      ],
    });

    if (!employee) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }

    console.log(
      `Found employee: ${employee.employeeId} with User: ${
        employee.User ? employee.User.email : "unknown"
      }`
    );

    // Prepare the request data with proper structure for nested creation
    const requestData = {
      type: req.body.type,
      employeeId: employeeId, // Store the employeeId
      EmployeeId: employeeId, // Also store capitalized version to ensure it works
      status: req.body.status || "Pending",
      RequestItems: req.body.requestItems || [],
    };

    // Create the request with its items
    const request = await db.Request.create(requestData, {
      include: [{ model: db.RequestItem }],
    });

    // Force the request to have the correct employeeId (in case it wasn't set properly)
    await request.update({ employeeId: employeeId });

    // Fetch the complete request with employee data
    const completeRequest = await db.Request.findByPk(request.id, {
      include: [
        { model: db.RequestItem },
        {
          model: db.Employee,
          include: [
            {
              model: db.User,
              attributes: ["id", "email", "firstName", "lastName", "role"],
            },
          ],
        },
      ],
    });

    // Store this request in the recent requests map to prevent duplicates
    recentRequests.set(requestKey, Date.now());

    // Clean up old entries from the recentRequests map periodically
    if (recentRequests.size > 100) {
      const now = Date.now();
      for (const [key, timestamp] of recentRequests.entries()) {
        if (now - timestamp > 60000) {
          // Remove entries older than 1 minute
          recentRequests.delete(key);
        }
      }
    }

    // Verify the employee association was successful
    if (!completeRequest.Employee || !completeRequest.Employee.User) {
      console.error(
        "Warning: Employee association failed for request",
        request.id
      );

      // Add employee data manually if necessary
      const plainRequest = completeRequest.get({ plain: true });
      plainRequest.Employee = employee.get({ plain: true });

      res.status(201).json(plainRequest);
    } else {
      res.status(201).json(completeRequest);
    }
  } catch (err) {
    console.error("Error creating request:", err);
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const requests = await db.Request.findAll({
      include: [
        { model: db.RequestItem },
        {
          model: db.Employee,
          include: [
            {
              model: db.User,
              attributes: ["id", "email", "firstName", "lastName", "role"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Enhance the response with additional employee information to ensure it's always available
    const enhancedRequests = await Promise.all(
      requests.map(async (request) => {
        const plainRequest = request.get({ plain: true });

        // If the request doesn't have an associated employee, try to find it
        if (!plainRequest.Employee || !plainRequest.Employee.User) {
          if (plainRequest.employeeId || plainRequest.EmployeeId) {
            const employeeId =
              plainRequest.employeeId || plainRequest.EmployeeId;
            console.log(
              `Finding missing employee for request ${plainRequest.id}, employeeId: ${employeeId}`
            );

            const employee = await db.Employee.findByPk(employeeId, {
              include: [
                {
                  model: db.User,
                  attributes: ["id", "email", "firstName", "lastName", "role"],
                },
              ],
            });

            if (employee) {
              plainRequest.Employee = employee.get({ plain: true });
              console.log(
                `Enhanced request ${plainRequest.id} with employee data: ${
                  employee.User?.email || "unknown"
                }`
              );

              // Also update the database to fix the association for future requests
              try {
                const dbRequest = await db.Request.findByPk(plainRequest.id);
                if (dbRequest) {
                  await dbRequest.setEmployee(employee);
                  console.log(
                    `Fixed association in database for request ${plainRequest.id}`
                  );
                }
              } catch (associationErr) {
                console.error(
                  `Failed to update association in DB: ${associationErr.message}`
                );
              }
            }
          }
        }

        return plainRequest;
      })
    );

    // Log the results to help with debugging
    console.log(`Found ${enhancedRequests.length} requests with employee data`);

    // Count requests with valid employee data
    const validEmployeeCount = enhancedRequests.filter(
      (r) => r.Employee && r.Employee.User
    ).length;
    console.log(
      `${validEmployeeCount} out of ${enhancedRequests.length} requests have valid employee data`
    );

    res.json(enhancedRequests);
  } catch (err) {
    console.error("Error in getAll requests:", err);
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const request = await db.Request.findByPk(req.params.id, {
      include: [
        { model: db.RequestItem },
        {
          model: db.Employee,
          include: [
            {
              model: db.User,
              attributes: ["id", "email", "firstName", "lastName", "role"],
            },
          ],
        },
      ],
    });

    if (!request) throw new Error("Request not found");

    // Authorization check
    if (
      req.user.role !== Role.Admin &&
      request.employeeId !== req.user.employeeId
    ) {
      throw new Error("Unauthorized");
    }

    // Convert to plain object for potential enhancement
    const plainRequest = request.get({ plain: true });

    // If employee data is missing, try to find it
    if (!plainRequest.Employee || !plainRequest.Employee.User) {
      const employeeId = plainRequest.employeeId || plainRequest.EmployeeId;
      if (employeeId) {
        console.log(
          `Finding missing employee for request ${plainRequest.id}, employeeId: ${employeeId}`
        );

        const employee = await db.Employee.findByPk(employeeId, {
          include: [
            {
              model: db.User,
              attributes: ["id", "email", "firstName", "lastName", "role"],
            },
          ],
        });

        if (employee) {
          plainRequest.Employee = employee.get({ plain: true });
          console.log(
            `Enhanced request ${plainRequest.id} with employee data: ${
              employee.User?.email || "unknown"
            }`
          );

          // Also update the database to fix the association for future requests
          try {
            const dbRequest = await db.Request.findByPk(plainRequest.id);
            if (dbRequest) {
              await dbRequest.setEmployee(employee);
              console.log(
                `Fixed association in database for request ${plainRequest.id}`
              );
            }
          } catch (associationErr) {
            console.error(
              `Failed to update association in DB: ${associationErr.message}`
            );
          }
        } else {
          console.error(
            `Could not find employee with ID ${employeeId} for request ${plainRequest.id}`
          );
        }
      } else {
        console.error(`Request ${plainRequest.id} has no employeeId`);
      }
    }

    res.json(plainRequest);
  } catch (err) {
    next(err);
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
              attributes: ["id", "email", "firstName", "lastName", "role"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Get information about the employee once for all requests
    const employee = await db.Employee.findByPk(req.params.employeeId, {
      include: [
        {
          model: db.User,
          attributes: ["id", "email", "firstName", "lastName", "role"],
        },
      ],
    });

    // Convert to plain objects and ensure employee data is attached
    const enhancedRequests = requests.map((request) => {
      const plainRequest = request.get({ plain: true });

      // If employee data is missing, add it from our separate query
      if ((!plainRequest.Employee || !plainRequest.Employee.User) && employee) {
        plainRequest.Employee = employee.get({ plain: true });
      }

      return plainRequest;
    });

    res.json(enhancedRequests);
  } catch (err) {
    console.error("Error in getByEmployeeId:", err);
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const request = await db.Request.findByPk(req.params.id);
    if (!request) throw new Error("Request not found");

    // Handle employee relationship properly
    const updateData = { ...req.body };

    // If employeeId is provided in any format, ensure it's set correctly
    if (updateData.EmployeeId || updateData.employeeId) {
      const employeeId = updateData.EmployeeId || updateData.employeeId;
      updateData.employeeId = employeeId;
      updateData.EmployeeId = employeeId;
      console.log(`Updating request with employeeId: ${employeeId}`);

      // Get the actual employee to ensure it exists and set the association
      const employee = await db.Employee.findByPk(employeeId, {
        include: [
          {
            model: db.User,
            attributes: ["id", "email", "firstName", "lastName", "role"],
          },
        ],
      });

      if (employee) {
        // Update the association directly
        await request.setEmployee(employee);
        console.log(
          `Updated employee association for request ${request.id} to employee ${employeeId}`
        );
      } else {
        console.error(
          `Employee with ID ${employeeId} not found for request update`
        );
      }
    }

    await request.update(updateData);

    // Handle request items if provided
    if (req.body.requestItems || req.body.RequestItems) {
      console.log("Request items provided for update, processing...");
      const items = req.body.requestItems || req.body.RequestItems;

      if (Array.isArray(items) && items.length > 0) {
        console.log(`Found ${items.length} items to update`);

        try {
          // IMPROVED APPROACH: Only remove items that are no longer in the updated list
          // First, get all existing items
          const existingItems = await db.RequestItem.findAll({
            where: { requestId: request.id },
            raw: true,
          });

          console.log(
            `Found ${existingItems.length} existing items for request ${request.id}`
          );

          // Prepare new items with proper request ID
          const itemsToCreate = items.map((item) => ({
            name: item.name,
            quantity: parseInt(item.quantity) || 1,
            requestId: request.id,
            // Preserve existing ID if it exists
            ...(item.id && !isNaN(parseInt(item.id))
              ? { id: parseInt(item.id) }
              : {}),
          }));

          // Items that need to be created (don't have an ID or have a temp ID)
          const newItems = itemsToCreate.filter(
            (item) => !item.id || item.id.toString().startsWith("temp-")
          );
          console.log(`Creating ${newItems.length} new items`);

          // Create all new items
          if (newItems.length > 0) {
            const createdItems = await db.RequestItem.bulkCreate(
              newItems.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                requestId: request.id,
              }))
            );
            console.log(
              `Successfully created ${createdItems.length} new items`
            );
          }

          // Update existing items that were modified
          const itemsToUpdate = itemsToCreate.filter(
            (item) =>
              item.id &&
              !item.id.toString().startsWith("temp-") &&
              existingItems.some((existingItem) => existingItem.id === item.id)
          );

          for (const item of itemsToUpdate) {
            await db.RequestItem.update(
              { name: item.name, quantity: item.quantity },
              { where: { id: item.id, requestId: request.id } }
            );
          }

          console.log(`Updated ${itemsToUpdate.length} existing items`);

          // Delete items that were removed (exist in DB but not in the updated list)
          const existingIds = existingItems.map((item) => item.id);
          const updatedIds = itemsToCreate
            .filter(
              (item) => item.id && !item.id.toString().startsWith("temp-")
            )
            .map((item) => item.id);

          const idsToDelete = existingIds.filter(
            (id) => !updatedIds.includes(id)
          );

          if (idsToDelete.length > 0) {
            const deleteResult = await db.RequestItem.destroy({
              where: {
                id: idsToDelete,
                requestId: request.id,
              },
            });
            console.log(
              `Deleted ${deleteResult} items that were removed from the request`
            );
          } else {
            console.log("No items needed to be deleted");
          }
        } catch (itemError) {
          console.error("Error updating request items:", itemError);
          // Continue processing request - don't fail the whole update if items have issues
        }
      } else {
        console.log(
          `No valid items found in the request body for request ${request.id}`
        );
      }
    } else {
      console.log(`No items provided in update for request ${request.id}`);
    }

    // Return the complete updated request with employee data
    const updatedRequest = await db.Request.findByPk(req.params.id, {
      include: [
        { model: db.RequestItem },
        {
          model: db.Employee,
          include: [{ model: db.User }],
        },
      ],
    });

    // If employee data is still missing, try to find it explicitly
    const plainRequest = updatedRequest.get({ plain: true });
    if (!plainRequest.Employee || !plainRequest.Employee.User) {
      if (updateData.employeeId || updateData.EmployeeId) {
        const employeeId = updateData.employeeId || updateData.EmployeeId;
        const employee = await db.Employee.findByPk(employeeId, {
          include: [{ model: db.User }],
        });

        if (employee) {
          plainRequest.Employee = employee.get({ plain: true });
          console.log(
            `Added missing employee data to response for request ${request.id}`
          );
        }
      }
      res.json(plainRequest);
    } else {
      res.json(updatedRequest);
    }
  } catch (err) {
    next(err);
  }
}

async function _delete(req, res, next) {
  try {
    const request = await db.Request.findByPk(req.params.id);
    if (!request) throw new Error("Request not found");
    await request.destroy();
    res.json({ message: "Request deleted" });
  } catch (err) {
    next(err);
  }
}

async function repairRequestAssociation(req, res, next) {
  try {
    const requestId = req.params.id;
    const request = await db.Request.findByPk(requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    // Get the employeeId from various sources
    let employeeId =
      req.body.employeeId ||
      req.body.EmployeeId ||
      request.employeeId ||
      request.EmployeeId;

    // If no employeeId is provided or found, try to find by userId
    if (!employeeId && req.body.userId) {
      const employee = await db.Employee.findOne({
        where: { userId: req.body.userId },
      });

      if (employee) {
        employeeId = employee.id;
      }
    }

    if (!employeeId) {
      throw new Error("Cannot repair request: No employee ID found");
    }

    // Find the employee
    const employee = await db.Employee.findByPk(employeeId, {
      include: [
        {
          model: db.User,
          attributes: ["id", "email", "firstName", "lastName", "role"],
        },
      ],
    });

    if (!employee) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }

    // Update the request with the correct employeeId and association
    await request.update({
      employeeId: employee.id,
      EmployeeId: employee.id,
    });

    // Set the association directly
    await request.setEmployee(employee);

    console.log(
      `Manually repaired request ${requestId} with employee ${employee.id}`
    );

    // Return the fully repaired request
    const repairedRequest = await db.Request.findByPk(requestId, {
      include: [
        { model: db.RequestItem },
        {
          model: db.Employee,
          include: [
            {
              model: db.User,
              attributes: ["id", "email", "firstName", "lastName", "role"],
            },
          ],
        },
      ],
    });

    res.json(repairedRequest);
  } catch (err) {
    console.error("Error repairing request:", err);
    next(err);
  }
}

// Function to deduplicate requests
async function deduplicateRequests(req, res, next) {
  try {
    console.log("Starting manual deduplication of requests");

    // Get all requests
    const requests = await db.Request.findAll({
      attributes: ["id", "type", "status", "employeeId", "createdAt"],
      raw: true,
    });

    console.log(`Total requests before deduplication: ${requests.length}`);

    // Group by type+employeeId+status (likely duplicates)
    const grouped = {};
    requests.forEach((req) => {
      const key = `${req.type}_${req.employeeId}_${req.status}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(req);
    });

    // Find groups with more than one request (duplicates)
    let removedCount = 0;
    const removedIds = [];

    for (const [key, group] of Object.entries(grouped)) {
      if (group.length > 1) {
        console.log(`Found ${group.length} duplicate requests for key: ${key}`);

        // Sort by creation date, keep the newest one
        group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Keep the first one (newest), delete the rest
        for (let i = 1; i < group.length; i++) {
          console.log(`Removing duplicate request ID: ${group[i].id}`);
          await db.Request.destroy({ where: { id: group[i].id } });
          removedIds.push(group[i].id);
          removedCount++;
        }
      }
    }

    if (removedCount > 0) {
      console.log(
        `Removed ${removedCount} duplicate requests from the database`
      );
      res.json({
        success: true,
        message: `Removed ${removedCount} duplicate requests`,
        removedIds,
        totalAfter: requests.length - removedCount,
      });
    } else {
      console.log("No duplicate requests found");
      res.json({ success: true, message: "No duplicate requests found" });
    }
  } catch (err) {
    console.error("Error deduplicating requests:", err);
    next(err);
  }
}

// Function to delete ALL requests in the database
async function deleteAllRequests(req, res, next) {
  try {
    console.log("Deleting ALL requests from the database");

    // First delete all request items (to handle foreign key constraints)
    await db.RequestItem.destroy({ where: {} });

    // Then delete all requests
    const count = await db.Request.destroy({ where: {} });

    console.log(`Successfully deleted ${count} requests and their items`);

    res.json({
      success: true,
      message: `Successfully deleted ${count} requests from the database`,
      deletedCount: count,
    });
  } catch (err) {
    console.error("Error deleting all requests:", err);
    next(err);
  }
}

module.exports = router;
