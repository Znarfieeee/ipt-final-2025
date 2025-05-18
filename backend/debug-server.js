// Debug script to run server with full error reporting
process.on("uncaughtException", err => {
    console.error("UNCAUGHT EXCEPTION:")
    console.error(err)
})

process.on("unhandledRejection", (reason, promise) => {
    console.error("UNHANDLED REJECTION:")
    console.error(reason)
})

// Import and run the server
try {
    require("./server")
} catch (err) {
    console.error("ERROR IMPORTING SERVER:")
    console.error(err)
}
