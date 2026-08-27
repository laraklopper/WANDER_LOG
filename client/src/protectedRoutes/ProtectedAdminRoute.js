import React from 'react'
import { Navigate } from 'react-router-dom'
export default function ProtectedAdminRoute(
    {
        currentUser,
        children
    }
) {
 
    if (!currentUser || !currentUser.admin) {
        return <Navigate to='/'/>
    }
    return children
}
