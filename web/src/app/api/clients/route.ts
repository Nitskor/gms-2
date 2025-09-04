import { MongoClient } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

// Generate unique client ID
async function generateClientId() {
    await client.connect();
    const database = client.db('gms');
    const collection = database.collection('clients');
    
    const lastClient = await collection
      .find({ clientCode: { $exists: true } }) // Only find clients that have clientCode
      .sort({ clientCode: -1 })
      .limit(1)
      .toArray();
    
    if (lastClient.length === 0) {
      return 'CLI-001';
    }
    
    const lastId = lastClient[0].clientCode;
    if (!lastId || typeof lastId !== 'string') {
      return 'CLI-001';
    }
    
    const lastNumber = parseInt(lastId.split('-')[1]);
    const newNumber = lastNumber + 1;
    return `CLI-${newNumber.toString().padStart(3, '0')}`;
  }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== RECEIVED CLIENT DATA ===');
    console.log('Company Name:', body.companyName);
    console.log('Billing Date:', body.billingDate);
    console.log('Billing Amount:', body.billingAmount);
    console.log('Post Sites:', body.postSites);
    console.log('=== END DATA ===');
    console.log('Received client data:', body);
    
    await client.connect();
    const database = client.db('gms');
    const collection = database.collection('clients');
    
    // Generate client ID
    const clientCode = await generateClientId();
    
    // Clean up postSites structure
    const cleanPostSites = body.postSites?.map((site: any, siteIndex: number) => ({
      siteId: `SITE-${(siteIndex + 1).toString().padStart(3, '0')}`,
      name: site.name,
      address: site.address || '',
      shifts: site.shifts?.map((shift: any, shiftIndex: number) => ({
        shiftId: `SHIFT-${(shiftIndex + 1).toString().padStart(3, '0')}`,
        shiftName: shift.shiftName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        patrollingRequired: shift.patrollingRequired || false,
        requiredStaff: {
          SO_ASO: shift.soAsoCount || 0,
          SUPERVISOR: shift.supervisorCount || 0,
          SECURITY_GUARD: shift.securityGuardCount || 0
        }
      })) || []
    })) || [];
    
    // Create client document
    const clientDoc = {
      clientCode,
      companyName: body.companyName,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      address: body.address,
      contractDates: body.contractDates,
      billingDate: new Date(body.billingDate),
      billingAmount: parseFloat(body.billingAmount),
      managementTeam: {
        generalManager: body.managementTeam?.generalManager || '',
        fieldOfficer: body.managementTeam?.fieldOfficer || '',
        adminInCharge: body.managementTeam?.adminInCharge || ''
      },
      postSites: cleanPostSites,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(clientDoc);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      clientCode: clientCode
    });
    
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ 
      error: 'Failed to create client',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function GET() {
  try {
    await client.connect();
    const database = client.db('gms');
    const collection = database.collection('clients');
    
    const clients = await collection.find({}).toArray();
    return NextResponse.json(clients);
    
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch clients' 
    }, { status: 500 });
  } finally {
    await client.close();
  }
}