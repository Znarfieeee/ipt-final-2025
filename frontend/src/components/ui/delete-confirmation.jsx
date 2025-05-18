import * as React from "react"
import { FaTrash } from "react-icons/fa"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import ButtonWithIcon from "../ButtonWithIcon"

export const DeleteConfirmation = ({
    onConfirm,
    itemName = "this item",
    itemType = "item",
    triggerText = "",
    triggerIcon = FaTrash,
    placement = "bottom",
}) => {
    const [open, setOpen] = React.useState(false)

    const handleConfirm = async () => {
        setOpen(false)
        await onConfirm()
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div>
                    <ButtonWithIcon
                        icon={triggerIcon}
                        text={triggerText}
                        tooltipContent={`Delete ${itemType}`}
                        variant="danger"
                    />
                </div>
            </PopoverTrigger>
            <PopoverContent
                align={placement}
                className="w-80 p-6 rounded-xl shadow-xl border border-red-200 bg-white flex flex-col items-center"
            >
                <div className="flex flex-col items-center space-y-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-2">
                        <FaTrash className="text-red-600 text-2xl" />
                    </div>
                    <div className="font-bold text-lg text-red-700 text-center">Confirm Deletion</div>
                    <p className="text-center text-gray-700 text-sm mb-2">
                        Are you sure you want to delete <span className="font-semibold text-red-700">this item</span>?
                        <br />
                        <span className="text-xs text-gray-500">This action cannot be undone.</span>
                    </p>
                    <div className="flex justify-center gap-3 w-full mt-2">
                        <Button variant="outline" onClick={() => setOpen(false)} size="sm" className="w-1/2">
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirm}
                            size="sm"
                            className="w-1/2 bg-red-600 hover:bg-red-700"
                        >
                            <FaTrash className="inline mr-1" /> Delete
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
