# CRM Feature Change and Backend Reference Documentation

## Overview
This document provides a comprehensive guide for implementing a full-featured CRM application. It defines all modules, fields, relationships, and API behaviors required for backend development.

---

## Module Architecture

### Module Relationships Diagram
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   LEADS     │────▶│  CONTACTS   │────▶│  COMPANIES  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   DEALS     │◀────│ ACTIVITIES  │────▶│   TASKS     │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 1. DASHBOARD MODULE

### Purpose
High-level overview of CRM performance and key metrics.

### Widgets (Quick Stats)
| Widget | Description | Data Source |
|--------|-------------|-------------|
| Total Leads | Count of all leads | `leads` table |
| Active Deals | Count of deals not in Closed Won/Lost | `deals` table |
| Revenue Forecast | Sum of deal values in pipeline | `deals` table |
| Upcoming Activities | Activities scheduled for next 7 days | `activities` table |

### Charts
| Chart | Type | Data |
|-------|------|------|
| Sales Pipeline Chart | Bar Chart | Deal values grouped by stage |
| Leads by Source | Donut Chart | Lead count grouped by source |
| Deals Won vs Lost | Progress Bars | Comparison of won/lost deals |
| Recent Activities | List | Last 10 activities |

### API Endpoints
```
GET /api/dashboard/stats
GET /api/dashboard/pipeline-chart
GET /api/dashboard/leads-by-source
GET /api/dashboard/deals-summary
GET /api/dashboard/recent-activities
```

---

## 2. LEADS MODULE

### Purpose
Capture and manage raw leads before conversion to contacts/deals.

### Database Table: `leads`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | INT (PK) | Yes | Auto-increment |
| name | VARCHAR(255) | Yes | Lead name |
| email | VARCHAR(255) | No | Email address |
| phone | VARCHAR(50) | No | Phone number |
| company_name | VARCHAR(255) | No | Company name |
| lead_source | VARCHAR(100) | No | Source (Website, Referral, etc.) |
| stage | ENUM | Yes | Pipeline stage |
| estimated_value | DECIMAL(15,2) | No | Estimated deal value |
| tags | JSON | No | Array of tag strings |
| owner_id | INT (FK) | No | Assigned user ID |
| status | ENUM | Yes | Active, Inactive |
| last_contacted | DATETIME | No | Last contact date |
| notes | TEXT | No | Notes/comments |
| company_id | INT (FK) | Yes | Tenant company ID |
| created_by | INT (FK) | Yes | Creator user ID |
| created_at | DATETIME | Yes | Creation timestamp |
| updated_at | DATETIME | Yes | Last update timestamp |

### Lead Stages (Pipeline)
| Stage | Order | Color |
|-------|-------|-------|
| New Lead | 1 | Blue |
| Contacted | 2 | Teal |
| Follow-up | 3 | Yellow |
| Qualified | 4 | Purple |
| Converted | 5 | Green |
| Lost | 6 | Red |

### Features & Actions
1. **Table View** - Sortable, paginated list
2. **Kanban View** - Drag & drop between stages
3. **Filters** - Stage, Source, Owner, Tags, Date Range
4. **Search** - Name, Email, Phone, Company
5. **Add/Edit/Delete** - CRUD operations
6. **Import CSV** - Bulk import leads
7. **Convert Lead** - Convert to Contact + Deal
8. **Add Notes** - Append notes to lead
9. **Set Reminders** - Create follow-up tasks

### API Endpoints
```
GET    /api/leads                    # List all leads (with filters)
GET    /api/leads/:id                # Get single lead
POST   /api/leads                    # Create lead
PUT    /api/leads/:id                # Update lead
DELETE /api/leads/:id                # Delete lead
PATCH  /api/leads/:id/stage          # Update stage only
POST   /api/leads/:id/convert        # Convert to contact + deal
POST   /api/leads/import             # Import CSV
GET    /api/leads/overview           # Stats for dashboard
POST   /api/leads/bulk-action        # Bulk operations
```

### Lead Conversion Flow
When converting a lead:
1. Create new Contact with lead data
2. Optionally create new Deal
3. Link Contact to Company (create if not exists)
4. Mark lead as "Converted"
5. Transfer all activities/notes to Contact

---

## 3. CONTACTS MODULE

### Purpose
Store individual people data (converted leads or direct contacts).

