import { useFakeBackend } from "./fakeBackend"
import { USE_FAKE_BACKEND } from "./config"
import BASE_URL from "./BackendConnection"

const useBackend = () => {
    // const { fakeFetch } = useFakeBackend()
    // const fetchWithAuth = async (url, options = {}) => {
    //     const token = localStorage.getItem("token")
    //     const headers = {
    //         ...options.headers,
    //         Authorization: token ? `Bearer ${token}` : undefined,
    //     }
    //     try {
    //         const response = USE_FAKE_BACKEND
    //             ? await fakeFetch(url, { ...options, headers })
    //             : await fetch(`${BASE_URL}${url}`, {
    //                   ...options,
    //                   headers,
    //                   body: options.body ? JSON.stringify(options.body) : undefined,
    //               })
    //         if (!response.ok) {
    //             throw new Error("Network response was not ok")
    //         }
    //         return response.json()
    //     } catch (error) {
    //         console.error("Error:", error)
    //         throw error
    //     }
    // }
    // return {
    //     get: url => fetchWithAuth(url, { method: "GET" }),
    //     post: (url, data) =>
    //         fetchWithAuth(url, {
    //             method: "POST",
    //             body: data,
    //         }),
    //     put: (url, data) =>
    //         fetchWithAuth(url, {
    //             method: "PUT",
    //             body: data,
    //         }),
    //     delete: url => fetchWithAuth(url, { method: "DELETE" }),
    // }
}

export default useBackend
