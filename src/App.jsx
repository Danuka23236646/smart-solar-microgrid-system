import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Guards
import ApplicationLayout from './components/layout/ApplicationLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleProtectedRoute from './components/common/RoleProtectedRoute';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import UnauthorizedPage from './pages/public/UnauthorizedPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Shared Pages
import ProfilePage from './pages/shared/ProfilePage';

// Backoffice Pages
import BackofficeDashboardPage from './pages/backoffice/BackofficeDashboardPage';
import WebUsersPage from './pages/backoffice/WebUsersPage';
import ProsumersPage from './pages/backoffice/ProsumersPage';
import PendingActivationsPage from './pages/backoffice/PendingActivationsPage';
import MicrogridNodesPage from './pages/backoffice/MicrogridNodesPage';
import NodeFormPage from './pages/backoffice/NodeFormPage';
import NodeDetailsPage from './pages/backoffice/NodeDetailsPage';
import NodeSchedulePage from './pages/backoffice/NodeSchedulePage';
import BatterySlotsPage from './pages/backoffice/BatterySlotsPage';
import ReservationsPage from './pages/backoffice/ReservationsPage';
import ReservationDetailsPage from './pages/backoffice/ReservationDetailsPage';

// Grid Operator Pages
import OperatorDashboardPage from './pages/operator/OperatorDashboardPage';
import OperatorNodesPage from './pages/operator/OperatorNodesPage';
import OperatorBatteryPage from './pages/operator/OperatorBatteryPage';
import OperatorPendingReservationsPage from './pages/operator/OperatorPendingReservationsPage';
import OperatorAllReservationsPage from './pages/operator/OperatorAllReservationsPage';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Authenticated Layout Routes */}
      <Route
        element={
          <ProtectedRoute>
            <ApplicationLayout />
          </ProtectedRoute>
        }
      >
        {/* Shared Protected */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Backoffice Officer Routes */}
        <Route
          path="/backoffice"
          element={<Navigate to="/backoffice/dashboard" replace />}
        />
        <Route
          path="/backoffice/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['BackofficeOfficer']}>
              <BackofficeDashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/backoffice/users"
          element={
            <RoleProtectedRoute allowedRoles={['BackofficeOfficer']}>
              <WebUsersPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/backoffice/prosumers"
          element={
            <RoleProtectedRoute allowedRoles={['BackofficeOfficer']}>
              <ProsumersPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/backoffice/prosumers/pending"
          element={
            <RoleProtectedRoute allowedRoles={['BackofficeOfficer']}>
              <PendingActivationsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/backoffice/nodes"
          element={
            <RoleProtectedRoute allowedRoles={['BackofficeOfficer']}>
              <MicrogridNodesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/backoffice/nodes/new"
          element={
            <RoleProtectedRoute allowedRoles={['BackofficeOfficer']}>
              <NodeFormPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/backoffice/nodes/:id"
          element={
            <RoleProtectedRoute allowedRoles={['BackofficeOfficer']}>
              <NodeDetailsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/backoffice/nodes/:id/edit"
          element={
            <RoleProtectedRoute allowedRoles={['BackofficeOfficer']}>
              <NodeFormPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/backoffice/nodes/:id/schedule"
          element={
            <RoleProtectedRoute allowedRoles={['BackofficeOfficer']}>
              <NodeSchedulePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/backoffice/nodes/:id/battery-slots"
          element={
            <RoleProtectedRoute allowedRoles={['BackofficeOfficer']}>
              <BatterySlotsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/backoffice/reservations"
          element={
            <RoleProtectedRoute allowedRoles={['BackofficeOfficer']}>
              <ReservationsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/backoffice/reservations/:id"
          element={
            <RoleProtectedRoute allowedRoles={['BackofficeOfficer']}>
              <ReservationDetailsPage />
            </RoleProtectedRoute>
          }
        />

        {/* Grid Operator Routes */}
        <Route
          path="/operator"
          element={<Navigate to="/operator/dashboard" replace />}
        />
        <Route
          path="/operator/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['GridOperator']}>
              <OperatorDashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/operator/nodes"
          element={
            <RoleProtectedRoute allowedRoles={['GridOperator']}>
              <OperatorNodesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/operator/battery-availability"
          element={
            <RoleProtectedRoute allowedRoles={['GridOperator']}>
              <OperatorBatteryPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/operator/reservations/pending"
          element={
            <RoleProtectedRoute allowedRoles={['GridOperator']}>
              <OperatorPendingReservationsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/operator/reservations"
          element={
            <RoleProtectedRoute allowedRoles={['GridOperator']}>
              <OperatorAllReservationsPage />
            </RoleProtectedRoute>
          }
        />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
