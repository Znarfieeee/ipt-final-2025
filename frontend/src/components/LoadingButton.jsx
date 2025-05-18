import React from "react"

const LoadingButton = ({
    isLoading,
    onClick,
    loadingText = "Processing...",
    children,
    type = "button",
    className = "",
    disabled = false,
}) => {
    const baseClassName = "px-4 py-2 rounded-md transition-colors flex items-center justify-center"

    // Combine the base class with any additional classes
    const buttonClassName = `${baseClassName} ${className} ${
        disabled || isLoading ? "opacity-70 cursor-not-allowed" : ""
    }`

    return (
        <button type={type} onClick={onClick} disabled={disabled || isLoading} className={buttonClassName}>
            {isLoading ? (
                <span className="flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    {loadingText}
                </span>
            ) : (
                children
            )}
        </button>
    )
}

export default LoadingButton
