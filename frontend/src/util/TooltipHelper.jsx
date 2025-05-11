import React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * A reusable tooltip component that wraps the shadcn tooltip components
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The trigger element
 * @param {string} props.content - The tooltip content
 * @param {string} props.className - Additional classes for the trigger element
 * @returns {JSX.Element} - The tooltip component
 */
export const TooltipButton = ({ children, content, className }) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button className={className}>{children}</button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default TooltipButton
