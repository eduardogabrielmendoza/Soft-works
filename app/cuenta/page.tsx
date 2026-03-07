'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

function CuentaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/cuenta/perfil';
  
  const { signIn, signInWithGoogle, resetPassword, isLoading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu email antes de iniciar sesión');
        } else {
          setError(error.message);
        }
        return;
      }

      router.push(redirect);
    } catch {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const { error } = await resetPassword(resetEmail);
      
      if (error) {
        setError(error.message);
        return;
      }

      setResetSent(true);
    } catch {
      setError('Ocurrió un error al enviar el email');
    } finally {
      setResetLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-20 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative aspect-[4/5] rounded-lg overflow-hidden hidden lg:block"
          >
            <Image
              src="/images/mision.png"
              alt="Softworks"
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Right Form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full px-4 sm:px-0"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium mb-6 sm:mb-8 text-foreground">
              Iniciar Sesión
            </h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Google Sign In */}
            <button
              type="button"
              onClick={async () => {
                setIsGoogleLoading(true);
                setError(null);
                const { error } = await signInWithGoogle();
                if (error) {
                  setError('Error al conectar con Google. Intentá de nuevo.');
                  setIsGoogleLoading(false);
                }
              }}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-3 disabled:opacity-50 mb-6"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continuar con Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#F5F5F0] text-gray-500">o con email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-foreground focus:ring-gray-400 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Mantenerme loggeado</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(true);
                    setResetEmail(email);
                  }}
                  className="text-sm text-gray-600 hover:text-black transition-colors underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                ¿No tenés una cuenta?{' '}
                <Link href="/cuenta/registro" className="text-foreground font-medium hover:underline">
                  Registrate
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowResetModal(false);
              setResetSent(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetSent(false);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {resetSent ? (
                <div className="text-center">
                  <h3 className="text-2xl font-medium mb-4">Email Enviado</h3>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Te enviamos un email con instrucciones para restablecer tu contraseña a <strong>{resetEmail}</strong>.
                  </p>
                  <p className="text-sm text-gray-600 mb-6">
                    Si no lo ves, revisá tu carpeta de spam.
                  </p>
                  <button
                    onClick={() => {
                      setShowResetModal(false);
                      setResetSent(false);
                    }}
                    className="px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
                  >
                    Entendido
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-medium mb-4">Recuperar Contraseña</h3>
                  <p className="text-gray-700 mb-6">
                    Ingresá tu email y te enviaremos instrucciones para restablecer tu contraseña.
                  </p>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={resetLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white disabled:opacity-50"
                      placeholder="tu@email.com"
                    />
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {resetLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar Instrucciones'
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CuentaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    }>
      <CuentaContent />
    </Suspense>
  );
}