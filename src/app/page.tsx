import { LogOutButton } from '@/auth/nextjs/components/LogOutButton';
import { SignInForm } from '@/auth/nextjs/components/SignInForm';
import { SignUpForm } from '@/auth/nextjs/components/SignUpForm';
import { getCurrentUser } from '@/auth/nextjs/currentUser';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AppError } from '@/lib/appError';
import { empty } from '@/lib/empty';
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect, RedirectType } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Welcome to Inventra',
  description: 'Inventra the simplest, yet modern inventory management system',
};

export default async function HomePage() {
  const fullUser = await getCurrentUser({ withFullUser: true });
  if (fullUser instanceof AppError) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center p-4 pt-10">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>User: Some error happened</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  if ( ! empty( fullUser ) ) {
    redirect('/admin', RedirectType.push)
  }

  return (
    <>
      <Header />
      <div className="flex items-center justify-center p-4 pt-10">
        {fullUser == null ? (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Welcome</CardTitle>
              {/* <CardDescription>Please sign in or create an account</CardDescription> */}
              <CardDescription>Please sign in</CardDescription>
            </CardHeader>

            <CardContent>
                  <SignInForm />
              {/* <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Log In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-4">
                  <SignInForm />
                </TabsContent>

                <TabsContent value="signup" className="mt-4">
                  <SignUpForm />
                </TabsContent>
              </Tabs> */}
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>
                User: {fullUser.firstName} {fullUser.lastName}
              </CardTitle>
              <CardDescription>Role: {fullUser.role}</CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-4">
              <Link href="/private">
                <Button variant="outline">Private Page</Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline">Admin Page</Button>
              </Link>
              <LogOutButton />
            </CardFooter>
          </Card>
        )}
      </div>
    </>
  );
}
