# OMSWD Pandan Assistance Request and Beneficiary Management System

## Modular Master Prompt (React + Vite + Supabase + Tailwind + shadcn/ui)

This document contains a **step‑by‑step modular master prompt** designed
for AI coding assistants such as:

-   Cursor
-   Claude Code
-   Lovable
-   Bolt
-   Replit AI
-   ChatGPT Code tools

Instead of generating the whole system at once, the prompts guide the AI
**module by module**, producing cleaner architecture and more reliable
code.

------------------------------------------------------------------------

# System Overview

Project: **Web‑Based Assistance Request and Beneficiary Management
System**

Organization: **Office of Municipal Social Welfare and Development
(OMSWD)** Pandan, Antique, Philippines

The system contains three main components:

1.  Public Website
2.  Admin Portal
3.  Resident Portal

Purpose:

-   Residents view services online
-   Residents request assistance
-   Admin verifies residency
-   Approved residents upload requirements
-   Residents track application status
-   Admin manages requests and generates reports

------------------------------------------------------------------------

# Technology Stack

## Frontend

-   React
-   Vite
-   TypeScript
-   TailwindCSS
-   shadcn/ui

## Libraries

-   React Router DOM
-   TanStack Query
-   React Hook Form
-   Zod
-   TanStack Table
-   Framer Motion
-   Lucide React
-   Recharts
-   Sonner Toast
-   React Dropzone
-   clsx
-   class‑variance‑authority
-   tailwind‑merge
-   date‑fns

## Backend

Supabase

Services used:

-   Supabase Auth
-   Supabase PostgreSQL
-   Supabase Storage
-   Supabase Edge Functions
-   Row Level Security

------------------------------------------------------------------------

# PROMPT 1 --- Project Initialization

Create a new **React + Vite + TypeScript project** for a government
service platform called:

**OMSWD Pandan Assistance Request System**

Configure:

Frontend - React - Vite - TypeScript - TailwindCSS - shadcn/ui

Install libraries:

react-router-dom\
@tanstack/react-query\
react-hook-form\
zod\
lucide-react\
framer-motion\
recharts\
sonner\
@tanstack/react-table\
react-dropzone\
clsx\
class-variance-authority\
tailwind-merge\
date-fns

Create the following project structure:

    src

    app

    components
    components/ui
    components/shared
    components/forms
    components/layout

    features
    features/public
    features/auth
    features/resident
    features/admin
    features/applications
    features/requirements
    features/reports
    features/settings

    hooks

    lib

    services

    integrations
    integrations/supabase

    types

    utils

    routes

    pages

Create layout components:

-   MainLayout
-   AdminLayout
-   ResidentLayout
-   PublicLayout

Configure:

-   React Router
-   TanStack Query Provider
-   Supabase client
-   Tailwind config
-   shadcn/ui setup
-   global styles

Create a simple homepage with navigation.

------------------------------------------------------------------------

# PROMPT 2 --- Supabase Integration

Integrate **Supabase**.

Create:

    integrations/supabase/client.ts

Environment variables:

    VITE_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY

Create helpers for:

-   authentication
-   queries
-   mutations
-   file uploads

Create hooks:

-   useAuth
-   useSession
-   useProfile

Integrate with **TanStack Query**.

------------------------------------------------------------------------

# PROMPT 3 --- Authentication System

Implement authentication using **Supabase Auth**.

Pages:

-   Login
-   Register
-   Forgot Password
-   Reset Password

Use:

-   React Hook Form
-   Zod
-   shadcn UI components

Roles:

-   resident
-   admin
-   super_admin
-   social_worker

Create route guards:

-   RequireAuth
-   RequireAdmin
-   RequireResident

Create Auth Context storing:

-   user
-   session
-   profile
-   role

------------------------------------------------------------------------

# PROMPT 4 --- Database Design

Create Supabase PostgreSQL schema.

Tables:

-   profiles
-   roles
-   user_roles
-   residents
-   applications
-   assistance_types
-   assistance_requirements
-   application_requirements
-   uploaded_documents
-   verification_logs
-   status_histories
-   notifications
-   announcements
-   faqs
-   barangays
-   municipalities
-   audit_logs
-   email_logs
-   staff_assignments
-   settings

Include:

-   foreign keys
-   timestamps
-   indexes
-   constraints

Provide SQL migrations.

