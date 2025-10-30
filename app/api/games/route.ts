import dbConnect from '@/lib/db';
import { Game } from '@/lib/models/Game';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

interface DecodedToken extends JwtPayload {
  userId: string;
  role: string;
}

interface GameCharacter {
  name: string;
  image: string;
}

function verifyToken(request: NextRequest): DecodedToken | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return decoded;
  } catch (error) {
    throw error;
  }
}

// Helper function to normalize character data
function normalizeCharacters(data: unknown, index: number): GameCharacter[] {
  if (!data) return [];
  
  if (!Array.isArray(data)) return [];
  
  const mapped = data.map((item, i) => {
    // If it's already a proper object with name and optionally image
    if (typeof item === 'object' && item !== null && 'name' in item) {
      const obj = item as { name: string; image?: string };
      // Check if it's actually valid (not a base64 string in the name field)
      if (obj.name && !obj.name.startsWith('data:image')) {
        return {
          name: obj.name,
          image: obj.image || ''
        };
      }
    }
    
    // If it's a plain string (just a name, not an image)
    if (typeof item === 'string' && !item.startsWith('data:image')) {
      return { name: item, image: '' };
    }
    
    // If it's a base64 image string (current frontend format)
    if (typeof item === 'string' && item.startsWith('data:image')) {
      // Auto-generate a name based on position
      const type = index === 0 ? 'Friend' : 'Enemy';
      return {
        name: `${type} ${i + 1}`,
        image: item
      };
    }
    
    // If we get here, the data format is wrong
    console.warn('Invalid character data format:', typeof item, item?.toString().substring(0, 50));
    return null;
  });
  
  return mapped.filter((item): item is GameCharacter => item !== null);
}

// GET all games
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const games = await Game.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, games });
  } catch (error) {
    console.error('Get games error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new game
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    
    // Log the incoming data for debugging
    console.log('=== INCOMING DATA DEBUG ===');
    console.log('Friends type:', typeof body.friends, 'Is array:', Array.isArray(body.friends));
    if (Array.isArray(body.friends) && body.friends.length > 0) {
      console.log('First friend type:', typeof body.friends[0]);
      console.log('First friend keys:', body.friends[0] && typeof body.friends[0] === 'object' ? Object.keys(body.friends[0]) : 'N/A');
      console.log('First friend sample:', JSON.stringify(body.friends[0]).substring(0, 100));
    }
    console.log('Enemies type:', typeof body.enemies, 'Is array:', Array.isArray(body.enemies));
    if (Array.isArray(body.enemies) && body.enemies.length > 0) {
      console.log('First enemy type:', typeof body.enemies[0]);
      console.log('First enemy keys:', body.enemies[0] && typeof body.enemies[0] === 'object' ? Object.keys(body.enemies[0]) : 'N/A');
      console.log('First enemy sample:', JSON.stringify(body.enemies[0]).substring(0, 100));
    }
    console.log('=== END DEBUG ===');
    
    // Normalize friends and enemies data
    const friends = normalizeCharacters(body.friends, 0);
    const enemies = normalizeCharacters(body.enemies, 1);
    
    console.log('Normalized friends count:', friends.length);
    console.log('Normalized enemies count:', enemies.length);
    if (friends.length > 0) {
      console.log('First normalized friend:', { name: friends[0].name.substring(0, 20), hasImage: !!friends[0].image });
    }
    if (enemies.length > 0) {
      console.log('First normalized enemy:', { name: enemies[0].name.substring(0, 20), hasImage: !!enemies[0].image });
    }
    
    // Validate the normalized data
    const invalidFriend = friends.find(f => !f.name || typeof f.name !== 'string');
    if (invalidFriend) {
      return NextResponse.json(
        { error: 'Invalid friend data: each friend must have a name property' },
        { status: 400 }
      );
    }
    
    const invalidEnemy = enemies.find(e => !e.name || typeof e.name !== 'string');
    if (invalidEnemy) {
      return NextResponse.json(
        { error: 'Invalid enemy data: each enemy must have a name property' },
        { status: 400 }
      );
    }
    
    const gameData = {
      ...body,
      friends,
      enemies,
      createdBy: user.userId,
    };
    
    const game = await Game.create(gameData);
    
    return NextResponse.json({ success: true, game }, { status: 201 });
  } catch (error) {
    console.error('Create game error:', error);
    
    let errorMessage = 'Internal server error';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Extract validation errors
    if (error && typeof error === 'object' && 'errors' in error) {
      const validationErrors = (error as { errors: Record<string, { message: string }> }).errors;
      errorDetails = Object.keys(validationErrors).map(key => {
        return `${key}: ${validationErrors[key].message}`;
      }).join(', ');
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails || (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}