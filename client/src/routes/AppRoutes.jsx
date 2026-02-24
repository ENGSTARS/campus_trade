import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'

const HomePage = lazy(() => import('@/pages/HomePage'))
const ListingDetailsPage = lazy(() => import('@/pages/ListingDetailsPage'))
const MessagingPage = lazy(() => import('@/pages/MessagingPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const SavedListingsPage = lazy(() => import('@/pages/SavedListingsPage'))
const CreateListingPage = lazy(() => import('@/pages/CreateListingPage'))
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const VerifyEmailSuccessPage = lazy(() => import('@/pages/VerifyEmailSuccessPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-success" element={<VerifyEmailSuccessPage />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/listings/:listingId" element={<ListingDetailsPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/messages" element={<MessagingPage />} />
          <Route path="/saved" element={<SavedListingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sell" element={<CreateListingPage />} />
          <Route path="/listings/:listingId/edit" element={<CreateListingPage />} />
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}
