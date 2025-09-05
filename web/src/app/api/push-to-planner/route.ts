import { MongoClient } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

const uri = process.env.MONGODB_URI!;

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
    name: string;
    designation: string;
    phone?: string;
  };
  client?: {
    companyName: string;
    contactPerson?: string;
  };
}

interface Schedule {
  assignmentId: string;
  employeeId: string;
  clientCode: string;
  siteId: string;
  shiftId: string;
  designation: string;
  date: Date;
  scheduleType: 'normal' | 'extended' | 'weekly_off';
  status: string;
  employee?: {
    name: string;
    designation: string;
    phone?: string;
  };
  client?: {
    companyName: string;
    contactPerson?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Improved rotation logic implementation
function applyRotationLogic(assignments: Assignment[], startDate: string, endDate: string): Schedule[] {
  const schedules: Schedule[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Group assignments by employee (only one assignment per employee to avoid duplicates)
  const employeeAssignments = new Map();
  
  assignments.forEach(assignment => {
    if (!assignment.employeeId) return;
    
    // Only keep the first assignment for each employee to avoid duplicates
    if (!employeeAssignments.has(assignment.employeeId)) {
      employeeAssignments.set(assignment.employeeId, assignment);
    }
  });
  
  // Apply rotation pattern for each employee
  employeeAssignments.forEach((assignment) => {
    const shiftType = getShiftType(assignment.shiftId);
    const currentDate = new Date(start);
    let weekCount = 0;
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      let scheduleType = 'normal';
      let isWorking = true;
      let currentShiftType = shiftType;
      
      // Determine current shift type based on week rotation
      // Rotation happens after the Sunday transition, not during it
      if (weekCount % 2 === 1 && dayOfWeek !== 0) {
        // Every other week, rotate shift type (but not on Sunday)
        currentShiftType = shiftType === 'day' ? 'night' : 'day';
      }
      
      if (currentShiftType === 'day') {
        // Day shift: Works Sunday-Saturday (7 days), then gets 24hr break
        if (dayOfWeek === 6) { // Saturday
          scheduleType = 'normal'; // Regular day shift on Saturday
        } else if (dayOfWeek === 0 && weekCount % 2 === 1) { // Sunday after odd week
          isWorking = false; // 24hr break (Saturday evening to Sunday evening)
        }
      } else if (currentShiftType === 'night') {
        // Night shift: Works Sunday-Saturday (7 days), then does 24hr shift
        if (dayOfWeek === 6) { // Saturday
          scheduleType = 'extended'; // 24hr shift (Saturday night to Sunday day)
        } else if (dayOfWeek === 0 && weekCount % 2 === 1) { // Sunday after odd week
          scheduleType = 'extended'; // Continue 24hr shift from Saturday night (now day shift)
        }
      }
      
      if (isWorking) {
        // For 24hr shifts, show both day and night shift information
        let shiftId = currentShiftType === 'day' ? 'Day Shift' : 'Night Shift';
        if (scheduleType === 'extended') {
          // 24hr shift: show the shift type with 24hr indicator
          if (dayOfWeek === 6) { // Saturday - starting 24hr shift
            shiftId = currentShiftType === 'night' ? 'Night Shift (24hr)' : 'Day Shift (24hr)';
          } else if (dayOfWeek === 0 && weekCount % 2 === 1) { // Sunday - continuing 24hr shift
            shiftId = 'Day Shift (24hr)'; // Always becomes day shift on Sunday
          }
        }
        
        schedules.push({
          assignmentId: assignment.assignmentId,
          employeeId: assignment.employeeId,
          clientCode: assignment.clientCode,
          siteId: assignment.siteId,
          shiftId: shiftId,
          designation: assignment.designation,
          date: new Date(currentDate),
          scheduleType: scheduleType,
          status: 'scheduled',
          employee: assignment.employee,
          client: assignment.client,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Increment week count when we reach Sunday
      if (dayOfWeek === 6) { // Saturday
        weekCount++;
      }
    }
  });
  
  return schedules;
}

// Helper function to determine shift type
function getShiftType(shiftName: string): 'day' | 'night' {
  const lowerShift = shiftName.toLowerCase();
  if (lowerShift.includes('night') || lowerShift.includes('evening')) {
    return 'night';
  }
  return 'day';
}


export async function POST(request: NextRequest) {
  const client = new MongoClient(uri);
  try {
    const body = await request.json();
    console.log('Received push to planner data:', body);
    
    const { assignments, startDate, endDate, applyRotation } = body;
    
    if (!assignments || !startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Missing required fields: assignments, startDate, endDate' 
      }, { status: 400 });
    }
    
    await client.connect();
    const database = client.db('gms');
    
    // Create monthly_schedules collection if it doesn't exist
    const monthlySchedulesCollection = database.collection('monthly_schedules');
    
    // Clear existing schedules for the date range to avoid duplicates
    await monthlySchedulesCollection.deleteMany({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    
    let schedules: Schedule[];
    
    if (applyRotation) {
      // Apply rotation logic
      schedules = applyRotationLogic(assignments, startDate, endDate);
    } else {
      // Simple daily schedule without rotation
      schedules = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      assignments.forEach(assignment => {
        if (!assignment.employeeId) return;
        
        const currentDate = new Date(start);
        while (currentDate <= end) {
          schedules.push({
            assignmentId: assignment.assignmentId,
            employeeId: assignment.employeeId,
            clientCode: assignment.clientCode,
            siteId: assignment.siteId,
            shiftId: assignment.shiftId,
            designation: assignment.designation,
            date: new Date(currentDate),
            scheduleType: 'normal',
            status: 'scheduled',
            employee: assignment.employee,
            client: assignment.client,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    }
    
    // Insert schedules into database
    if (schedules.length > 0) {
      await monthlySchedulesCollection.insertMany(schedules);
    }
    
    return NextResponse.json({ 
      success: true, 
      schedulesCreated: schedules.length,
      message: `Successfully created ${schedules.length} schedule entries`
    });
    
  } catch (error) {
    console.error('Error pushing to planner:', error);
    return NextResponse.json({ 
      error: 'Failed to push to planner',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await client.close();
  }
}

// GET endpoint to fetch monthly schedules (for the monthly planner)
export async function GET(request: NextRequest) {
  const client = new MongoClient(uri);
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    await client.connect();
    const database = client.db('gms');
    const monthlySchedulesCollection = database.collection('monthly_schedules');
    
    // Build query
    const query: { date?: { $gte: Date; $lte: Date } } = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get schedules
    const schedules = await monthlySchedulesCollection.find(query).toArray();
    
    // Transform to match the Assignment interface expected by monthly planner
    const transformedSchedules = schedules.map(schedule => ({
      _id: schedule._id,
      assignmentId: schedule.assignmentId,
      employeeId: schedule.employeeId,
      clientCode: schedule.clientCode,
      siteId: schedule.siteId,
      shiftId: schedule.shiftId,
      designation: schedule.designation,
      startDate: schedule.date.toISOString().split('T')[0],
      endDate: schedule.date.toISOString().split('T')[0], // Same day for daily schedules
      status: schedule.status,
      scheduleType: schedule.scheduleType,
      employee: schedule.employee ? {
        _id: schedule.employee._id || '',
        employeeId: schedule.employeeId,
        name: schedule.employee.name,
        designation: schedule.employee.designation
      } : undefined,
      client: schedule.client ? {
        _id: schedule.client._id || '',
        clientCode: schedule.clientCode,
        companyName: schedule.client.companyName
      } : undefined
    }));
    
    return NextResponse.json(transformedSchedules);
    
  } catch (error) {
    console.error('Error fetching monthly schedules:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch monthly schedules' 
    }, { status: 500 });
  } finally {
    await client.close();
  }
}
