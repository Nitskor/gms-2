# Guard Management System (GMS)

A comprehensive security guard management system built with Next.js, MongoDB, and TypeScript.

## Features

### ✅ Completed Features
- **Employee Management**: Create, view, and manage security personnel
- **Client Management**: Manage client companies and their requirements
- **Assignment System**: Link employees to clients with specific roles and shifts
- **Auto-generated IDs**: Sequential ID generation (EMP-001, CLI-001, ASN-001)
- **Responsive UI**: Modern interface built with Tailwind CSS

### 🚧 In Progress
- Attendance tracking system
- Payroll management
- Location tracking
- Incident reporting

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: Clerk (ready for integration)
- **Deployment**: Vercel ready

## Database Schema

### Employees Collection
```javascript
{
  employeeId: "EMP-001",
  name: "John Doe",
  designation: "Security Guard",
  contactInfo: { phone, email, address },
  documents: { aadharNumber, panNumber },
  status: "active"
}
```

### Clients Collection
```javascript
{
  clientCode: "CLI-001",
  companyName: "ABC Corp",
  contactPerson: "Manager Name",
  postSites: [{ name, shifts: [{ shiftName, startTime, endTime }] }],
  status: "active"
}
```

### Assignments Collection
```javascript
{
  assignmentId: "ASN-001",
  employeeId: "EMP-001",
  clientCode: "CLI-001",
  siteId: "Main Gate",
  shiftId: "Day Shift",
  designation: "SECURITY_GUARD",
  status: "active"
}
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/guard-management-system.git
   cd guard-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env.local` file:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client

### Assignments
- `GET /api/assignments` - List all assignments
- `POST /api/assignments` - Create new assignment

## Pages

- `/employees` - Employee listing
- `/create-employee` - Add new employee
- `/clients` - Client listing
- `/create-client` - Add new client with assignments
- `/assignments` - Assignment listing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Roadmap

- [ ] Attendance tracking with GPS
- [ ] Payroll management
- [ ] Incident reporting
- [ ] Mobile app for guards
- [ ] Real-time notifications
- [ ] Advanced reporting and analytics
