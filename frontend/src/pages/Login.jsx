import React, { useRef } from "react"
import { Link } from "react-router-dom"

import { showToast } from "../util/alertHelper"

function Login() {
    const emailRef = useRef()
    const passwordRef = useRef()

    // const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()

        showToast("success", "Login clicked")
        // try {
        //     const formData = {
        //         email: emailRef.current.value,
        //         password: passwordRef.current.value,
        //     }
        //     // const result = await login(formData)

        //     if (result.status === "success") {
        //         showToast("success", result.message) // Show success toast with the message
        //         navigate("dashboard")
        //     } else {
        //         showToast("error", result.message) // Show error toast with the message
        //     }
        // } catch (err) {
        //     alert("Api Error", err)
        // }
    }

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className="flex flex-col items-center bg-white p-8 rounded-lg shadow-md w-120 "
            >
                <h1 className="text-center font-semibold text-2xl mb-6">
                    Login
                </h1>
                <hr className="bg-[#5b5b5b] w-full" />
                <div className="flex flex-col gap-2 w-full mt-8">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        ref={emailRef}
                        className="input p-4 h-10 outline-1 outline-[#D9D9D9] rounded-lg"
                    />
                </div>
                <div className="flex flex-col gap-2 w-full mt-4">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        ref={passwordRef}
                        className="input p-4 h-10 outline-1 outline-[#D9D9D9] rounded-lg"
                    />
                </div>
                <button type="submit">Login</button>
            </form>
        </>
    )
}

export default Login