### Database Table: `contacts`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | INT (PK) | Yes | Auto-increment |
| name | VARCHAR(255) | Yes | Full name |
| email | VARCHAR(255) | No | Email address |
| phone | VARCHAR(50) | No | Phone number |
| company_id | INT (FK) | No | Linked company ID |
| lead_source | VARCHAR(100) | No | Original lead source |
| tags | JSON | No | Array of tags |
| status | ENUM | Yes | Active, Inactive |
| last_contacted | DATETIME | No | Last contact date |
| notes | TEXT | No | Notes |
| job_title | VARCHAR(100) | No | Job title |
| is_primary | BOOLEAN | No | Primary contact for company |
| owner_id | INT (FK) | No | Assigned user |
| tenant_company_id | INT (FK) | Yes | Tenant company ID |
| created_at | DATETIME | Yes | Creation timestamp |
| updated_at | DATETIME | Yes | Last update timestamp |

### Features
1. **Table/List View** - With sorting and pagination
2. **Filters** - Status, Source, Tags, Company
3. **Link to Company** - Associate with business account
4. **Add Activities** - Log calls, emails, meetings
5. **Add Tasks** - Create related tasks

### API Endpoints
```
GET    /api/contacts                 # List contacts
GET    /api/contacts/:id             # Get single contact
POST   /api/contacts                 # Create contact
PUT    /api/contacts/:id             # Update contact
DELETE /api/contacts/:id             # Delete contact
GET    /api/contacts/:id/activities  # Get contact activities
GET    /api/contacts/:id/deals       # Get contact deals
```

---

## 4. COMPANIES MODULE

### Purpose
Store business accounts/organizations.

### Database Table: `companies` (or `clients`)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | INT (PK) | Yes | Auto-increment |
| company_name | VARCHAR(255) | Yes | Company name |
| industry | VARCHAR(100) | No | Industry type |
| website | VARCHAR(255) | No | Website URL |
| address | TEXT | No | Full address |
| city | VARCHAR(100) | No | City |
| state | VARCHAR(100) | No | State/Province |
| country | VARCHAR(100) | No | Country |
| phone | VARCHAR(50) | No | Phone number |
| notes | TEXT | No | Notes |
| owner_id | INT (FK) | No | Account owner |
| tenant_company_id | INT (FK) | Yes | Tenant company ID |
| created_at | DATETIME | Yes | Creation timestamp |
| updated_at | DATETIME | Yes | Last update timestamp |

### Computed Fields (from related tables)
- `contacts_count` - Number of linked contacts
- `open_deals_count` - Number of active deals
- `total_deal_value` - Sum of deal values

### Features
1. **Grid/List View** - Visual display options
2. **Search & Filter** - By industry, status, owner
3. **Company Profile** - Detailed view with:
   - Linked contacts list
   - Open deals
   - Activity timeline
   - Notes history

### API Endpoints
```
GET    /api/companies                # List companies
GET    /api/companies/:id            # Get company with details
POST   /api/companies                # Create company
PUT    /api/companies/:id            # Update company
DELETE /api/companies/:id            # Delete company
GET    /api/companies/:id/contacts   # Get company contacts
GET    /api/companies/:id/deals      # Get company deals
```

---

## 5. DEALS / OPPORTUNITIES MODULE

### Purpose
Track revenue opportunities through the sales pipeline.

### Database Table: `deals`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | INT (PK) | Yes | Auto-increment |
| deal_name | VARCHAR(255) | Yes | Deal title |
| deal_value | DECIMAL(15,2) | No | Deal amount |
| stage | ENUM | Yes | Pipeline stage |
| owner_id | INT (FK) | No | Deal owner |
| close_date | DATE | No | Expected close date |
| contact_id | INT (FK) | No | Linked contact |
| company_id | INT (FK) | No | Linked company |
| notes | TEXT | No | Deal notes |
| probability | INT | No | Win probability % |
| lead_id | INT (FK) | No | Original lead ID |
| tenant_company_id | INT (FK) | Yes | Tenant company ID |
| created_at | DATETIME | Yes | Creation timestamp |
| updated_at | DATETIME | Yes | Last update timestamp |
| closed_at | DATETIME | No | Actual close date |

### Deal Stages
| Stage | Order | Probability | Color |
|-------|-------|-------------|-------|
| New | 1 | 10% | Blue |
| Contacted | 2 | 20% | Teal |
| Qualified | 3 | 40% | Purple |
| Proposal Sent | 4 | 60% | Orange |
| Negotiation | 5 | 80% | Yellow |
| Closed Won | 6 | 100% | Green |
| Closed Lost | 7 | 0% | Red |

