# 🚀 CRM UI Refactor Testing Guide

Follow these steps to verify all the recent UI and navigation changes.

## 1️⃣ Dashboard Verification
- **Location**: Left Sidebar & Top Bar.
- **Check**: Ensure the menu item is labeled **"Dashboard"** (not "Armaturenbrett").
- **Language**: Switch to **German (DE)** using the language selector in the Top Bar. Verify it still says "Dashboard".

## 2️⃣ CRM Top Horizontal Navigation
- **Location**: Left Sidebar -> Click on **"CRM"**.
- **Action**: Verify that when you click "CRM", the left sidebar **no longer** shows nested items (Leads, Deals, etc.).
- **Action**: Look at the top of the content area. You should see a **Horizontal Tab Bar** with:
  - `Leads`
  - `Deals`
  - `Contacts`
  - `Companies`
  - `Revenue` (Links to Invoices)
- **Test**: Click each tab and ensure the correct page loads.

## 3️⃣ Leads Module (List / Kanban / Overview)
- **Location**: Top Navigation -> Click **"Leads"**.
- **Check - Title**: Ensure the word "Leads" is **NOT** displayed as a page title.
- **Check - Tabs**: Observe three toggle buttons: **"List"**, **"Kanban"**, and **"Overview"**.
- **Action**: Switch between them:
  - **List**: Shows the standard lead table.
  - **Kanban**: Shows the board view (Stages).
  - **Overview**: Shows the charts/stats summary.
- **Verification**: Ensure filters and search stay active when switching tabs.

## 4️⃣ Sidebar & Finance Section
- **Location**: Left Sidebar.
- **Check - Section**: Look for a section labeled **"FINANCE"**.
- **Check - Items**: Under "FINANCE", verify you see **"Quotes"** and **"Invoices"**.
- **Check - Revenue**: Click "CRM" -> "Revenue" tab. It should navigate to the same **Invoices** page.

## 5️⃣ Activities & Tasks
- **Location**: Left Sidebar.
- **Check**: The menu previously called "Tasks" should now be labeled **"Activities & Tasks"**.
- **Check - Dashboard**: Go to the Dashboard. The card that said "Upcoming Activities" or "Tasks" should now say **"Activities & Tasks"**.
- **Check - Dashboard Center**: The middle section headers should be **"Global Tasks"** and **"Scheduled Appointments"**.

---
**Note**: If any label shows "notranslate" in the code, it's to prevent Google Translate from breaking the premium naming structure.
