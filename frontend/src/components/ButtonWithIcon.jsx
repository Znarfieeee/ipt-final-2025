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
 * @param {boolean} props.isLoading - Whether the button is in loading state
 * @param {string} props.loadingText - Text to display when loading
 * @param {boolean} props.disabled - Whether the button is disabled
 */
const ButtonWithIcon = ({
    icon: Icon,
    text,
    tooltipContent,
    onClick,
    variant = "primary",
    className = "",
    isLoading = false,
    loadingText = "Processing...",
    disabled = false,
}) => {
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

    // Add disabled styling
    const disabledClasses = isLoading || disabled ? "opacity-70 cursor-not-allowed hover:scale-100" : ""

    const variantClasses = variants[variant] || variants.primary
    const combinedClasses = `${baseClasses} ${variantClasses} ${disabledClasses} ${className}`

    // Use the actual text for the tooltip if tooltipContent is not provided
    const tooltipText = tooltipContent || text

    // If loading, override the tooltip to indicate the operation is in progress
    const finalTooltipText = isLoading ? loadingText : tooltipText

    return (
        <TooltipButton
            content={finalTooltipText}
            onClick={onClick}
            className={combinedClasses}
            isLoading={isLoading}
            disabled={disabled}
        >
            {Icon && !isLoading && <Icon className="size-4" />}
            {isLoading ? loadingText : text}
        </TooltipButton>
    )
}

export default ButtonWithIcon