------------------------------------------------------------------------

# PROMPT 5 --- Supabase Storage

Create file upload system.

Buckets:

-   resident-documents
-   application-documents
-   ids
-   requirements

Use:

-   React Dropzone
-   Supabase Storage API

Allow:

-   PDF
-   JPG
-   PNG

Add file preview UI.

------------------------------------------------------------------------

# PROMPT 6 --- Public Website

Create the OMSWD website.

Pages:

-   Home
-   About OMSWD
-   Services
-   Service Details
-   Requirements
-   Announcements
-   FAQ
-   Contact
-   Privacy Policy
-   Request Assistance

Design using:

-   shadcn UI
-   TailwindCSS

UI elements:

-   hero section
-   service cards
-   FAQ accordion
-   timeline process
-   CTA buttons

------------------------------------------------------------------------

# PROMPT 7 --- Assistance Request Form

Create **multi‑step assistance request form**.

Sections:

-   Personal Information
-   Address Information
-   Identity Information
-   Assistance Request
-   Consent

Use:

-   React Hook Form
-   Zod
-   shadcn UI

Features:

-   stepper progress
-   validation
-   file upload

After submission:

-   create application record
-   generate reference number
-   status = Pending Verification

------------------------------------------------------------------------

# PROMPT 8 --- Admin Portal

Create admin portal.

Pages:

-   Dashboard
-   Applications
-   Application Details
-   Verification Queue
-   Requirements Review
-   Residents
-   Reports
-   Users
-   Settings
-   Audit Logs

Use:

-   AdminLayout
-   sidebar navigation
-   TanStack Table

Dashboard widgets:

-   total applications
-   pending verification
-   approved
-   rejected
-   applications by barangay

Charts using **Recharts**.

------------------------------------------------------------------------

# PROMPT 9 --- Application Review System

Admin actions:

-   verify residency
-   approve application
-   reject application
-   request corrections
-   request additional documents

Application view includes:

-   personal info
-   request details
-   uploaded files
-   status history
-   admin remarks

Add timeline UI.

------------------------------------------------------------------------

# PROMPT 10 --- Resident Portal

Pages:

-   Dashboard
-   My Application
-   Upload Requirements
-   Notifications
-   Profile

Features:

-   view application status
-   upload requirements
-   reupload rejected documents
-   view remarks
-   track application progress

Add progress tracker UI.

------------------------------------------------------------------------

# PROMPT 11 --- Requirements Management

Admin can:

-   create assistance types
-   configure required documents
-   edit requirements

Residents upload documents based on templates.

Admin can approve or reject each document.

------------------------------------------------------------------------

# PROMPT 12 --- Email Automation

Create Supabase Edge Functions.

Send emails for:

-   application submission
-   approval
-   rejection
-   request for documents
-   status updates

Email includes:

-   reference number
-   instructions
-   resident portal link

Use **Resend or SMTP**.

------------------------------------------------------------------------

# PROMPT 13 --- Reporting System

Reports:

-   daily applications
-   monthly assistance
-   applications by barangay
-   service statistics

Features:

-   filters
-   charts
-   export to PDF
-   export to Excel

------------------------------------------------------------------------

# PROMPT 14 --- Security

Implement:

-   Supabase Row Level Security
-   role‑based permissions
-   private storage buckets
-   audit logs
-   secure document access

Rules:

Residents can access **only their own records**.

Admins can access **all applications**.

------------------------------------------------------------------------

# PROMPT 15 --- UI/UX Enhancements

Improve interface:

-   loading skeletons
-   empty states
-   framer motion animations
-   toast notifications
-   drag and drop uploads
-   responsive layouts

Design must look like a **professional government service portal**.

------------------------------------------------------------------------

# FINAL PROMPT --- Deployment

Prepare production deployment.

Tasks:

-   optimize Vite build
-   configure environment variables
-   configure Supabase production project
-   configure storage policies
-   configure RLS policies

Deploy frontend using:

-   Vercel or
-   Netlify

------------------------------------------------------------------------

# Recommended Build Order

For best results when using AI builders:

1.  Project Setup
2.  Supabase Integration
3.  Authentication
4.  Database
5.  Public Website
6.  Assistance Request Form
7.  Admin Portal
8.  Resident Portal
9.  Document Upload System
10. Reporting & Email Automation

This modular approach produces **cleaner architecture and higher quality
code**.
