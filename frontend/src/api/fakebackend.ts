import { Injectable } from "@angular/core"
import {
    HttpRequest,
    HttpResponse,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HTTP_INTERCEPTORS,
} from "@angular/common/http"
import { Observable, of, throwError } from "rxjs"
import { delay, materialize, dematerialize } from "rxjs/operators"
import { AnyActionArg, use } from "react"

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
    private users = [
        {
            id: 1,
            email: "admin@example.com",
            password: "admin",
            role: "Admin",
            employeeid: 1,
        },
        {
            id: 2,
            email: "user@example.com",
            password: "user",
            role: "User",
            employeeid: 2,
        },
    ]

    private employees = [
        {
            id: 1,
            employeeId: "EMP001",
            userId: 1,
            position: "Developer",
            departmentId: 1,
            hireDate: "2025-01-01",
            status: "Active",
        },
        {
            id: 2,
            employeeId: "EMP002",
            userId: 2,
            position: "Designer",
            departmentId: 2,
            hireDate: "2025-02-01",
            status: "Active",
        },
    ]

    private departments = [
        {
            id: 1,
            name: "Engineering",
            description: "Software development team",
            employeeCount: 1,
        },
        {
            id: 2,
            name: "Marketing",
            description: "Marketing team",
            employeeCount: 1,
        },
    ]

    private workflows = [
        {
            id: 1,
            employeeId: 1,
            type: "Onboarding",
            details: { tasl: "Setup workstation" },
            status: "Pending",
        },
    ]

    private requests = [
        {
            id: 1,
            employeeId: 2,
            type: "Equipment",
            requestItems: [{ name: "Laptop", quantity: 1 }],
            status: "Pending",
        },
    ]

    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        const { url, method, headers, body } = request

        return of(null)
            .pipe(mergeMap(() => this.handleRoute(url, method, headers, body)))
            .pipe(materialize())
            .pipe(delay(500))
            .pipe(dematerialize())
    }

    private handleRoute(
        url: string,
        method: string,
        headers: any,
        body: any
    ): Observable<HttpEvent<any>> {
        // Accounts Routes
        if (url.endsWith("/accounts/authenticate") && method === "POST") {
            const { email, password } = body

            const user = this.users.find(
                (u) => u.email === email && u.password === password
            )
            if (!user) return throwError(() => new Error("Invalid credentials"))
            return of(
                new HttpResponse({
                    status: 200,
                    body: { ...user, token: "fake-jwt-token" },
                })
            )
        }

        if (url.endsWith("/accounts") && method === "GET") {
            return this.authorize(headers, "Admin", () =>
                of(new HttpResponse({ status: 200, body: this.users }))
            )
        }

        // Employees Routes
        if (url.endsWith("/employees") && method === "GET") {
            return this.authorize(headers, null, () =>
                of(new HttpResponse({ status: 200, body: this.employees }))
            )
        }

        if (url.match(/\/employees\/\d+$/) && method === "GET") {
            const id = parseInt(url.split("/").pop())
            const employee = this.employees.find((e) => e.id === id)
            return this.authorize(headers, null, () =>
                employee
                    ? of(new HttpResponse({ status: 200, body: employee }))
                    : throwError(() => new Error("Employee not found"))
            )
        }

        if (url.match(/\/employees\/\d+$/) && method === "PUT") {
            return this.authorize(headers, "Admin", () => {
                const id = parseInt(url.split("/").pop())
                const employeeIndex = this.employees.findIndex(
                    (e) => e.id === id
                )

                if (employeeIndex === -1)
                    return throwError(() => new Error("Employee not found"))
                this.employees[employeeIndex] = { id, ...body }
                return of(
                    new HttpResponse({
                        status: 200,
                        body: this.employees[employeeIndex],
                    })
                )
            })
        }

        if (url.match(/\/employees\/\d+$/) && method === "DELETE") {
            return this.authorize(headers, "Admin", () => {
                const id = parseInt(url.split("/")[2])
                const employee = this.employees.find((e) => e.id === id)
                if (!employee)
                    return throwError(() => new Error("Employee not found"))
                employee.departmentId = body.departmentId
                this.workflows.push({
                    id: this.workflows.length + 1,
                    employeeId: id,
                    type: "Transfer",
                    details: body,
                    status: "Pending",
                })
                return of(
                    new HttpResponse({
                        status: 200,
                        body: { message: "Employee transferred" },
                    })
                )
            })
        }

        if (url.match(/\/employees\/\d+\/transfer$/) && method === "POST") {
            return this.authorize(headers, "Admin", () => {
                const id = parseInt(url.split("/")[2])
                const employee = this.employees.find((e) => e.id === id)
                if (!employee)
                    return throwError(() => new Error("Employee not found"))
                employee.departmentId = body.departmentId
                this.workflows.push({
                    id: this.workflows.length + 1,
                    employeeId: id,
                    type: "Transfer",
                    details: body,
                    status: "Pending",
                })
                return of(
                    new HttpResponse({
                        status: 200,
                        body: { message: "Employee transferred" },
                    })
                )
            })
        }

        // Department Routes
        if (url.endsWith("/departments") && method === "GET") {
            return this.authorize(headers, null, () =>
                of(new HttpResponse({ status: 200, body: this.departments }))
            )
        }

        if (url.endsWith("/departments") && method === "POST") {
            return this.authorize(headers, "Admin", () => {
                const department = {
                    id: this.departments.length + 1,
                    ...body,
                    employeeCount: 0,
                }
                this.departments.push(department)
                return of(new HttpResponse({ status: 201, body: department }))
            })
        }

        if (url.match(/\/departments\/\d+$/) && method === "PUT") {
            return this.authorize(headers, "Admin", () => {
                const id = parseInt(url.split("/").pop())
                const deptIndex = this.departments.findIndex((d) => d.id === id)

                if (deptIndex === -1)
                    return throwError(() => new Error("Department not found"))
                this.departments[deptIndex] = {
                    id,
                    ...body,
                    employeeCount: this.departments[deptIndex].employeeCount,
                }
                return of(
                    new HttpResponse({
                        status: 200,
                        body: this.departments[deptIndex],
                    })
                )
            })
        }

        if (url.match(/\/departments\/\d+$/) && method === "DELETE") {
            return this.authorize(headers, "Admin", () => {
                const id = parseInt(url.split("/").pop())
                this.departments = this.departments.filter((d) => d.id !== id)
                return of(
                    new HttpResponse({
                        status: 200,
                        body: { message: "Department deleted" },
                    })
                )
            })
        }

        // Workflows Routes
        if (url.match(/\/workflows\/employee\/\d+$/) && method === "GET") {
            return this.authorize(headers, null, () => {
                const employeeId = parseInt(url.split("/").pop()!)
                const workflows = this.workflows.filter(
                    (w) => w.employeeId === employeeId
                )
                return of(new HttpResponse({ status: 200, body: workflows }))
            })
        }

        if (url.endsWith("/workflows") && method === "POST") {
            return this.authorize(headers, "Admin", () => {
                const workflow = { id: this.workflows.length + 1, ...body }
                this.workflows.push(workflow)
                return of(new HttpResponse({ status: 201, body: workflow }))
            })
        }

        // Requests Routes
        if (url.endsWith("/requests") && method === "GET") {
            return this.authorize(headers, "Admin", () =>
                of(new HttpResponse({ status: 200, body: this.requests }))
            )
        }

        if (url.endsWith("/requests") && method === "POST") {
            return this.authorize(headers, null, () => {
                const request = {
                    id: this.requests.length + 1,
                    employeeId: this.getUser(headers).employeeId,
                    ...body,
                }
                this.requests.push(request)
                return of(new HttpResponse({ status: 201, body: request }))
            })
        }

        if (url.match(/\/requests\/\d+$/) && method === "PUT") {
            return this.authorize(headers, "Admin", () => {
                const id = parseInt(url.split("/").pop())
                const reqIndex = this.requests.findIndex((r) => r.id === id)
                if (reqIndex === -1)
                    return throwError(() => new Error("Request not found"))
                this.requests[reqIndex] = { id, ...body }
                return of(
                    new HttpResponse({
                        status: 200,
                        body: this.requests[reqIndex],
                    })
                )
            })
        }

        if (url.match(/\/requests\/?\d+$/) && method === "DELETE") {
            return this.authorize(headers, "Admin", () => {
                const id = parseInt(url.split("/").pop())
                this.requests = this.requests.filter((r) => r.id !== id)
                return of(
                    new HttpResponse({
                        status: 200,
                        body: { message: "Request deleted" },
                    })
                )
            })
        }

        return next.handle(request)
    }

    private authorize(
        headers: any,
        requiredRole: string | null,
        success: () => Observable<HttpEvent<any>>
    ): Observable<HttpEvent<AnyActionArg>> {
        const user = this.getUser(headers)
        if (!user) return throwError(() => new Error("Unauthorized"))
        if (requiredRole && user.role !== requiredRole)
            return throwError(() => new Error("Forbidden"))
        return success()
    }

    private getUser(headers: any) {
        const authHeader = headers.get("Authorization")
        if (!authHeader || authHeader !== "Bearer fake-jwt-token") return null
        return this.users.find((u) => u.token === "fake-jwt-token")
    }
}

export const fakeBackendProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true,
}
