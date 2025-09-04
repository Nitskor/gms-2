"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  designation: string;
  status: string;
}

export default function CreateClientPage() {
  // Client Information
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [contractDates, setContractDates] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [billingAmount, setBillingAmount] = useState("");

  // Management Team
  const [generalManager, setGeneralManager] = useState("");
  const [fieldOfficer, setFieldOfficer] = useState("");
  const [adminInCharge, setAdminInCharge] = useState("");

  // Existing Employees from database
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Post Sites with 2 default shifts (Day and Night)
  const [postSites, setPostSites] = useState([{
    id: 1,
    name: "",
    shifts: [
      {
        id: 1,
        shiftName: "Day Shift",
        startTime: "06:00",
        endTime: "18:00",
        patrollingRequired: false,
        soAsoCount: 1,
        supervisorCount: 1,
        securityGuardCount: 2
      },
      {
        id: 2,
        shiftName: "Night Shift",
        startTime: "18:00",
        endTime: "06:00",
        patrollingRequired: true,
        soAsoCount: 1,
        supervisorCount: 1,
        securityGuardCount: 3
      }
    ]
  }]);

  // Fetch existing employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      console.log('Fetching employees...');
      const response = await fetch('/api/employees');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Employees data:', data);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Set some sample data for testing
      setEmployees([
        {
          _id: "1",
          employeeId: "EMP-001",
          name: "John Doe",
          designation: "Security Guard",
          status: "active"
        },
        {
          _id: "2", 
          employeeId: "EMP-002",
          name: "Jane Smith",
          designation: "Supervisor",
          status: "active"
        },
        {
          _id: "3",
          employeeId: "EMP-003", 
          name: "Bob Wilson",
          designation: "SO/ASO",
          status: "active"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Get employees by designation
  const getEmployeesByDesignation = (designation: string) => {
    console.log('Getting employees for designation:', designation);
    console.log('All employees:', employees);
    
    const filtered = employees.filter(emp => {
      const empDesignation = emp.designation.toLowerCase().trim();
      const searchDesignation = designation.toLowerCase().trim();
      
      // Exact matching for better precision
      if (searchDesignation === 'so/aso' || searchDesignation === 'so_aso') {
        return empDesignation === 'so/aso' || empDesignation === 'so_aso';
      }
      if (searchDesignation === 'supervisor') {
        return empDesignation === 'supervisor';
      }
      if (searchDesignation === 'security guard') {
        return empDesignation === 'security guard';
      }
      
      // Fallback to includes only if exact match fails
      return empDesignation.includes(searchDesignation);
    });
    
    console.log('Filtered employees for', designation, ':', filtered);
    return filtered;
  };

  // Post Site Functions
  const addPostSite = () => {
    const newId = Math.max(...postSites.map(site => site.id)) + 1;
    setPostSites([...postSites, {
      id: newId,
      name: "",
      shifts: [
        {
          id: 1,
          shiftName: "Day Shift",
          startTime: "06:00",
          endTime: "18:00",
          patrollingRequired: false,
          soAsoCount: 1,
          supervisorCount: 1,
          securityGuardCount: 2
        },
        {
          id: 2,
          shiftName: "Night Shift",
          startTime: "18:00",
          endTime: "06:00",
          patrollingRequired: true,
          soAsoCount: 1,
          supervisorCount: 1,
          securityGuardCount: 3
        }
      ]
    }]);
  };

  const removePostSite = (id: number) => {
    setPostSites(postSites.filter(site => site.id !== id));
  };

  const updatePostSite = (id: number, field: string, value: any) => {
    setPostSites(postSites.map(site => 
      site.id === id ? { ...site, [field]: value } : site
    ));
  };

  const updateShift = (siteId: number, shiftId: number, field: string, value: any) => {
    setPostSites(postSites.map(site => {
      if (site.id === siteId) {
        return {
          ...site,
          shifts: site.shifts.map(shift => 
            shift.id === shiftId ? { ...shift, [field]: value } : shift
          )
        };
      }
      return site;
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create Client with staff requirements
      console.log('Creating client...');
      const clientData = {
        companyName,
        contactPerson,
        email,
        phone,
        address,
        contractDates,
        billingDate,
        billingAmount,
        managementTeam: {
          generalManager,
          fieldOfficer,
          adminInCharge
        },
        postSites
      };

      const clientResponse = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      const clientResult = await clientResponse.json();
      if (!clientResponse.ok) {
        throw new Error(`Client creation failed: ${clientResult.error}`);
      }

      const clientCode = clientResult.clientCode;
      console.log('Client created with code:', clientCode);

      // Step 2: Create assignments based on staff requirements
      console.log('Creating assignments based on staff requirements...');
      const assignmentPromises = [];

      for (const site of postSites) {
        if (site.name) { // Only create assignments for sites with names
          for (const shift of site.shifts) {
            // Create SO/ASO assignments
            for (let i = 0; i < (shift.soAsoCount || 0); i++) {
              assignmentPromises.push(
                fetch('/api/assignments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    employeeId: '', // Will be assigned later
                    clientCode: clientCode,
                    siteId: site.name,
                    shiftId: shift.shiftName,
                    designation: 'SO_ASO',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: null,
                    status: 'pending' // Pending until employee is assigned
                  }),
                })
              );
            }

            // Create Supervisor assignments
            for (let i = 0; i < (shift.supervisorCount || 0); i++) {
              assignmentPromises.push(
                fetch('/api/assignments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    employeeId: '', // Will be assigned later
                    clientCode: clientCode,
                    siteId: site.name,
                    shiftId: shift.shiftName,
                    designation: 'SUPERVISOR',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: null,
                    status: 'pending' // Pending until employee is assigned
                  }),
                })
              );
            }

            // Create Security Guard assignments
            for (let i = 0; i < (shift.securityGuardCount || 0); i++) {
              assignmentPromises.push(
                fetch('/api/assignments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    employeeId: '', // Will be assigned later
                    clientCode: clientCode,
                    siteId: site.name,
                    shiftId: shift.shiftName,
                    designation: 'SECURITY_GUARD',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: null,
                    status: 'pending' // Pending until employee is assigned
                  }),
                })
              );
            }
          }
        }
      }

      // Wait for all assignments to be created
      await Promise.all(assignmentPromises);

      alert(`Client created successfully with code: ${clientCode}! ${assignmentPromises.length} assignment slots have been created. You can now assign staff in the Assignments page.`);
      
      // Keep form data for creating another client - only clear the site names
      setPostSites(postSites.map(site => ({
        ...site,
        name: "" // Only clear site names, keep shift requirements
      })));
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create client'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Creating a new customer with employee assignments</h1>
          
          {/* Debug Info */}
          <div className="mb-4 p-4 text-black bg-yellow-100 rounded">
            <p className="text-sm">Debug: Found {employees.length} employees</p>
            <p className="text-sm">SO/ASO: {getEmployeesByDesignation('SO/ASO').length}</p>
            <p className="text-sm">Supervisors: {getEmployeesByDesignation('Supervisor').length}</p>
            <p className="text-sm">Security Guards: {getEmployeesByDesignation('Security Guard').length}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Client Information */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name of company
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name of contact person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email-id of contact person
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone no. of contact person
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract dates
                  </label>
                  <input
                    type="text"
                    value={contractDates}
                    onChange={(e) => setContractDates(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Jan 1, 2024 - Dec 31, 2024"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing date
                  </label>
                  <input
                    type="date"
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing amount
                  </label>
                  <input
                    type="number"
                    value={billingAmount}
                    onChange={(e) => setBillingAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Management Team */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Management Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    General Manager
                  </label>
                  <input
                    type="text"
                    value={generalManager}
                    onChange={(e) => setGeneralManager(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Officer
                  </label>
                  <input
                    type="text"
                    value={fieldOfficer}
                    onChange={(e) => setFieldOfficer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin in-charge
                  </label>
                  <input
                    type="text"
                    value={adminInCharge}
                    onChange={(e) => setAdminInCharge(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Post Sites with Employee Assignments */}
            <div className="bg-yellow-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Post Sites & Employee Assignments</h2>
                <button
                  type="button"
                  onClick={addPostSite}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <Plus size={16} />
                  Add Post Site
                </button>
              </div>

              {postSites.map((site, index) => (
                <div key={site.id} className="bg-white p-4 rounded-lg mb-4 border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-gray-900">Post site {index + 1}</h3>
                    {postSites.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePostSite(site.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name of Post site
                    </label>
                    <input
                      type="text"
                      value={site.name}
                      onChange={(e) => updatePostSite(site.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>

                  {/* Shifts */}
                  <div className="space-y-4">
                    {site.shifts.map((shift, shiftIndex) => (
                      <div key={shift.id} className="bg-gray-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">{shift.shiftName}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start time
                            </label>
                            <input
                              type="time"
                              value={shift.startTime}
                              onChange={(e) => updateShift(site.id, shift.id, 'startTime', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End time
                            </label>
                            <input
                              type="time"
                              value={shift.endTime}
                              onChange={(e) => updateShift(site.id, shift.id, 'endTime', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                              required
                            />
                          </div>
                        </div>

                        {/* Patrolling Required */}
                        <div className="flex items-center gap-2 mb-4">
                          <input
                            type="checkbox"
                            id={`patrolling-${site.id}-${shift.id}`}
                            checked={shift.patrollingRequired}
                            onChange={(e) => updateShift(site.id, shift.id, 'patrollingRequired', e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`patrolling-${site.id}-${shift.id}`} className="text-sm text-gray-700">
                            Patrolling required
                          </label>
                        </div>

                        {/* Staff Requirements for this shift */}
                        <div className="space-y-4">
                          <h6 className="text-sm font-medium text-gray-900">Staff Requirements for {shift.shiftName}</h6>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">SO / ASO:</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => updateShift(site.id, shift.id, 'soAsoCount', Math.max(0, (shift.soAsoCount || 0) - 1))}
                                  className="p-1 text-red-600 hover:text-red-800 border border-red-300 rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                >
                                  ⊖
                                </button>
                                <span className="w-8 text-center font-medium text-gray-900">
                                  {shift.soAsoCount || 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateShift(site.id, shift.id, 'soAsoCount', (shift.soAsoCount || 0) + 1)}
                                  className="p-1 text-green-600 hover:text-green-800 border border-green-300 rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                >
                                  ⊕
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Supervisor:</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => updateShift(site.id, shift.id, 'supervisorCount', Math.max(0, (shift.supervisorCount || 0) - 1))}
                                  className="p-1 text-red-600 hover:text-red-800 border border-red-300 rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                >
                                  ⊖
                                </button>
                                <span className="w-8 text-center font-medium text-gray-900">
                                  {shift.supervisorCount || 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateShift(site.id, shift.id, 'supervisorCount', (shift.supervisorCount || 0) + 1)}
                                  className="p-1 text-green-600 hover:text-green-800 border border-green-300 rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                >
                                  ⊕
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Security Guard:</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => updateShift(site.id, shift.id, 'securityGuardCount', Math.max(0, (shift.securityGuardCount || 0) - 1))}
                                  className="p-1 text-red-600 hover:text-red-800 border border-red-300 rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                >
                                  ⊖
                                </button>
                                <span className="w-8 text-center font-medium text-gray-900">
                                  {shift.securityGuardCount || 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateShift(site.id, shift.id, 'securityGuardCount', (shift.securityGuardCount || 0) + 1)}
                                  className="p-1 text-green-600 hover:text-green-800 border border-green-300 rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                >
                                  ⊕
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                Create Client & Assignments
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}