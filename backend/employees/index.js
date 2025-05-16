const express = require("express")
const router = express.Router()

const db = require("../_helpers/db")
const authorize = require("../_middleware/authorize")
const Role = require("../_helpers/role")
const { createSchema, updateSchema } = require("../models/employee.model")

router.post("/", authorize(Role.Admin), create)
router.get("/", authorize(), getAll)
router.get("/:id", authorize(), getById)
router.put("/:id", authorize(Role.Admin), update)
router.delete("/:id", authorize(Role.Admin), _delete)
router.post("/:id/transfer", authorize(Role.Admin), transfer)

async function create(req, res, next) {
    try {
        console.log(
            "Creating employee with data:",
            JSON.stringify(req.body, null, 2)
        )

        // Validate required fields
        if (!req.body.employeeId) {
            return res.status(400).json({
                message: "Validation error",
                errors: [
                    { field: "employeeId", message: "Employee ID is required" },
                ],
            })
        }

        if (!req.body.userId) {
            return res.status(400).json({
                message: "Validation error",
                errors: [{ field: "userId", message: "User ID is required" }],
            })
        }

        if (!req.body.position) {
            return res.status(400).json({
                message: "Validation error",
                errors: [
                    { field: "position", message: "Position is required" },
                ],
            })
        }

        // Verify that the user actually exists
        const userExists = await db.User.findByPk(req.body.userId)
        if (!userExists) {
            return res.status(400).json({
                message: "Validation error",
                errors: [
                    {
                        field: "userId",
                        message: "The specified user account does not exist",
                        value: req.body.userId,
                    },
                ],
            })
        }

        // Check if employee with this employeeId already exists
        const existingEmployeeId = await db.Employee.findOne({
            where: { employeeId: req.body.employeeId },
        })

        if (existingEmployeeId) {
            return res.status(400).json({
                message: "Validation error",
                errors: [
                    {
                        field: "employeeId",
                        message: "This Employee ID is already in use",
                        value: req.body.employeeId,
                    },
                ],
            })
        }

        // Format the data to match model requirements
        const employeeData = {
            ...req.body,
            DepartmentId: req.body.DepartmentId ? req.body.DepartmentId : null,
        }

        console.log(
            "Final employee data to create:",
            JSON.stringify(employeeData, null, 2)
        )
        const employee = await db.Employee.create(employeeData)
        res.status(201).json(employee)
    } catch (err) {
        console.error("Employee creation error:", err)
        console.error("Error details:", err.message)
        if (
            err.name === "SequelizeValidationError" ||
            err.name === "SequelizeUniqueConstraintError"
        ) {
            const validationErrors = err.errors.map(e => ({
                field: e.path,
                message: e.message,
                value: e.value,
            }))
            console.error(
                "Validation errors:",
                JSON.stringify(validationErrors, null, 2)
            )
            res.status(400).json({
                message: "Validation error",
                errors: validationErrors,
            })
        } else {
            next(err)
        }
    }
}

async function getAll(req, res, next) {
    try {
        const employees = await db.Employee.findAll({
            include: [{ model: db.User }, { model: db.Department }],
        })
        res.json(employees)
    } catch (err) {
        next(err)
    }
}

async function getById(req, res, next) {
    try {
        const employee = await db.Employee.findByPk(req.params.id, {
            include: [{ model: db.User }, { model: db.Department }],
        })
        if (!employee) throw new Error("Employee not found")
        res.json(employee)
    } catch (err) {
        next(err)
    }
}

async function update(req, res, next) {
    try {
        const employee = await db.Employee.findByPk(req.params.id)
        if (!employee) throw new Error("Employee not found")
        await employee.update(req.body)
        res.json(employee)
    } catch (err) {
        next(err)
    }
}

async function _delete(req, res, next) {
    try {
        const employee = await db.Employee.findByPk(req.params.id)
        if (!employee) throw new Error("Employee not found")
        await employee.destroy()
        res.json({ message: "Employee deleted" })
    } catch (err) {
        next(err)
    }
}

async function transfer(req, res, next) {
    try {
        const employee = await db.Employee.findByPk(req.params.id)
        if (!employee) throw new Error("Employee not found")
        const oldDepartment = await db.Department.findByPk(
            employee.DepartmentId
        )
        await employee.update({ DepartmentId: req.body.departmentId })
        const newDepartment = await db.Department.findByPk(
            req.body.departmentId
        )
        await db.Workflow.create({
            EmployeeId: employee.id,
            type: "Department Transfer",
            details: {
                task: `Employee transferred from ${
                    oldDepartment ? oldDepartment.name : "Unknown"
                } to ${newDepartment ? newDepartment.name : "Unknown"}.`,
            },
            status: "Pending",
        })
        res.json({ message: "Employee transferred" })
    } catch (err) {
        next(err)
    }
}

module.exports = router
