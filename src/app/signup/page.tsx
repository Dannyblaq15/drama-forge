'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AlertCircle, Loader2, Globe, User, Mail, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Backend sync happens via a separate hook or effect
      router.push('/studio');
    } catch (err: any) {
      setError(err.message || 'Failed to create an account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Backend sync happens via a separate hook or effect
      router.push('/studio');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-950/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-neutral-900/20 blur-[120px]" />

      <div className="z-10 flex w-full max-w-md flex-col items-center">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              DramaForge
            </span>
          </div>
          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 px-3 py-1 rounded-full border border-neutral-850">
            Powered by Qwen AI
          </span>
        </div>

        <Card className="w-full glass-panel border-neutral-800 shadow-2xl p-4 sm:p-8">
          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-3xl font-bold tracking-tight text-neutral-100">Create an account</CardTitle>
            <CardDescription className="text-neutral-400 text-base">
              Enter your details below to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleEmailSignUp} className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-neutral-300 sr-only">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                  <Input
                    id="name"
                    placeholder="Enter Full Name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    className="h-12 pl-11 bg-neutral-900/50 border-neutral-800 focus-visible:ring-primary/50 text-neutral-200"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-neutral-300 sr-only">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="h-12 pl-11 bg-neutral-900/50 border-neutral-800 focus-visible:ring-primary/50 text-neutral-200"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-neutral-300 sr-only">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create Password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="h-12 pl-11 bg-neutral-900/50 border-neutral-800 focus-visible:ring-primary/50 text-neutral-200"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button className="w-full h-12 text-base mt-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20" type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Sign Up
              </Button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-neutral-500">
                  Or continue with
                </span>
              </div>
            </div>

            <Button variant="outline" onClick={handleGoogleSignIn} disabled={loading} className="h-12 bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800 text-neutral-200 text-base">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              <svg role="img" viewBox="0 0 24 24" className="mr-2 h-5 w-5 fill-current">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              Google
            </Button>
            
          </CardContent>
          <CardFooter>
            <div className="text-sm text-neutral-500 text-center w-full pt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
