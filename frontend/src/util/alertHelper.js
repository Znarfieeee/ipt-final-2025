import { toaster } from "@/components/ui/toaster"

export const showToast = {
    create: ({ title, status }) => {
        toaster({
            title,
            status, // Chakra UI supports "success", "error", "warning", "info"
            position: "upper-right",
            duration: 3000,
            isClosable: true,
        })
    },
}
