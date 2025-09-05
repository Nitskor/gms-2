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

// Rotation logic implementation
function applyRotationLogic(assignments: Assignment[], startDate: string, endDate: string): Schedule[] {
  const schedules: Schedule[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Group assignments by employee and shift type
  const employeeShifts = new Map();
  
  assignments.forEach(assignment => {
    if (!assignment.employeeId) return;
    
    const key = `${assignment.employeeId}|${assignment.shiftId}`;
    if (!employeeShifts.has(key)) {
      employeeShifts.set(key, []);
    }
    employeeShifts.get(key).push(assignment);
  });
  
  // Apply rotation pattern for each employee-shift combination
  employeeShifts.forEach((employeeAssignments, key) => {
    const [employeeId, shiftId] = key.split('|');
    const shiftType = getShiftType(shiftId);
    
    // Get the first assignment to extract base info
    const baseAssignment = employeeAssignments[0];
    
    // Generate schedule for the date range
    const currentDate = new Date(start);
    let dayCount = 0;
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      let scheduleType = 'normal';
      let isWorking = true;
      
      if (shiftType === 'day') {
        // Day shift rotation: Works 6 days, then 24hr shift on Saturday (6th day)
        if (dayCount % 7 === 5) { // Saturday (6th day)
          scheduleType = 'extended'; // 24-hour shift
        } else if (dayCount % 7 === 6) { // Sunday
          isWorking = false; // Day off after 24hr shift
        }
      } else if (shiftType === 'night') {
        // Night shift rotation: Works 6 days, then gets Sunday off
        if (dayCount % 7 === 6) { // Sunday
          isWorking = false; // Weekly off
        } else if (dayCount % 7 === 0) { // Monday
          // Night shift rotates to day shift on Monday
          // This will be handled by creating a separate schedule entry
        }
      }
      
      if (isWorking) {
        schedules.push({
          assignmentId: baseAssignment.assignmentId,
          employeeId: employeeId,
          clientCode: baseAssignment.clientCode,
          siteId: baseAssignment.siteId,
          shiftId: shiftId,
          designation: baseAssignment.designation,
          date: new Date(currentDate),
          scheduleType: scheduleType, // 'normal', 'extended', 'weekly_off'
          status: 'scheduled',
          employee: baseAssignment.employee,
          client: baseAssignment.client,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Handle night to day shift rotation on Monday
      if (shiftType === 'night' && dayOfWeek === 1) { // Monday
        const dayShiftId = shiftId.replace(/night|evening/gi, 'day');
        schedules.push({
          assignmentId: baseAssignment.assignmentId,
          employeeId: employeeId,
          clientCode: baseAssignment.clientCode,
          siteId: baseAssignment.siteId,
          shiftId: dayShiftId,
          designation: baseAssignment.designation,
          date: new Date(currentDate),
          scheduleType: 'normal',
          status: 'scheduled',
          employee: baseAssignment.employee,
          client: baseAssignment.client,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      dayCount++;
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
