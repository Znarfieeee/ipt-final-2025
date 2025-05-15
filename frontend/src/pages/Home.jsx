import React, { useState, useEffect } from "react"
import { useFakeBackend } from "../api/fakeBackend"
import { Link } from "react-router-dom"
import { IoMdPeople } from "react-icons/io"
import { IoBusinessSharp } from "react-icons/io5"
import { MdAssignment } from "react-icons/md"

function Home() {
    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Dashboard</h1>
                <p className="text-gray-600 text-lg">Select a category from the navbar to get started</p>
            </div>
        </>
    )
}

export default Home
