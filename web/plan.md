GUARD MANAGEMENT SYSTEM (GMS) - COMPLETE IMPLEMENTATION PLAN
PROJECT OVERVIEW
A comprehensive Guard Management System built with Next.js, MongoDB, and TypeScript for managing security personnel, clients, attendance, and operations.
CURRENT STATUS
Basic Next.js setup with Clerk authentication (DONE)
MongoDB connection established (DONE)
Client creation form with shifts and roles (DONE)
Simple client API endpoints at /api/clients (DONE)
DATABASE SCHEMA DESIGN
EMPLOYEES Collection
{
id: ObjectId,
employeeId: "EMP-001",
name: "John Doe",
designation: "Security Guard",
joinDate: ISODate("2024-01-15"),
dateOfBirth: ISODate("1990-05-20"),
dateOfLeaving: ISODate("2024-12-31") || null,
status: "active",
contactInfo: {
phone: "9876543210",
email: "john@example.com",
address: "123 Main Street"
},
documents: {
aadharNumber: "1234-5678-9012",
panNumber: "ABCDE1234F"
},
createdAt: ISODate(),
updatedAt: ISODate()
}
CLIENTS Collection (Enhanced)
{
id: ObjectId,
clientCode: "CLI-001",
companyName: "ABC Corp",
contactPerson: "Manager Name",
email: "contact@abccorp.com",
phone: "9876543210",
address: "Client Address",
contractDates: "Jan 1, 2024 - Dec 31, 2024",
billingDate: ISODate("2024-01-01"),
billingAmount: 50000,
managementTeam: {
generalManager: "GM Name",
fieldOfficer: "FO Name",
adminInCharge: "Admin Name"
},
postSites: [{
siteId: "SITE-001",
name: "Main Gate",
address: "Site Address",
shifts: [{
shiftId: "SHIFT-001",
shiftName: "Day Shift",
startTime: "06:00",
endTime: "18:00",
patrollingRequired: false,
requiredStaff: {
SO_ASO: 1,
SUPERVISOR: 1,
SECURITY_GUARD: 2
}
}]
}],
status: "active",
createdAt: ISODate(),
updatedAt: ISODate()
}
ASSIGNMENTS Collection
{
id: ObjectId,
assignmentId: "ASN-001",
employeeId: "EMP-001",
clientCode: "CLI-001",
siteId: "SITE-001",
shiftId: "SHIFT-001",
designation: "SECURITY_GUARD",
startDate: ISODate("2024-01-01"),
endDate: ISODate("2024-12-31") || null,
status: "active",
createdAt: ISODate(),
updatedAt: ISODate()
}
ATTENDANCE Collection
{
id: ObjectId,
attendanceId: "ATT-001",
employeeId: "EMP-001",
assignmentId: "ASN-001",
date: ISODate("2024-01-15"),
shiftId: "SHIFT-001",
checkIn: {
time: ISODate("2024-01-15T06:00:00Z"),
location: {
latitude: 12.9716,
longitude: 77.5946,
address: "Site Address"
},
method: "manual"
},
checkOut: {
time: ISODate("2024-01-15T18:00:00Z"),
location: {
latitude: 12.9716,
longitude: 77.5946,
address: "Site Address"
},
method: "manual"
},
status: "present",
hoursWorked: 12,
overtimeHours: 0,
remarks: "On time",
createdAt: ISODate(),
updatedAt: ISODate()
}
LOCATION_TRACKING Collection
{
id: ObjectId,
employeeId: "EMP-001",
assignmentId: "ASN-001",
timestamp: ISODate("2024-01-15T10:30:00Z"),
location: {
latitude: 12.9716,
longitude: 77.5946,
accuracy: 10
},
activity: "patrolling",
geofenceStatus: "inside",
createdAt: ISODate()
}
PAYROLL Collection
{
id: ObjectId,
payrollId: "PAY-001",
employeeId: "EMP-001",
month: "2024-01",
basicSalary: 15000,
overtimePay: 1500,
allowances: 2000,
deductions: 500,
netSalary: 18000,
daysWorked: 30,
overtimeHours: 10,
status: "processed",
paidDate: ISODate("2024-02-01"),
createdAt: ISODate(),
updatedAt: ISODate()
}
INCIDENTS Collection
{
id: ObjectId,
incidentId: "INC-001",
employeeId: "EMP-001",
clientCode: "CLI-001",
siteId: "SITE-001",
incidentType: "security_breach",
description: "Incident details",
severity: "medium",
reportedDate: ISODate("2024-01-15"),
status: "open",
reportedBy: "EMP-002",
documents: ["photo1.jpg", "report.pdf"],
createdAt: ISODate(),
updatedAt: ISODate()
}
TABLE RELATIONSHIPS
EMPLOYEES connects to ASSIGNMENTS connects to CLIENTS
EMPLOYEES connects to ATTENDANCE
ASSIGNMENTS connects to LOCATION_TRACKING
CLIENTS connects to INCIDENTS
ATTENDANCE connects to PAYROLL
IMPLEMENTATION PHASES
Phase 1: Core Setup (Week 1)
Employee Management
Create /api/employees endpoints (GET, POST, PUT, DELETE)
Build employee registration form at /create-employee
Employee listing page at /employees
Assignment Management
Create /api/assignments endpoints
Build assignment form linking employees to clients/sites
Assignment dashboard
Phase 2: Attendance System (Week 2)
Attendance Tracking
Create /api/attendance endpoints
Build check-in/check-out interface
GPS location capture
Attendance reports
Location Tracking
Create /api/location-tracking endpoints
Real-time GPS tracking
Geofence monitoring
Location history
Phase 3: Financial Management (Week 3)
Payroll System
Create /api/payroll endpoints
Automatic salary calculation
Payroll reports
Payment tracking
Billing Management
Client billing automation
Invoice generation
Revenue reports
Phase 4: Monitoring & Reports (Week 4)
Incident Management
Create /api/incidents endpoints
Incident reporting form
Incident tracking dashboard
Dashboard & Analytics
Main dashboard with KPIs
Employee performance reports
Client service reports
Financial summaries
PAGE STRUCTURE
Public Pages
/ (Landing page)
/sign-in (Login page)
/sign-up (Registration page)
Protected Pages
/dashboard (Main dashboard)
/employees (Employee list)
/create-employee (Add new employee)
/employees/[id] (Employee details)
/clients (Client list - existing)
/create-client (Add new client - existing)
/clients/[id] (Client details)
/assignments (Assignment management)
/attendance (Attendance tracking)
/payroll (Payroll management)
/reports (Various reports)
/incidents (Incident management)
API ENDPOINTS STRUCTURE
Employee APIs
GET /api/employees (List all employees)
POST /api/employees (Create new employee)
GET /api/employees/[id] (Get employee details)
PUT /api/employees/[id] (Update employee)
DELETE /api/employees/[id] (Delete employee)
Assignment APIs
GET /api/assignments (List all assignments)
POST /api/assignments (Create new assignment)
GET /api/assignments/[id] (Get assignment details)
PUT /api/assignments/[id] (Update assignment)
DELETE /api/assignments/[id] (Delete assignment)
Attendance APIs
GET /api/attendance (Get attendance records)
POST /api/attendance (Mark attendance)
GET /api/attendance/[date] (Get attendance by date)
GET /api/attendance/employee/[id] (Employee attendance history)
Location APIs
GET /api/location-tracking (Get location history)
POST /api/location-tracking (Log location)
GET /api/location-tracking/employee/[id] (Employee location history)
Payroll APIs
GET /api/payroll (Get payroll records)
POST /api/payroll (Generate payroll)
GET /api/payroll/[month] (Get monthly payroll)
GET /api/payroll/employee/[id] (Employee payroll history)
Incidents APIs
GET /api/incidents (List all incidents)
POST /api/incidents (Report new incident)
GET /api/incidents/[id] (Get incident details)
PUT /api/incidents/[id] (Update incident)
DASHBOARD COMPONENTS
Main Dashboard KPIs
Total Employees (Active/Inactive)
Present Today (Count & Percentage)
Active Clients
Monthly Revenue
Pending Incidents
Overtime Hours This Month
Employee Dashboard
Employee performance metrics
Attendance trends
Assignment history
Training records
Client Dashboard
Service level metrics
Attendance at client sites
Incident reports
Billing status
Financial Dashboard
Revenue vs Costs
Payroll expenses
Client profitability
Budget tracking
TECHNICAL IMPLEMENTATION NOTES
Database Connection
Current: MongoDB with direct driver
Database: gms
Environment: MONGODB_URI in .env
Authentication
Current: Clerk authentication
Protected routes via middleware
Role-based access control needed
File Structure
web/
├── src/
│ ├── app/
│ │ ├── api/
│ │ │ ├── employees/
│ │ │ ├── assignments/
│ │ │ ├── attendance/
│ │ │ ├── payroll/
│ │ │ └── incidents/
│ │ ├── dashboard/
│ │ ├── employees/
│ │ ├── assignments/
│ │ ├── attendance/
│ │ └── reports/
│ ├── components/
│ │ ├── ui/
│ │ ├── forms/
│ │ ├── dashboard/
│ │ └── tables/
│ └── utils/
│ ├── database.ts
│ ├── auth.ts
│ └── constants.ts
QUICK START COMMANDS FOR NEW CHAT
"Create employee management API endpoints"
"Build employee registration form"
"Set up attendance tracking system"
"Create assignment management"
"Build main dashboard with KPIs"
SAMPLE DATA FOR TESTING
Employee Sample
{
name: "Rajesh Kumar",
designation: "Security Guard",
joinDate: "2024-01-15",
phone: "9876543210",
email: "rajesh@example.com"
}
Assignment Sample
{
employeeId: "EMP-001",
clientCode: "CLI-001",
siteId: "SITE-001",
shiftId: "SHIFT-001",
designation: "Security Guard"
}
PRIORITY IMPLEMENTATION ORDER
Employee Management (Forms + APIs)
Assignment System (Link employees to clients)
Attendance Tracking (Daily operations)
Basic Dashboard (Overview + KPIs)
Reports (Performance + Financial)
Advanced Features (Location tracking, Incidents)
KEY FEATURES TO IMPLEMENT
Auto-ID generation (EMP-001, CLI-001, etc.)
Data validation and error handling
Real-time updates
Export functionality (PDF/Excel)
Mobile-responsive design
Role-based permissions
Audit trails
Backup and recovery
This plan provides a complete roadmap for building a comprehensive Guard Management System. Each phase builds upon the previous one, ensuring a solid foundation and gradual feature enhancement.