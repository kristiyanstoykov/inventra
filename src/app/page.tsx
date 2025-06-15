import { LogOutButton } from '@/auth/nextjs/components/LogOutButton';
import { getCurrentUser } from '@/auth/nextjs/currentUser';
import { SignInForm } from '@/auth/nextjs/components/SignInForm';
import { SignUpForm } from '@/auth/nextjs/components/SignUpForm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import Link from 'next/link';

export default async function HomePage() {
  const fullUser = await getCurrentUser({ withFullUser: true });

  return (
    <div className="container mx-auto p-4 w-[var(--content-max-width-xl)]">
      {fullUser == null ? (
        <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch">
          <Card className="w-full md:w-1/2 flex flex-col">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <SignInForm />
            </CardContent>
          </Card>
          <Card className="w-full md:w-1/2 flex flex-col">
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <SignUpForm />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="max-w-[500px] mt-4">
          <CardHeader>
            <CardTitle>
              User: {fullUser.firstName} {fullUser.lastName}
            </CardTitle>
            <CardDescription>Role: {fullUser.role}</CardDescription>
          </CardHeader>
          <CardFooter className="flex gap-4">
            <Button asChild variant="outline">
              <Link href="/private">Private Page</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">Admin Page</Link>
            </Button>
            <LogOutButton />
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
