import dbConnect from '@/lib/db';
import { Game } from '@/lib/models/Game';
import { User } from '@/lib/models/User';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

interface DecodedToken extends JwtPayload {
  userId: string;
  role: string;
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

// Helper function to normalize character data to string array
function normalizeCharacters(data: unknown): string[] {
  if (!data) return [];
  
  if (!Array.isArray(data)) return [];
  
  return data
    .map((item) => {
      // If it's already a string
      if (typeof item === 'string') {
        return item;
      }
      
      // If it's an object with a name property
      if (typeof item === 'object' && item !== null && 'name' in item) {
        const obj = item as { name: string };
        return obj.name;
      }
      
      // Skip invalid items
      return null;
    })
    .filter((item): item is string => item !== null && item.length > 0);
}

// Helper to get user image URLs by names
async function getUserImageUrls(names: string[]): Promise<string[]> {
  if (!names.length) return [];
  await dbConnect();
  const users = await User.find({ name: { $in: names } }, 'profileImage');
  return users.map((u: any) => u.profileImage);
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
      // Normalize friends and enemies to string arrays
      const friends = normalizeCharacters(body.friends);
      const enemies = normalizeCharacters(body.enemies);
      // Get image URLs for friends and enemies
      const friendImageUrls = await getUserImageUrls(friends);
      const enemyImageUrls = await getUserImageUrls(enemies);
      const gameData = {
        title: body.title,
        startTime: body.startTime,
        startDate: body.startDate,
        durationInMinutes: body.durationInMinutes,
        price: body.price,
        friendDescription: body.friendDescription || '',
        enemyDescription: body.enemyDescription || '',
        showFriendImages: body.showFriendImages !== false,
        showEnemyImages: body.showEnemyImages !== false,
        friends,
        enemies,
        createdBy: user.userId,
      };
      const game = await Game.create(gameData);
      // Return only image URLs for friends and enemies
      return NextResponse.json({
        success: true,
        game: {
          ...game.toObject(),
          friends: friendImageUrls,
          enemies: enemyImageUrls,
        },
      }, { status: 201 });
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
  }catch(e){
    throw(e)
  }}