### Features
1. **Pipeline Board** - Kanban with drag & drop
2. **Deal Detail Page** - Full deal information
3. **Activity Timeline** - All interactions
4. **Value Forecasting** - Based on stage probability

### API Endpoints
```
GET    /api/deals                    # List deals
GET    /api/deals/:id                # Get deal details
POST   /api/deals                    # Create deal
PUT    /api/deals/:id                # Update deal
DELETE /api/deals/:id                # Delete deal
PATCH  /api/deals/:id/stage          # Update stage
GET    /api/deals/:id/activities     # Get deal activities
GET    /api/deals/pipeline           # Pipeline summary
```

---

## 6. LEAD PIPELINE MANAGEMENT MODULE

### Purpose
Provide a **visual, configurable pipeline board for leads** with drag & drop stage management and quick actions.

### Database Tables

#### 6.1 `lead_pipeline_configs`
High-level configuration per tenant.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | INT (PK) | Yes | Auto-increment |
| tenant_company_id | INT (FK) | Yes | Owning tenant/company |
| name | VARCHAR(100) | Yes | Pipeline name (e.g. "Default Lead Pipeline") |
| is_default | BOOLEAN | Yes | Marks default pipeline |
| is_active | BOOLEAN | Yes | Active/inactive flag |
| created_at | DATETIME | Yes | Creation timestamp |
| updated_at | DATETIME | Yes | Last update timestamp |

#### 6.2 `lead_pipeline_stages`
Definition of **lead stages** and their order/visuals.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | INT (PK) | Yes | Auto-increment |
| pipeline_id | INT (FK) | Yes | References `lead_pipeline_configs.id` |
| name | VARCHAR(100) | Yes | Stage name (New Lead, Contacted, etc.) |
| code | VARCHAR(50) | Yes | Stable key (NEW_LEAD, CONTACTED, etc.) |
| sort_order | INT | Yes | Column order in pipeline board |
| color | VARCHAR(20) | No | Hex or Tailwind color token |
| probability | INT | No | Optional probability % for forecasting |
| is_terminal | BOOLEAN | Yes | True for Converted/Lost stages |
| created_at | DATETIME | Yes | Creation timestamp |
| updated_at | DATETIME | Yes | Last update timestamp |

> **Link to `leads`**: `leads.stage` should map to `lead_pipeline_stages.name` (or `code`) per tenant.

### Features & Behavior
- **Stage-based grouping**:
  - Leads are grouped by `leads.stage`.
  - Each column corresponds to a row from `lead_pipeline_stages`.
- **Drag & drop lead cards**:
  - Frontend sends a **stage-change** request when a card is dropped into a new column.
  - Backend must:
    - Validate that the new stage exists for the tenant.
    - Update `leads.stage` and (optionally) `leads.status`.
    - Append a record to an audit/activity log describing the move.
- **Quick actions on cards**:
  - **Add Note** → Creates an entry in `activities` or `notes` (see Tasks & Notes section).
  - **Set Reminder** → Creates a `task` with `status = Open`, `due_date` set from UI, linked to `lead_id`.
- **Filtering**:
  - Same filters as Leads table: owner, source, tag, date ranges.

### API Endpoints
```
GET    /api/lead-pipeline/stages           # List configured stages for tenant
POST   /api/lead-pipeline/stages           # Create stage (admin-only)
PUT    /api/lead-pipeline/stages/:id       # Update stage name/order/color
DELETE /api/lead-pipeline/stages/:id       # Soft-delete stage (if no active leads or with reassignment)

PATCH  /api/leads/:id/stage                # Update stage when drag & drop
GET    /api/leads/pipeline-board           # Returns leads grouped by stage for board view
```

---

## 7. ACTIVITIES MODULE

### Purpose
Track all interactions and communications.

### Database Table: `activities`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | INT (PK) | Yes | Auto-increment |
| activity_type | ENUM | Yes | Call, Email, Meeting, Message, Follow-up |
| subject | VARCHAR(255) | Yes | Activity subject |
| description | TEXT | No | Details |
| activity_date | DATETIME | Yes | When it occurred |
| duration_minutes | INT | No | Duration |
| lead_id | INT (FK) | No | Related lead |
| contact_id | INT (FK) | No | Related contact |
| deal_id | INT (FK) | No | Related deal |
| company_id | INT (FK) | No | Related company |
| user_id | INT (FK) | Yes | User who logged it |
| tenant_company_id | INT (FK) | Yes | Tenant company ID |
| created_at | DATETIME | Yes | Creation timestamp |

