import { motion } from 'motion/react';
import { LogIn, Shield, Swords, Trophy, Mail, Lock } from 'lucide-react';
import { useState } from 'react';

interface LoginProps {
  onGoogleLogin: () => void;
  onEmailLogin: (e: React.FormEvent) => void;
  onEmailSignup: (e: React.FormEvent) => void;
}

export function Login({ onGoogleLogin, onEmailLogin, onEmailSignup }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-blue-950 flex flex-col items-center justify-center text-white p-6">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[128px]" />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 text-center max-w-md w-full"
      >
        <h1 className="text-6xl font-black mb-4 tracking-tighter uppercase italic">
          Island <span className="text-blue-400">Empires</span>
        </h1>
        <p className="text-lg text-blue-200/60 mb-8 font-medium">
          Build your empire, conquer the seas.
        </p>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl mb-8">
          <form onSubmit={isSignup ? onEmailSignup : onEmailLogin} className="flex flex-col gap-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              {isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-xs text-white/30 font-bold uppercase">OR</span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <button
            onClick={onGoogleLogin}
            className="w-full bg-white text-blue-950 font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
          >
            <LogIn size={20} />
            CONTINUE WITH GOOGLE
          </button>

          <p className="mt-6 text-sm text-white/40">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsSignup(!isSignup)}
              className="text-blue-400 font-bold hover:underline"
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 opacity-60">
          <Feature icon={Shield} title="Defend" />
          <Feature icon={Swords} title="Conquer" />
          <Feature icon={Trophy} title="Rank" />
        </div>
      </motion.div>
    </div>
  );
}

function Feature({ icon: Icon, title }: { icon: any, title: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
        <Icon className="text-blue-400" size={20} />
      </div>
      <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">{title}</span>
    </div>
  );
}
