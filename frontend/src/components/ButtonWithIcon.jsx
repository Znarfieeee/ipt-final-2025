import React from "react"
import { TooltipButton } from "@/util/TooltipHelper"

/**
 * A reusable button component with icon and tooltip
 * @param {Object} props
 * @param {React.ReactNode} props.icon - The icon component to display
 * @param {string} props.text - The text to display next to the icon
 * @param {string} props.tooltipContent - The content to show in the tooltip
 * @param {function} props.onClick - The click handler function
 * @param {string} props.variant - The color variant (primary, secondary, warning, etc.)
 * @param {string} props.className - Additional CSS classes
 */
const ButtonWithIcon = ({ icon: Icon, text, tooltipContent, onClick, variant = "primary", className = "" }) => {
    const variants = {
        primary: "bg-blue-500 hover:bg-blue-700",
        secondary: "bg-gray-500 hover:bg-gray-700",
        warning: "bg-yellow-500 hover:bg-yellow-700",
        danger: "bg-red-500 hover:bg-red-700",
        success: "bg-green-500 hover:bg-green-700",
        orange: "bg-orange-500 hover:bg-orange-700",
        pink: "bg-pink-500 hover:bg-pink-700",
    }

    const baseClasses =
        "flex justify-center items-center gap-x-2 px-3 py-2 rounded-md text-white delay-50 transition-all duration-300 hover:scale-105 cursor-pointer"
    const variantClasses = variants[variant] || variants.primary
    const combinedClasses = `${baseClasses} ${variantClasses} ${className}`

    return (
        <TooltipButton content={tooltipContent || text} onClick={onClick} className={combinedClasses}>
            {Icon && <Icon className="size-4" />}
            {text}
        </TooltipButton>
    )
}

export default ButtonWithIcon
