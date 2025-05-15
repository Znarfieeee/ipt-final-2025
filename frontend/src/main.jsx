import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import { AuthProvider } from "./context/AuthContext"
// import { Provider } from "@/components/ui/provider"

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        {/* <Provider> */}
        <AuthProvider>
            <App />
        </AuthProvider>
        {/* </Provider> */}
    </React.StrictMode>
)
