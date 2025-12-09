# Next Reason Service Dash Documentation

## Overview

Next Reason Service Dash is a modern, multi-tenant dashboard application built with Next.js and Node.js.

## Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Authentication**: NextAuth.js with OIDC support
- **State Management**: React hooks and Context API

### Backend
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: OIDC token validation with JWT

## Features

- **Multi-Tenant Architecture**: Users can belong to multiple customers with different roles
- **OIDC Authentication**: Secure authentication via any OIDC-compliant identity provider
- **Role-Based Access Control**: Admin and Member roles per customer
- **Customer Management**: Create customers, invite users, manage permissions
- **Responsive Design**: Mobile-friendly interface

## Getting Started

See [SETUP.md](./SETUP.md) for installation and configuration instructions.

## Project Structure

See [STRUCTURE.md](./STRUCTURE.md) for detailed project structure documentation.

