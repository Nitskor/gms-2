'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Upload, ArrowRight } from 'lucide-react';

interface Assignment {
  _id: string;
  assignmentId: string;
  employeeId: string;
  clientCode: string;
  siteId: string;
  shiftId: string;
  designation: string;
  startDate: string;
  endDate: string | null;
  status: string;
  employee: {
    name: string;
    designation: string;
    phone: string;
  } | null;
  client: {
    companyName: string;
    contactPerson: string;
  } | null;
}

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  designation: string;
  status: string;
}

interface Client {
  _id: string;
  clientCode: string;
  companyName: string;
  postSites: Array<{
    siteId: string;
    name: string;
    shifts: Array<{
      shiftId: string;
      shiftName: string;
      startTime: string;
      endTime: string;
      requiredStaff?: {
        SO_ASO: number;
        SUPERVISOR: number;
        SECURITY_GUARD: number;
      };
      defaultAssignments?: Array<{
        designation: string;
        employeeId: string;
        roleId: string;
      }>;
    }>;
  }>;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [addPositionContext, setAddPositionContext] = useState<{
    clientCode: string;
    siteId: string;
    shiftId: string;
  } | null>(null);
  const [addPositionForm, setAddPositionForm] = useState<{
    designation: string;
  }>({
    designation: ''
  });


  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    employeeId: string;
    designation: string;
    startDate: string;
    status: string;
  }>({
    employeeId: '',
    designation: '',
    startDate: '',
    status: 'active'
  });

  // Push to Planner state
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushForm, setPushForm] = useState<{
    startDate: string;
    endDate: string;
    applyRotation: boolean;
  }>({
    startDate: '',
    endDate: '',
    applyRotation: true
  });
  const [pushLoading, setPushLoading] = useState(false);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await fetch('/api/assignments');
      const data = await response.json();
      setAssignments(data);
      
      // Auto-fix assignments that have employees but are still pending
      await autoFixPendingAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchEmployees();
    fetchClients();
  }, [fetchAssignments]);

  const autoFixPendingAssignments = async (assignmentsData: Assignment[]) => {
    const assignmentsToFix = assignmentsData.filter(
      assignment => assignment.status === 'pending' && assignment.employeeId
    );

    if (assignmentsToFix.length > 0) {
      console.log(`Found ${assignmentsToFix.length} assignments to fix`);
      
      // Fix each assignment
      for (const assignment of assignmentsToFix) {
        try {
          await fetch(`/api/assignments/${assignment._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              employeeId: assignment.employeeId,
              status: 'active'
            }),
          });
        } catch (error) {
          console.error(`Error fixing assignment ${assignment._id}:`, error);
        }
      }
      
      // Refresh assignments after fixing
      if (assignmentsToFix.length > 0) {
        setTimeout(() => {
          fetchAssignments();
        }, 500);
      }
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Helper function to get employees by designation
  const getEmployeesByDesignation = (designation: string) => {
    const roleMapping = {
      'SO_ASO': ['SO/ASO', 'SO', 'ASO', 'Senior Officer', 'Assistant Security Officer'],
      'SUPERVISOR': ['Supervisor', 'Team Lead', 'Team Leader'],
      'SECURITY_GUARD': ['Security Guard', 'Guard', 'Security Officer']
    };
    
    const allowedDesignations = roleMapping[designation as keyof typeof roleMapping] || [];
    
    return employees.filter(emp => {
      const empDesignation = emp.designation.toLowerCase();
      
      if (designation === 'SO_ASO') {
        return allowedDesignations.some(allowedDesignation => 
          empDesignation.includes(allowedDesignation.toLowerCase())
        ) && !empDesignation.includes('supervisor') && !empDesignation.includes('team lead');
      }
      
      return allowedDesignations.some(allowedDesignation => 
        empDesignation.includes(allowedDesignation.toLowerCase())
      );
    });
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDesignationDisplay = (designation: string) => {
    switch (designation) {
      case 'SO_ASO':
        return 'SO/ASO';
      case 'SECURITY_GUARD':
        return 'Security Guard';
      case 'SUPERVISOR':
        return 'Supervisor';
      default:
        return designation.replace('_', ' ');
    }
  };

  const getDesignationBadge = (designation: string) => {
    switch (designation) {
      case 'SO_ASO':
        return 'bg-purple-100 text-purple-800';
      case 'SUPERVISOR':
        return 'bg-blue-100 text-blue-800';
      case 'SECURITY_GUARD':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Assignment deleted successfully!');
        fetchAssignments();
      } else {
        const result = await response.json();
        alert(`Error: ${result.message || 'Failed to delete assignment'}`);
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment');
    }
  };

  const startEditingAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment._id);
    setEditForm({
      employeeId: assignment.employeeId || '',
      designation: assignment.designation,
      startDate: assignment.startDate,
      status: assignment.status
    });
  };

  const cancelEditing = () => {
    setEditingAssignment(null);
    setEditForm({
      employeeId: '',
      designation: '',
      startDate: '',
      status: 'active'
    });
  };

  const saveAssignmentChanges = async (assignmentId: string) => {
    try {
      // Determine status based on whether employee is assigned or not
      let newStatus: string;
      if (editForm.employeeId && editForm.employeeId.trim() !== '') {
        // If employee is assigned, status should be 'active'
        newStatus = 'active';
      } else {
        // If no employee is assigned, status should be 'pending'
        newStatus = 'pending';
      }
      
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: editForm.employeeId,
          status: newStatus
        }),
      });

      if (response.ok) {
        alert('Assignment updated successfully!');
        setEditingAssignment(null);
        fetchAssignments();
      } else {
        const result = await response.json();
        alert(`Error: ${result.message || 'Failed to update assignment'}`);
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment');
    }
  };

  const openAddPositionModal = (clientCode: string, siteId: string, shiftId: string) => {
    setAddPositionContext({ clientCode, siteId, shiftId });
    setShowAddPositionModal(true);
    setAddPositionForm({ designation: '' });
  };

  const closeAddPositionModal = () => {
    setShowAddPositionModal(false);
    setAddPositionContext(null);
    setAddPositionForm({ designation: '' });
  };

  const addNewPosition = async () => {
    if (!addPositionContext || !addPositionForm.designation) {
      alert('Please select a designation');
      return;
    }

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: '', // Empty for pending assignment
          clientCode: addPositionContext.clientCode,
          siteId: addPositionContext.siteId,
          shiftId: addPositionContext.shiftId,
          designation: addPositionForm.designation,
          startDate: new Date().toISOString().split('T')[0],
          endDate: null,
          status: 'pending'
        }),
      });

      if (response.ok) {
        alert('New position added successfully!');
        closeAddPositionModal();
        fetchAssignments();
      } else {
        const result = await response.json();
        alert(`Error: ${result.message || 'Failed to add position'}`);
      }
    } catch (error) {
      console.error('Error adding position:', error);
      alert('Failed to add position');
    }
  };

  // Push to Planner functions
  const openPushModal = () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    setPushForm({
      startDate: today.toISOString().split('T')[0],
      endDate: nextMonth.toISOString().split('T')[0],
      applyRotation: true
    });
    setShowPushModal(true);
  };

  const closePushModal = () => {
    setShowPushModal(false);
    setPushForm({
      startDate: '',
      endDate: '',
      applyRotation: true
    });
  };

  const pushToPlanner = async () => {
    if (!pushForm.startDate || !pushForm.endDate) {
      alert('Please select start and end dates');
      return;
    }

    setPushLoading(true);
    try {
      const response = await fetch('/api/push-to-planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignments: assignments.filter(a => a.status === 'active'),
          startDate: pushForm.startDate,
          endDate: pushForm.endDate,
          applyRotation: pushForm.applyRotation
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully pushed ${result.schedulesCreated} schedules to planner!`);
        closePushModal();
      } else {
        const result = await response.json();
        alert(`Error: ${result.message || 'Failed to push to planner'}`);
      }
    } catch (error) {
      console.error('Error pushing to planner:', error);
      alert('Failed to push to planner');
    } finally {
      setPushLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <div className="flex space-x-3">
            <button
              onClick={openPushModal}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
            >
              <Upload className="mr-2 h-4 w-4" />
              Push to Planner
            </button>
            <Link
              href="/create-client"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create New Assignment
            </Link>
          </div>
        </div>

        {/* Group assignments by client, then by site, then by shift */}
        <div className="space-y-6">
          {Object.entries(
            assignments.reduce((acc, assignment) => {
              const clientKey = `${assignment.clientCode} - ${assignment.client?.companyName || 'Unknown'}`;
              if (!acc[clientKey]) {
                acc[clientKey] = {};
              }
              
              const siteKey = assignment.siteId;
              if (!acc[clientKey][siteKey]) {
                acc[clientKey][siteKey] = {
                  dayShift: [],
                  nightShift: []
                };
              }
              
              const isNightShift = assignment.shiftId.toLowerCase().includes('night') || 
                                  assignment.shiftId.toLowerCase().includes('evening');
              
              if (isNightShift) {
                acc[clientKey][siteKey].nightShift.push(assignment);
              } else {
                acc[clientKey][siteKey].dayShift.push(assignment);
              }
              
              return acc;
            }, {} as Record<string, Record<string, { dayShift: Assignment[], nightShift: Assignment[] }>>)
          ).map(([clientName, sites]) => (
            <div key={clientName} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Client Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{clientName}</h2>
                <p className="text-sm text-gray-500">
                  {Object.values(sites).reduce((total, site) => total + site.dayShift.length + site.nightShift.length, 0)} assignments
                </p>
              </div>

              {/* Sites */}
              <div className="p-6 space-y-6">
                {Object.entries(sites).map(([siteName, shifts]) => {
                  // Extract clientCode and siteId from the first assignment in this site
                  const firstAssignment = [...shifts.dayShift, ...shifts.nightShift][0];
                  const clientCode = firstAssignment?.clientCode || '';
                  const siteId = firstAssignment?.siteId || siteName;
                  
                  return (
                  <div key={siteName} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Site Header */}
                    <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="text-md font-medium text-gray-900">{siteName}</h3>
                    </div>

                    {/* Day and Night Shifts Side by Side */}
                    <div className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Day Shift - Left Side */}
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                              <h4 className="text-md font-semibold text-gray-900">Day Shift</h4>
                              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                {shifts.dayShift.length} assigned
                              </span>
                            </div>
                            <button
                              onClick={() => openAddPositionModal(clientCode, siteId, 'Day Shift')}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                            >
                              + Add Position
                            </button>
                          </div>
                          
                          {shifts.dayShift.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No day shift assignments</p>
                          ) : (
                            <div className="space-y-2">
                              {shifts.dayShift.map((assignment) => (
                                <div key={assignment._id} className="bg-white rounded-md p-3 border border-yellow-200">
                                  {editingAssignment === assignment._id ? (
                                    // Editing Mode
                                    <div className="space-y-3">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                          {assignment.assignmentId}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded ${getDesignationBadge(assignment.designation)}`}>
                                          {getDesignationDisplay(assignment.designation)}
                                        </span>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Employee</label>
                                        <select
                                          value={editForm.employeeId}
                                          onChange={(e) => setEditForm({...editForm, employeeId: e.target.value})}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                                        >
                                          <option value="">Select Employee</option>
                                          {getEmployeesByDesignation(assignment.designation).map((emp) => (
                                            <option key={emp._id} value={emp.employeeId}>
                                              {emp.name} ({emp.employeeId})
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      
                                      <div className="flex justify-end space-x-2 pt-2">
                                        <button
                                          onClick={cancelEditing}
                                          className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => saveAssignmentChanges(assignment._id)}
                                          className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    // View Mode
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {assignment.assignmentId}
                                          </span>
                                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                                            {assignment.status}
                                          </span>
                                          <span className={`text-xs px-2 py-1 rounded ${getDesignationBadge(assignment.designation)}`}>
                                            {getDesignationDisplay(assignment.designation)}
                                          </span>
                                        </div>
                                        
                                        <div className="text-sm">
                                          <div className="text-gray-900">
                                            {assignment.employee?.name || (assignment.status === 'pending' ? 'Unassigned' : 'N/A')}
                                          </div>
                                          <div className="text-gray-500">
                                            {assignment.employee?.designation || (assignment.status === 'pending' ? 'Awaiting assignment' : 'N/A')}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex space-x-1 ml-2">
                                        <button
                                          onClick={() => startEditingAssignment(assignment)}
                                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                        >
                                          Edit
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button
                                          onClick={() => deleteAssignment(assignment._id)}
                                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                                        >
                                          Delete
                                        </button>
                                      </div>
                      </div>
                                  )}
                      </div>
                              ))}
                      </div>
                          )}
                      </div>

                        {/* Night Shift - Right Side */}
                        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-indigo-500 rounded-full mr-2"></div>
                              <h4 className="text-md font-semibold text-gray-900">Night Shift</h4>
                              <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                                {shifts.nightShift.length} assigned
                              </span>
                      </div>
                            <button
                              onClick={() => openAddPositionModal(clientCode, siteId, 'Night Shift')}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                            >
                              + Add Position
                            </button>
                      </div>
                          
                          {shifts.nightShift.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No night shift assignments</p>
                          ) : (
                            <div className="space-y-2">
                              {shifts.nightShift.map((assignment) => (
                                <div key={assignment._id} className="bg-white rounded-md p-3 border border-indigo-200">
                                  {editingAssignment === assignment._id ? (
                                    // Editing Mode
                                    <div className="space-y-3">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                          {assignment.assignmentId}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded ${getDesignationBadge(assignment.designation)}`}>
                      {getDesignationDisplay(assignment.designation)}
                                        </span>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Employee</label>
                                        <select
                                          value={editForm.employeeId}
                                          onChange={(e) => setEditForm({...editForm, employeeId: e.target.value})}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                                        >
                                          <option value="">Select Employee</option>
                                          {getEmployeesByDesignation(assignment.designation).map((emp) => (
                                            <option key={emp._id} value={emp.employeeId}>
                                              {emp.name} ({emp.employeeId})
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      
                                      <div className="flex justify-end space-x-2 pt-2">
                                        <button
                                          onClick={cancelEditing}
                                          className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => saveAssignmentChanges(assignment._id)}
                                          className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    // View Mode
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                            {assignment.assignmentId}
                                          </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                                          <span className={`text-xs px-2 py-1 rounded ${getDesignationBadge(assignment.designation)}`}>
                                            {getDesignationDisplay(assignment.designation)}
                                          </span>
                                        </div>
                                        
                                        <div className="text-sm">
                                          <div className="text-gray-900">
                                            {assignment.employee?.name || (assignment.status === 'pending' ? 'Unassigned' : 'N/A')}
                                          </div>
                                          <div className="text-gray-500">
                                            {assignment.employee?.designation || (assignment.status === 'pending' ? 'Awaiting assignment' : 'N/A')}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex space-x-1 ml-2">
                                        <button
                                          onClick={() => startEditingAssignment(assignment)}
                                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Edit
                                        </button>
                                        <span className="text-gray-300">|</span>
                      <button
                                          onClick={() => deleteAssignment(assignment._id)}
                                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Delete
                      </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
          </div>
          
          {assignments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No assignments found</p>
              <Link
                href="/create-client"
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
              Create your first client
              </Link>
            </div>
          )}

        {/* Add Position Modal */}
        {showAddPositionModal && addPositionContext && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Position</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client: {addPositionContext.clientCode}
                  </label>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site: {addPositionContext.siteId}
                  </label>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift: {addPositionContext.shiftId}
                  </label>
          </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <select
                    value={addPositionForm.designation}
                    onChange={(e) => setAddPositionForm({...addPositionForm, designation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Designation</option>
                    <option value="SO_ASO">SO/ASO</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="SECURITY_GUARD">Security Guard</option>
                  </select>
            </div>
          </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeAddPositionModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewPosition}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Position
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Push to Planner Modal */}
        {showPushModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ArrowRight className="mr-2 h-5 w-5 text-green-600" />
                Push to Monthly Planner
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={pushForm.startDate}
                    onChange={(e) => setPushForm({...pushForm, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={pushForm.endDate}
                    onChange={(e) => setPushForm({...pushForm, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="applyRotation"
                    checked={pushForm.applyRotation}
                    onChange={(e) => setPushForm({...pushForm, applyRotation: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="applyRotation" className="ml-2 block text-sm text-gray-700">
                    Apply rotation pattern (Day shift: 24hrs on 6th day, Night shift: off on Sunday)
                  </label>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Active assignments:</strong> {assignments.filter(a => a.status === 'active').length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Only active assignments will be pushed to the planner
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closePushModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={pushLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={pushToPlanner}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  disabled={pushLoading}
                >
                  {pushLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Pushing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Push to Planner
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}