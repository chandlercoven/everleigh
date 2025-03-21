import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// Configure authentication options
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // In a production environment, replace this with a real database lookup
        // This is a simplified example for demonstration purposes
        const users = [
          { id: "1", name: "Admin", email: "admin@example.com", password: "password" }
        ];
        
        const user = users.find(user => user.email === credentials.email);
        
        if (user && user.password === credentials.password) {
          return { id: user.id, name: user.name, email: user.email };
        }
        
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Export the NextAuth handler
export default NextAuth(authOptions); 