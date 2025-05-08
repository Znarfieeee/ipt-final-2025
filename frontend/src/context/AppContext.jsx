import React, { createContext, useContext } from "react"
import { useFakeBackend } from "../api/fakeBackend"
import { USE_FAKE_BACKEND } from "../api/config"

const AppContext = createContext()

export const useApp = () => {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error("useApp must be used within an AppProvider")
    }
    return context
}

export const AppProvider = ({ children }) => {
    const backend = useFakeBackend()

    const value = {
        backend,
        isFakeBackend: USE_FAKE_BACKEND,
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
