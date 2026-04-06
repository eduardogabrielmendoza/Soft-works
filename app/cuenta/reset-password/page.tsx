'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, CheckCircle, ArrowLeft, Check, Mail } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase/client';

function ResetPasswordContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [isRecovery, setIsRecovery] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Email request state
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Listen for PASSWORD_RECOVERY event (fires when user arrives from recovery email)
  useEffect(() => {
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Also detect if user arrived with session (from callback redirect)
  useEffect(() => {
    if (!authLoading && user) {
      setIsRecovery(true);
    }
  }, [authLoading, user]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid || !passwordsMatch) return;
    setError(null);
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/cuenta'), 3000);
      }
    } catch {
      setError('Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/cuenta/reset-password')}`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setEmailSent(true);
    } catch {
      setError('Error inesperado');
    } finally {
      setEmailLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] pt-20">
        <div className="max-w-md mx-auto px-4 py-20">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-medium mb-4">¡Contraseña Actualizada!</h1>
            <p className="text-gray-600 mb-2">Tu contraseña fue cambiada exitosamente.</p>
            <p className="text-sm text-gray-500">Redirigiendo al login...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Email sent screen
  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] pt-20">
        <div className="max-w-md mx-auto px-4 py-20">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-medium mb-4">¡Revisá tu email!</h1>
            <p className="text-gray-600 mb-2">Te enviamos un link a</p>
            <p className="font-medium text-foreground mb-6">{email}</p>
            <p className="text-sm text-gray-500 mb-6">Hacé clic en el link del email para restablecer tu contraseña. Si no lo ves, revisá la carpeta de spam.</p>
            <Link href="/cuenta" className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" /> Volver al login
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // User has recovery session — show new password form
  if (isRecovery) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] pt-20">
        <div className="max-w-md mx-auto px-4 py-12 lg:py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg p-8 shadow-sm">
            <h1 className="text-2xl font-medium mb-2">Nueva Contraseña</h1>
            <p className="text-gray-600 mb-8">Elegí una nueva contraseña para tu cuenta.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50 pr-12" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <PwCheck ok={passwordChecks.length} text="Mínimo 8 caracteres" />
                    <PwCheck ok={passwordChecks.uppercase} text="Una mayúscula" />
                    <PwCheck ok={passwordChecks.lowercase} text="Una minúscula" />
                    <PwCheck ok={passwordChecks.number} text="Un número" />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
                <input type={showPassword ? 'text' : 'password'} id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 bg-white disabled:opacity-50 ${confirmPassword.length > 0 ? (passwordsMatch ? 'border-green-300 focus:ring-green-400' : 'border-red-300 focus:ring-red-400') : 'border-gray-300 focus:ring-gray-400'}`} placeholder="••••••••" />
                {confirmPassword.length > 0 && !passwordsMatch && (<p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden</p>)}
              </div>

              <button type="submit" disabled={isLoading || !isPasswordValid || !passwordsMatch}
                className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />Actualizando...</>) : 'Cambiar Contraseña'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  // Default: request email form
  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-20">
      <div className="max-w-md mx-auto px-4 py-12 lg:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-medium mb-2">Recuperar Contraseña</h1>
          <p className="text-gray-600 mb-8">Ingresá tu email y te enviaremos un link para restablecer tu contraseña.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleRequestReset} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white" placeholder="tu@email.com" />
            </div>

            <button type="submit" disabled={emailLoading}
              className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2">
              {emailLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />Enviando...</>) : 'Enviar Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/cuenta" className="text-sm text-gray-600 hover:text-black transition-colors inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Volver al login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function PwCheck({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${ok ? 'text-green-600' : 'text-gray-500'}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${ok ? 'bg-green-100' : 'bg-gray-100'}`}>
        {ok && <Check className="w-3 h-3" />}
      </div>
      {text}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F5F0] pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
