import Swal from "sweetalert2"

export const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: toast => {
        toast.addEventListener("mouseenter", Swal.stopTimer)
        toast.addEventListener("mouseleave", Swal.resumeTimer)
    },
})

export const showToast = (icon, title) => {
    Toast.fire({
        icon,
        title,
    })
}

// Success toast - green checkmark
export const successToast = (message) => {
    showToast('success', message)
}

// Error toast - red X
export const errorToast = (message) => {
    showToast('error', message)
}

// Warning toast - yellow exclamation
export const warningToast = (message) => {
    showToast('warning', message)
}

// Info toast - blue i
export const infoToast = (message) => {
    showToast('info', message)
}

// Confirmation dialog with Yes/No options
export const confirmAlert = async (title, text, confirmButtonText = 'Yes') => {
    const result = await Swal.fire({
        title,
        text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText,
        cancelButtonText: 'No'
    })
    
    return result.isConfirmed
}

// Error alert (modal)
export const errorAlert = (title, text = '') => {
    return Swal.fire({
        icon: 'error',
        title,
        text
    })
}

// Success alert (modal)
export const successAlert = (title, text = '') => {
    return Swal.fire({
        icon: 'success',
        title,
        text
    })
}

// Custom alert with custom options
export const customAlert = (options) => {
    return Swal.fire(options)
}