### Activity Types
| Type | Icon | Color |
|------|------|-------|
| Call | Phone | Blue |
| Email | Mail | Green |
| Meeting | Calendar | Purple |
| Message | Chat | Teal |
| Follow-up | Clock | Orange |
| Note | Document | Gray |

### Features
1. **Activity Timeline** - Per contact/deal/lead
2. **Log New Activity** - Quick entry form
3. **Calendar View** - Schedule visualization
4. **Filters** - By type, date, user

### API Endpoints
```
GET    /api/activities               # List activities
GET    /api/activities/:id           # Get activity
POST   /api/activities               # Log activity
PUT    /api/activities/:id           # Update activity
DELETE /api/activities/:id           # Delete activity
GET    /api/activities/calendar      # Calendar format
GET    /api/activities/recent        # Last 10 activities
```

---

## 8. TASKS & NOTES MODULE

### Purpose
Manage action items and documentation.

### Database Table: `tasks`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | INT (PK) | Yes | Auto-increment |
| title | VARCHAR(255) | Yes | Task title (maps to "Task Title") |
| description | TEXT | No | Task details |
| due_date | DATE | No | Due date |
| due_time | TIME | No | Due time |
| priority | ENUM | No | Low, Medium, High, Urgent |
| status | ENUM | Yes | Open, In Progress, Done |
| assigned_to | INT (FK) | No | Assigned user ID |
| lead_id | INT (FK) | No | Related lead |
| contact_id | INT (FK) | No | Related contact |
| deal_id | INT (FK) | No | Related deal |
| notes | TEXT | No | Free-text notes captured with the task ("Notes" from spec) |
| tenant_company_id | INT (FK) | Yes | Tenant company ID |
| created_by | INT (FK) | Yes | Creator user ID |
| created_at | DATETIME | Yes | Creation timestamp |
| completed_at | DATETIME | No | Completion timestamp |

### Task Statuses
| Status | Color |
|--------|-------|
| Open | Blue |
| In Progress | Yellow |
| Done | Green |
| Overdue | Red (computed) |

### Notes Behavior
- **Standalone Notes** can be represented in one of two ways (choose per implementation preference):
  1. As `tasks` with `status = Done` and no `due_date` (quick log-style notes).
  2. As a dedicated `notes` table:

     | Field | Type | Required | Description |
     |-------|------|----------|-------------|
     | id | INT (PK) | Yes | Auto-increment |
     | body | TEXT | Yes | Note content |
     | lead_id | INT (FK) | No | Related lead |
     | contact_id | INT (FK) | No | Related contact |
     | deal_id | INT (FK) | No | Related deal |
     | company_id | INT (FK) | No | Related company |
     | created_by | INT (FK) | Yes | Author user |
     | created_at | DATETIME | Yes | Created time |

- The **frontend currently treats "Add Note"** on Leads/Contacts/Deals/Companies as:
  - Either creating a `note` row, or
  - Creating an `activity` with `activity_type = 'Note'`.
  - Backend should expose both via detail endpoints so timelines are complete.

### API Endpoints
```
GET    /api/tasks                    # List tasks
GET    /api/tasks/:id                # Get task
POST   /api/tasks                    # Create task
PUT    /api/tasks/:id                # Update task
DELETE /api/tasks/:id                # Delete task
PATCH  /api/tasks/:id/status         # Update status
GET    /api/tasks/my                 # My tasks
GET    /api/tasks/overdue            # Overdue tasks
```

---

## 9. REPORTS & ANALYTICS MODULE

### Purpose
Provide business insights and performance metrics.

### Report Types

#### 8.1 Sales Pipeline Report
- Total pipeline value by stage
- Stage conversion rates
- Average deal size
- Average time in each stage

#### 8.2 Lead Analytics
- Leads by source
- Conversion rate (Lead → Deal)
- Lead response time
- Lead aging report

#### 8.3 Deal Analytics
- Deals won vs lost
- Win rate percentage
- Revenue by period
- Revenue by owner

#### 8.4 Activity Report
- Activities by type
- Activities by user
- Activity trends

