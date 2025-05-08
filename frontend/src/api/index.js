import { USE_FAKE_BACKEND } from "./config"

const createApi = (backend) => ({
    async login(email, password) {
        try {
            const response = await backend.post("/accounts/authenticate", {
                email,
                password,
            })
            if (response.token) {
                localStorage.setItem("token", response.token)
                return { success: true, data: response }
            }
            return { success: false, error: "Invalid credentials" }
        } catch (error) {
            return { success: false, error: error.message }
        }
    },

    async logout() {
        localStorage.removeItem("token")
        return { success: true }
    },

    isAuthenticated() {
        return !!localStorage.getItem("token")
    },

    getToken() {
        return localStorage.getItem("token")
    },
})

export const useApi = (backend) => createApi(backend)
export default createApi
