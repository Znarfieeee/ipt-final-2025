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

// Routes
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

async function create(req, res, next) {
    try {
        // Find the employee by userId from the request body
        const employee = await db.Employee.findOne({
            where: { userId: req.body.userId },
        })
        if (!employee)
            throw new Error("Employee not found for the selected user")

        // Prepare the request data with proper structure for nested creation
        const requestData = {
            type: req.body.type,
            employeeId: employee.id,
            status: req.body.status || "Pending",
            RequestItems: req.body.requestItems || [],
        }

        const request = await db.Request.create(requestData, {
            include: [{ model: db.RequestItem }],
        })

        res.status(201).json(request)
    } catch (err) {
        next(err)
    }
}

async function getAll(req, res, next) {
    try {
        const requests = await db.Request.findAll({
            include: [
                { model: db.RequestItem },
                {
                    model: db.Employee,
                    include: [{ model: db.User }],
                },
            ],
        })
        res.json(requests)
    } catch (err) {
        next(err)
    }
}

async function getById(req, res, next) {
    try {
        const request = await db.Request.findByPk(req.params.id, {
            include: [{ model: db.RequestItem }, { model: db.Employee }],
        })
        if (!request) throw new Error("Request not found")
        if (
            req.user.role !== Role.Admin &&
            request.employeeId !== req.user.employeeId
        ) {
            throw new Error("Unauthorized")
        }
        res.json(request)
    } catch (err) {
        next(err)
    }
}

async function getByEmployeeId(req, res, next) {
    try {
        const requests = await db.Request.findAll({
            where: { employeeId: req.params.employeeId },
            include: [{ model: db.RequestItem }],
        })
        res.json(requests)
    } catch (err) {
        next(err)
    }
}

async function update(req, res, next) {
    try {
        const request = await db.Request.findByPk(req.params.id)
        if (!request) throw new Error("Request not found")
        await request.update(req.body)
        if (req.body.items) {
            await db.RequestItem.destroy({ where: { requestId: request.id } })
            await db.RequestItem.bulkCreate(
                req.body.items.map(item => ({
                    ...item,
                    requestId: request.id,
                }))
            )
        }
        res.json(request)
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

module.exports = router
