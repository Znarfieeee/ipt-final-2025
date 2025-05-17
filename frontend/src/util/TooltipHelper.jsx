import React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * A reusable tooltip component that wraps the shadcn tooltip components
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The trigger element
 * @param {string} props.content - The tooltip content
 * @param {string} props.className - Additional classes for the trigger element
 * @param {Function} props.onClick - Click handler for the button
 * @param {boolean} props.isLoading - Whether the button is in loading state
 * @param {boolean} props.disabled - Whether the button is disabled
 * @returns {JSX.Element} - The tooltip component
 */
export const TooltipButton = ({ children, content, className, onClick, isLoading = false, disabled = false }) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild disabled={isLoading || disabled}>
                    <button className={className} onClick={onClick} disabled={isLoading || disabled}>
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
                                Processing...
                            </span>
                        ) : (
                            children
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default TooltipButton