### API Endpoints
```
GET /api/reports/pipeline-value
GET /api/reports/leads-by-source
GET /api/reports/conversion-rates
GET /api/reports/deals-won-lost
GET /api/reports/activity-summary
GET /api/reports/user-performance
```

---

## 10. USERS & PERMISSIONS MODULE

### Database Table: `users`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | INT (PK) | Yes | Auto-increment |
| name | VARCHAR(255) | Yes | Full name |
| email | VARCHAR(255) | Yes | Email (unique) |
| password | VARCHAR(255) | Yes | Hashed password |
| role | ENUM | Yes | User role |
| tenant_company_id | INT (FK) | Yes | Company ID |
| is_active | BOOLEAN | Yes | Account status |
| last_login | DATETIME | No | Last login time |
| created_at | DATETIME | Yes | Creation timestamp |

### Roles & Permissions

| Role | Leads | Contacts | Companies | Deals | Reports | Settings |
|------|-------|----------|-----------|-------|---------|----------|
| Admin | Full | Full | Full | Full | Full | Full |
| Manager | Full | Full | Full | Full | View | Limited |
| Sales Rep | Own | Own | View | Own | Own | None |
| Client | None | None | None | Own | Own | None |

> **Client role** in this matrix corresponds to the **"Client View"** role from the product spec.

### Data Visibility Rules
- **Admin**
  - Can access **all records** across all modules for their `tenant_company_id`.
  - Can manage users, roles, pipeline configurations, settings.
- **Manager**
  - Has access to **all team records** (all leads/deals/activities/tasks within tenant).
  - Access to **reports** in read-only mode.
- **Sales Rep**
  - Can only see:
    - Leads/Contacts/Deals/Activities/Tasks where `owner_id`/`assigned_to` == their `users.id`.
  - Cannot view or edit system settings or other users.
- **Client View**
  - Can only see:
    - Deals, activities, tasks, invoices, etc. **linked to their own company/contact**.
  - No visibility into other clients’ data, users, or configuration.

### Permission Matrix
- **Full**: Create, Read, Update, Delete all records
- **Own**: CRUD only on assigned/created records
- **View**: Read-only access
- **Limited**: Specific features only
- **None**: No access

---

## 11. SETTINGS MODULE

### Sections
1. **General Settings** - Company info, timezone, currency
2. **Pipeline Settings** - Customize stages
3. **Lead Sources** - Manage sources list
4. **Tags Management** - Create/edit tags
5. **Email Templates** - Activity email templates
6. **Notification Settings** - Email/push preferences
7. **Data Import/Export** - Bulk operations

---

## Navigation Structure

### Main Navigation (Top/Side Menu)
```
╔══════════════════════════════════════════════════════════════╗
║ Dashboard │ Leads │ Contacts │ Companies │ Deals │           ║
║ Activities │ Tasks │ Reports │ Settings                      ║
╚══════════════════════════════════════════════════════════════╝
```

### Sidebar Categories
| Category | Modules |
|----------|---------|
| CRM | Dashboard, Leads, Contacts, Companies |
| SALES | Deals, Activities |
| WORK | Tasks |
| ANALYTICS | Reports |
| SYSTEM | Settings, Users |

---

## Data Relationships Summary

```sql
-- Foreign Key Relationships

leads.owner_id → users.id
leads.company_id → companies.id (tenant)

contacts.company_id → companies.id (linked)
contacts.owner_id → users.id

deals.contact_id → contacts.id
deals.company_id → companies.id
deals.owner_id → users.id
deals.lead_id → leads.id

activities.lead_id → leads.id
activities.contact_id → contacts.id
activities.deal_id → deals.id
activities.user_id → users.id

tasks.lead_id → leads.id
tasks.contact_id → contacts.id
tasks.deal_id → deals.id
tasks.assigned_to → users.id
tasks.created_by → users.id
```

---

## API Response Standards

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Pagination
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-20 | Initial CRM module documentation |

---

## Notes for Backend Developer

1. **Multi-tenancy**: All queries must filter by `tenant_company_id`
2. **Soft Deletes**: Consider implementing soft deletes for leads, contacts, deals
3. **Audit Trail**: Log all CRUD operations with user and timestamp
4. **Search**: Implement full-text search for names, emails, notes
5. **Caching**: Cache dashboard stats, invalidate on data changes
6. **Rate Limiting**: Apply rate limits to API endpoints
7. **Validation**: Validate all inputs, especially email formats and phone numbers
