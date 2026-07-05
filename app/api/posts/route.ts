import { NextResponse } from "next/server"; // Next.js ke server response functions ko import kar rahe hain.
import { auth } from "@clerk/nextjs/server"; // Clerk security check se logged-in user ki authentication get karne ke liye.
import prisma from "@/lib/prisma"; // Database queries chalane ke liye Prisma client import kiya.
import redis from "@/lib/redis"; // Redis cache client use karne ke liye import kiya.
import { invalidateProfileCache } from "@/lib/profile-service"; // Redis mein user profile cache delete karne ka custom handler function.
import crypto from "crypto"; // Node.js ka built-in module unique UUIDs generate karne ke liye.

// POST request ko handle karne ke liye function jo naya post create karega
export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const { userId } = await auth(); // Clerk middleware se current user ki clerk ID fetch kar rahe hain.
    if (!userId) {
      // Agar user login nahi hai toh status 401 (Unauthorized) ke sath error return karenge.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json(); // Incoming request body ko read karke JSON object mein convert kar rahe hain.
    const { caption, mediaUrl, location } = body; // Body objects mein se caption, media file URL aur location get kiya.

    if (!caption || typeof caption !== "string") {
      // Agar caption empty hai ya string format mein nahi hai toh 400 Bad Request error return karenge.
      return NextResponse.json(
        { error: "Caption is required and must be a string" },
        { status: 400 }
      );
    }

    // 3. Extract hashtags (e.g. #happy #vibes) from caption
    // Regular expression ke help se caption se saare hashtags (jaise #travel) extract karenge.
    const hashtags = (caption.match(/#[a-zA-Z0-9_]+/g) || []).map((tag) =>
      tag.substring(1).toLowerCase().trim() // '#' symbol hatane ke liye substring use kiya aur lowecase kiya takki tags standardize rahein.
    );
    
    // duplicate tags remove karne ke liye Set data structure use kiya aur empty tags ko filter kiya.
    const uniqueTags = Array.from(new Set(hashtags)).filter(Boolean);

    // 4. Create tags connectOrCreate objects for Prisma
    // Har ek unique tag ke liye Prisma connectOrCreate array query construct kar rahe hain.
    const tagsConnectOrCreate = uniqueTags.map((tagName) => ({
      where: { name: tagName }, // Agar tag pehle se save hai toh usko connect karenge.
      create: {
        id: crypto.randomUUID(), // Agar tag database mein nahi hai toh naya random UUID id banayenge.
        name: tagName,           // Tag name set karenge.
        updatedAt: new Date(),   // Naye tag ka update time.
      },
    }));

    // 5. Database execution (Sequentially query run karenge Neon pooler compatibility ke liye)
    // 5.1 Create Post record
    // Database mein post record save kar rahe hain.
    const newPost = await prisma.post.create({
      data: {
        id: crypto.randomUUID(),      // Post ke liye globally unique ID generate kiya.
        caption,                      // Post ka text description.
        mediaUrl: mediaUrl || null,   // Media link (image/video path) set karenge, agar optional data missing hai toh NULL save karenge.
        location: location || null,   // Location name link karenge, default null.
        authorId: userId,             // Post author ki clerk ID pass kar rahe hain.
        updatedAt: new Date(),        // Date object se current time store kiya.
        Tag: {
          connectOrCreate: tagsConnectOrCreate, // Tags connect ya insert karenge jo caption se nikale the.
        },
      },
      include: {
        Tag: true, // Post retrieve/save output response ke andar tagged data array link ho jayega.
      },
    });

    // 5.2 Increment user posts count
    // Post share hone ke baad database user table mein users ke total post count ko 1 point se increase karenge.
    await prisma.user.update({
      where: { id: userId }, // User ki matching ID select kiya.
      data: {
        postsCount: {
          increment: 1, // postsCount database field ko 1 increment kiya.
        },
      },
    });

    // 6. Invalidate profile cache in Redis so updates show immediately
    // User profile page cache refresh karne ke liye database se username get karenge.
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    if (dbUser?.username) {
      // Profile cache helper se purana profile details cache clear karenge taki naya post/counter count display ho ske.
      await invalidateProfileCache(dbUser.username);
    }

    // 7. Invalidate Feed & Reels paginated cache keys in Redis
    // Feed and reels page ke cached results clear karenge taki naya post feed main turant aa jaye.
    try {
      const keys = await redis.keys("posts:cache:*"); // posts:cache: se suru hone wale saare keys query kiye.
      if (keys.length > 0) {
        await redis.del(...keys); // Jo keys select hue unhe Redis memory se delete kar diya.
        console.log(`[API_POSTS_POST] Invalidated ${keys.length} feed/reel caches.`);
      }
    } catch (cacheError) {
      console.error("[API_POSTS_POST] Error invalidating feed cache keys:", cacheError);
    }

    // Post creation process complete, success log likhenge aur naye post details 201 Created response me return kar denge.
    console.log(`[API_POSTS] Successfully created post for userId: ${userId}, postId: ${newPost.id}`);
    return NextResponse.json({ success: true, post: newPost }, { status: 201 });
  } catch (error: any) {
    // Agar operations mein error aati hai toh server logs pe error details save karenge aur 500 code ke sath client ko fail response denge.
    console.error("[API_POSTS] Error creating post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}

// GET request ko handle karne ke liye route jo feed posts ya video reels fetch karega pagination aur caching ke sath
export async function GET(request: Request) {
  try {
    // Request URL parsing parameters
    const { searchParams } = new URL(request.url); // Request url se parameters access kar rahe hain.
    const type = searchParams.get("type") || "feed"; // Feed type extract kiya (options are 'feed' or 'reels'), default 'feed'.
    // parseInt() function string text (jaise "1") ko math ke integer/number (1) mein convert karta hai.
    // 10 parameter (radix) Javascript ko batata hai ki hum Decimal base-10 number system use kar rahe hain,
    // taaki "09" jaise number octal (base-8) mein convert na ho jayein aur ESLint rules satisfy rahein.
    const page = parseInt(searchParams.get("page") || "1", 10); // Page number string ko decimal integer mein convert kiya, default 1.
    const limit = parseInt(searchParams.get("limit") || "10", 10); // Page size limit string ko decimal integer mein convert kiya, default 10.

    // safePage Calculation: Math.max(1, page) ensure karta hai ki page hamesha 1 ya usse bada ho.
    // Agar koi user page= -5 ya 0 bhejta hai, toh yeh use automatically 1 kar dega (Negative page correction).
    const safePage = Math.max(1, page);

    // safeLimit Calculation: Math.min(50, limit) ensure karta hai ki maximum 50 posts hi load hon.
    // Agar user limit= 1000 bhejega toh Math.min(50, 1000) return karega 50 (Server crash se protection).
    // Math.max(1, ...) ensure karta hai ki limit 0 ya negative na ho (Min 1 record load hona chahiye).
    const safeLimit = Math.max(1, Math.min(50, limit));

    // skip (Offset) Calculation: skip = (page - 1) * limit
    // Jaise Page 3 ke liye: (3 - 1) * 10 = 20. Matlab pehle 20 posts skip (bypassed) karke Post 21 se read start karenge.
    const skip = (safePage - 1) * safeLimit;

    // Har unique query config (type, page aur limit) ke basis par ek single unique cache Key string generate karenge.
    const cacheKey = `posts:cache:${type}:page:${safePage}:${safeLimit}`;

    // 1. Try fetching from Redis Cache
    try {
      const cachedData = await redis.get(cacheKey); // Cache key matching details Redis me check kar rahe hain.
      if (cachedData) {
        // Agar Redis me content match ho jata hai toh direct wahi details parsing kar ke 200 response return karenge. (Fast load!)
        console.log(`[API_POSTS_GET] Cache HIT for key: ${cacheKey}`);
        return NextResponse.json(JSON.parse(cachedData), { status: 200 });
      }
    } catch (cacheError) {
      console.error("[API_POSTS_GET] Redis cache read error:", cacheError);
    }

    // Agar cache miss ho jata hai toh database se fresh data fetch karenge.
    console.log(`[API_POSTS_GET] Cache MISS for key: ${cacheKey}. Fetching from Postgres.`);

    // 2. Query Postgres based on feed/reels type
    // Active aur report nahi ki gayi post records select karenge.
    const whereCondition: any = {
      isDeleted: false,
      isReported: false,
    };

    if (type === "reels") {
      // Reels filter logic: Agar reels filter type true hai toh hum specific video extensions check karenge mediaUrl column ke andar.
      whereCondition.OR = [
        { mediaUrl: { contains: ".mp4" } },
        { mediaUrl: { contains: ".mov" } },
        { mediaUrl: { contains: ".webm" } },
        { mediaUrl: { contains: ".ogg" } },
        { mediaUrl: { contains: ".m4v" } },
      ];
    }

    // Database se post items order/skip filter limit run kiya.
    const posts = await prisma.post.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: "desc", // Latest shared post sabse upar feed hogi.
      },
      skip: skip,          // Offset parameters.
      take: safeLimit,     // Limit parameters.
      include: {
        User: {            // Post author details select query.
          select: {
            name: true,
            username: true,
            imageUrl: true,
          },
        },
        Like: {
          select: {
            userId: true,
          },
        },
      },
    });

    // Total counts retrieve kar rahe hain user feed details scroll finish limit detect karne ke liye.
    const totalCount = await prisma.post.count({ where: whereCondition });
    // Boolean flag check karega ki next database pages exist karte hain ya nahi loading triggers key ke liye.
    const hasMore = skip + posts.length < totalCount;

    // Response structure output data prepare kiya.
    const result = {
      posts,
      page: safePage,
      limit: safeLimit,
      totalCount,
      hasMore,
    };

    // 3. Store result in Redis Cache (30 seconds TTL set kiya)
    try {
      // Performance fast rakhne ke liye raw JSON output 30 seconds expiration memory key ke sath Redis me save karenge.
      await redis.set(cacheKey, JSON.stringify(result), "EX", 30);
      console.log(`[API_POSTS_GET] Stored results in Redis for key: ${cacheKey}`);
    } catch (cacheError) {
      console.error("[API_POSTS_GET] Redis cache write error:", cacheError);
    }

    // Complete response JSON return package code 200.
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    // Database failure ya server issue catch karenge.
    console.error("[API_POSTS_GET] General error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
