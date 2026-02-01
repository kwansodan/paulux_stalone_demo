import { SESSION_MAX_DURATION_MS, SESSION_REFRESH_INTERVAL_MS } from "@/constants";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/utils/crypto";


class AuthRepository {

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
      }
    })
  }

  async createSession(sessionToken: string, userId: string) {
    const sessionId = hashToken(sessionToken);

    const session = {
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + SESSION_MAX_DURATION_MS),
    };

    await prisma.session.create({
      data: session,
    });
    console.log("Created Session", sessionId)
    return session;
  };


  async invalidateSession(sessionId: string) {
    await prisma.session.delete({
      where: {
        id: sessionId,
      },
    });
  };

  async validateSession(sessionToken: string) {
    const sessionId = hashToken(sessionToken);

    const result = await prisma.session.findUnique({
      where: {
        id: sessionId
      },
      include: {
        user: true
      }
    })

    if (!result) {
      return { session: null, user: null }
    }

    const { user, ...session } = result;

    if (Date.now() >= session.expiresAt.getTime()) {
      await prisma.session.delete({
        where: {
          id: sessionId
        }
      })

      return { session: null, user: null }
    }


    if (Date.now() >= session.expiresAt.getTime() - SESSION_REFRESH_INTERVAL_MS) {
      session.expiresAt = new Date(Date.now() + SESSION_MAX_DURATION_MS);

      await prisma.session.update({
        where: {
          id: sessionId
        },
        data: {
          expiresAt: session.expiresAt
        }
      })
    }

    return { session, user }
  }

}


export const authRepository = new AuthRepository();