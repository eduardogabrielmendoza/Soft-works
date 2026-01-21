'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // Verificar que hay una sesión válida de recuperación
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Si hay sesión o si hay parámetros de recuperación en la URL
      const hasRecoveryParams = searchParams.get('type') === 'recovery' || 
                                searchParams.get('access_token') ||
                                session?.user;
      
      setIsValidSession(!!hasRecoveryParams || !!session);
    };

    // Escuchar el evento de recuperación de contraseña
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, searchParams]);

  // Validaciones de contraseña
  const passwordValidations = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    passwordsMatch: password === confirmPassword && password.length > 0,
  };

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Por favor, cumplí con todos los requisitos de la contraseña');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        if (updateError.message.includes('same as old password')) {
          setError('La nueva contraseña debe ser diferente a la anterior');
        } else {
          setError(updateError.message);
        }
        return;
      }

      setSuccess(true);
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/cuenta/perfil');
      }, 3000);
    } catch {
      setError('Ocurrió un error inesperado. Por favor, intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Estado de carga inicial
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  // Link inválido o expirado
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] pt-20">
        <div className="max-w-md mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-8 text-center shadow-sm"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-medium mb-4">Link Inválido o Expirado</h1>
            <p className="text-gray-600 mb-6">
              El link para restablecer tu contraseña ha expirado o es inválido. 
              Por favor, solicitá uno nuevo.
            </p>
            <Link
              href="/cuenta"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Éxito
  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] pt-20">
        <div className="max-w-md mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-8 text-center shadow-sm"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-medium mb-4">¡Contraseña Actualizada!</h1>
            <p className="text-gray-600 mb-2">
              Tu contraseña ha sido cambiada exitosamente.
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo a tu cuenta...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-20">
      <div className="max-w-md mx-auto px-4 py-12 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-8 shadow-sm"
        >
          <h1 className="text-2xl sm:text-3xl font-medium mb-2">
            Nueva Contraseña
          </h1>
          <p className="text-gray-600 mb-8">
            Ingresá tu nueva contraseña para tu cuenta de Softworks.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nueva contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Requisitos de contraseña */}
            <div className="space-y-2 p-4 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-3">Requisitos:</p>
              <ValidationItem 
                isValid={passwordValidations.minLength} 
                text="Mínimo 8 caracteres" 
              />
              <ValidationItem 
                isValid={passwordValidations.hasUppercase} 
                text="Al menos una mayúscula" 
              />
              <ValidationItem 
                isValid={passwordValidations.hasLowercase} 
                text="Al menos una minúscula" 
              />
              <ValidationItem 
                isValid={passwordValidations.hasNumber} 
                text="Al menos un número" 
              />
              <ValidationItem 
                isValid={passwordValidations.passwordsMatch} 
                text="Las contraseñas coinciden" 
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !isPasswordValid}
              className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/cuenta"
              className="text-sm text-gray-600 hover:text-black transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ValidationItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {isValid ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
      )}
      <span className={isValid ? 'text-green-700' : 'text-gray-600'}>{text}</span>
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
