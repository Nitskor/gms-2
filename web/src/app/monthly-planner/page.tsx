'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, Clock, AlertTriangle } from 'lucide-react';

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
  employee?: {
    _id: string;
    employeeId: string;
    name: string;
    designation: string;
  };
  client?: {
    _id: string;
    clientCode: string;
    companyName: string;
  };
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
    }>;
  }>;
}

export default function MonthlyPlanner() {
  // Set to September 2025 to match the data
  const [currentDate, setCurrentDate] = useState(new Date('2025-09-05'));
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<string>('all');

  // Calendar navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Get calendar days for current week
  const getCalendarDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; // Sunday = 0
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, employeesRes, clientsRes] = await Promise.all([
        fetch('/api/push-to-planner'),
        fetch('/api/employees'),
        fetch('/api/clients')
      ]);

      const [assignmentsData, employeesData, clientsData] = await Promise.all([
        assignmentsRes.json(),
        employeesRes.json(),
        clientsRes.json()
      ]);

      setAssignments(assignmentsData);
      setEmployees(employeesData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter assignments based on selected client and site
  const getFilteredAssignments = () => {
    let filtered = assignments;
    
    // Filter by client
    if (selectedClient !== 'all') {
      filtered = filtered.filter(assignment => assignment.clientCode === selectedClient);
    }
    
    // Filter by site
    if (selectedSite !== 'all') {
      filtered = filtered.filter(assignment => assignment.siteId === selectedSite);
    }
    
    return filtered;
  };

  // Get assignments for a specific date, grouped by shift type and hierarchy
  const getAssignmentsForDate = (date: Date) => {
    const filteredAssignments = getFilteredAssignments();
    const currentDateStr = date.toISOString().split('T')[0]; // "2025-09-05"
    
    const dayAssignments = filteredAssignments.filter(assignment => {
      // Convert to date strings for comparison to avoid timezone issues
      const assignmentDate = assignment.startDate; // Already a string like "2025-09-05"
      
      return assignmentDate === currentDateStr;
    });

    // Group by shift type: day shifts first, then night shifts
    const dayShifts = dayAssignments.filter(assignment => getShiftType(assignment) === 'day');
    const nightShifts = dayAssignments.filter(assignment => getShiftType(assignment) === 'night');
    
    // Sort each shift group by hierarchy: SO/ASO → Supervisor → Security Guard
    const sortByHierarchy = (assignments: any[]) => {
      const hierarchy = { 'SO_ASO': 1, 'SUPERVISOR': 2, 'SECURITY_GUARD': 3 };
      return assignments.sort((a, b) => {
        const aOrder = hierarchy[a.designation as keyof typeof hierarchy] || 4;
        const bOrder = hierarchy[b.designation as keyof typeof hierarchy] || 4;
        return aOrder - bOrder;
      });
    };
    
    const sortedDayShifts = sortByHierarchy(dayShifts);
    const sortedNightShifts = sortByHierarchy(nightShifts);
    
    return [...sortedDayShifts, ...sortedNightShifts];
  };

  // Get shift type (day/night) from shift name or assignment ID
  const getShiftType = (assignment: any) => {
    // Check assignmentId first (contains "NIGHT" or "DAY")
    const assignmentId = assignment.assignmentId?.toLowerCase() || '';
    if (assignmentId.includes('night') || assignmentId.includes('evening')) {
      return 'night';
    }
    if (assignmentId.includes('day')) {
      return 'day';
    }
    
    // Fallback to shiftId
    const shiftId = assignment.shiftId?.toLowerCase() || '';
    if (shiftId.includes('night') || shiftId.includes('evening')) {
      return 'night';
    }
    
    return 'day';
  };

  // Get available sites for selected client
  const getAvailableSites = () => {
    if (selectedClient === 'all') {
      return [];
    }
    
    const client = clients.find(c => c.clientCode === selectedClient);
    if (!client) return [];
    
    return client.postSites || [];
  };

  // Get designation abbreviation
  const getDesignationAbbreviation = (designation: string) => {
    switch (designation) {
      case 'SO_ASO':
        return 'SO/ASO';
      case 'SUPERVISOR':
        return 'SUP';
      case 'SECURITY_GUARD':
        return 'GUARD';
      default:
        return designation;
    }
  };

  // Get designation color (same logic as assignments page)
  const getDesignationColor = (designation: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading weekly planner...</div>
      </div>
    );
  }

  const calendarDays = getCalendarDays();
  const weekName = `${calendarDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${calendarDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Calendar className="mr-3 h-8 w-8 text-blue-600" />
                Weekly Shift Planner
              </h1>
              <p className="mt-2 text-gray-600">
                Plan and manage staff schedules for the week
              </p>
              <div className="mt-2 flex items-center">
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  📅 Monthly Schedules Active
                </div>
                <span className="ml-2 text-xs text-gray-500">
                  Showing rotated schedules with 24hr shifts and weekly offs
                </span>
              </div>
            </div>
            
            {/* Week Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                {weekName}
              </h2>
              
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Company Filter */}
        <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
          <div className="space-y-4">
            {/* Company Selection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter by Company:</label>
                <select
                  value={selectedClient}
                  onChange={(e) => {
                    setSelectedClient(e.target.value);
                    setSelectedSite('all'); // Reset site selection when company changes
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px] text-gray-900"
                >
                  <option value="all">All Companies</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client.clientCode}>
                      {client.clientCode} - {client.companyName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Filter Summary */}
              <div className="text-sm text-gray-600">
                {selectedClient === 'all' ? (
                  <span>Showing all {assignments.length} assignments</span>
                ) : (
                  <span>
                    Showing {getFilteredAssignments().length} assignments for{' '}
                    {clients.find(c => c.clientCode === selectedClient)?.companyName || selectedClient}
                  </span>
                )}
              </div>
            </div>

            {/* Post Site Tabs */}
            {selectedClient !== 'all' && getAvailableSites().length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select Post Site:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedSite('all')}
                    className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                      selectedSite === 'all'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    All Sites
                  </button>
                  {getAvailableSites().map((site) => (
                    <button
                      key={site.siteId}
                      onClick={() => setSelectedSite(site.name)}
                      className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                        selectedSite === site.name
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {site.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
          <div className="space-y-3">
            {/* Designation Colors */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Designations:</h4>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">SO/ASO</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Supervisor</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Security Guard</span>
                </div>
              </div>
            </div>
            
            {/* Shift Types */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Shift Types:</h4>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Day Shift (D)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-slate-50 border border-slate-300 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Night Shift (N)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-50 border border-red-200 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Extended Shift (24hr)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Weekly Off</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-4 text-center text-sm font-medium text-gray-500 bg-gray-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const dayAssignments = getAssignmentsForDate(day);
              
              return (
                                                  <div
                   key={index}
                   className={`h-[400px] border-r border-b border-gray-200 ${
                     isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                   } ${isToday ? 'bg-blue-50' : ''}`}
                 >
                   {/* Date Header - Fixed */}
                   <div className={`text-sm font-medium p-3 border-b border-gray-100 ${
                     isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                   } ${isToday ? 'text-blue-600 bg-blue-50' : ''}`}>
                     <div className="font-semibold">{day.getDate()}</div>
                     <div className="text-xs text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                   </div>

                   {/* Assignments - Scrollable */}
                   <div className="h-[352px] overflow-y-auto p-3 space-y-2">
                     {dayAssignments.map((assignment) => {
                       const shiftType = getShiftType(assignment);
                       const isExtendedShift = (assignment as any).scheduleType === 'extended';
                       const isWeeklyOff = (assignment as any).scheduleType === 'weekly_off';
                       
                       return (
                         <div
                           key={assignment._id}
                           className={`text-xs p-1 rounded border ${
                             isExtendedShift 
                               ? 'bg-red-50 border-red-200'
                               : isWeeklyOff 
                               ? 'bg-green-50 border-green-200'
                               : shiftType === 'night'
                               ? 'bg-slate-50 border-slate-300'
                               : 'bg-amber-50 border-amber-200'
                           }`}
                         >
                           <div className="flex items-center justify-between">
                             <div className="font-medium truncate text-xs text-gray-900 flex-1">
                               {assignment.employee?.name || 'Unassigned'}
                             </div>
                             <div className="flex items-center space-x-1 ml-1">
                               <div className={`text-xs px-1 py-0.5 rounded ${getDesignationColor(assignment.designation)}`}>
                                 {getDesignationAbbreviation(assignment.designation)}
                               </div>
                               <div className={`text-xs px-1 py-0.5 rounded ${
                                 isExtendedShift
                                   ? 'bg-red-200 text-red-700'
                                   : isWeeklyOff
                                   ? 'bg-green-200 text-green-700'
                                   : shiftType === 'night' 
                                   ? 'bg-slate-200 text-slate-700' 
                                   : 'bg-amber-200 text-amber-700'
                               }`}>
                                 {isExtendedShift ? `${shiftType === 'night' ? 'N' : 'D'} 24H` : isWeeklyOff ? 'OFF' : (shiftType === 'night' ? 'N' : 'D')}
                               </div>
                             </div>
                           </div>
                         </div>
                       );
                     })}
                     
                     {dayAssignments.length === 0 && (
                       <div className="text-xs text-gray-400 text-center py-4">
                         {assignments.length === 0 ? 'No monthly schedules found. Use "Push to Planner" to create schedules.' : 'No assignments for this date'}
                       </div>
                     )}
                   </div>
                 </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  {selectedClient === 'all' ? 'Total Assignments' : 'Filtered Assignments'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">{getFilteredAssignments().length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active Employees</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {employees.filter(emp => emp.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active Clients</p>
                <p className="text-2xl font-semibold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pending Assignments</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {getFilteredAssignments().filter(ass => ass.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
